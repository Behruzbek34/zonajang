import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/useGameStore'
import { useNotificationStore } from '../store/useNotificationStore'
import { useAuthStore } from '../store/useAuthStore'

export function useRealtime() {
  const channelsRef = useRef([])
  const user = useAuthStore((s) => s.user)
  const { addTerritory, removeTerritory, updateLivePlayer, removeLivePlayer } = useGameStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!user?.id) return

    // 1. Territory o'zgarishlari (Postgres Realtime)
    const territoriesChannel = supabase
      .channel('territories-db')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'territories' },
        ({ new: row }) => {
          // Boshqa o'yinchilarning yangi hududlarini qo'sh
          if (row.user_id !== user.id) addTerritory(row)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'territories' },
        ({ old: row }) => removeTerritory(row.id)
      )
      .subscribe()

    // 2. Foydalanuvchiga kelgan notificationlar (Postgres Realtime)
    const notifChannel = supabase
      .channel(`notif-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        ({ new: row }) =>
          addNotification({
            ...row,
            urgent: row.type === 'attack',
          })
      )
      .subscribe()

    // 3. O'yinchi pozitsiyalari (Broadcast — DBga yozilmaydi, tez)
    const posChannel = supabase
      .channel('player-positions', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'pos' }, ({ payload }) => {
        if (!payload?.userId || payload.userId === user.id) return
        updateLivePlayer({
          id: payload.userId,
          pos: [payload.lat, payload.lng],
          username: payload.username,
          color: payload.color,
        })
      })
      .subscribe()

    // Offline bo'lganda o'yinchini xaritadan olib tashlash
    posChannel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((p) => removeLivePlayer(p.userId))
    })

    channelsRef.current = [territoriesChannel, notifChannel, posChannel]

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  }, [user?.id])

  // GPS harakatini boshqa o'yinchilarga broadcast qilish
  const broadcastPosition = useCallback(
    (lat, lng) => {
      if (!user) return
      const posChannel = channelsRef.current[2]
      posChannel?.send({
        type: 'broadcast',
        event: 'pos',
        payload: {
          userId: user.id,
          lat,
          lng,
          username: user.username,
          color: user.color,
        },
      })
    },
    [user]
  )

  return { broadcastPosition }
}
