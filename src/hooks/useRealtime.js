import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/useGameStore'
import { useNotificationStore } from '../store/useNotificationStore'
import { useAuthStore } from '../store/useAuthStore'

export function useRealtime() {
  const posChannelRef = useRef(null)
  const user = useAuthStore((s) => s.user)
  const { addTerritory, removeTerritory, updateLivePlayer } = useGameStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!user?.id) return

    // ── 1. Territory o'zgarishlari ─────────────────────────────
    // MUHIM: barcha .on() lar .subscribe() DAN OLDIN zanjirlanadi
    const territoriesChannel = supabase
      .channel(`territories-db-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'territories' },
        ({ new: row }) => {
          if (row.user_id !== user.id) addTerritory(row)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'territories' },
        ({ old: row }) => removeTerritory(row.id)
      )
      .subscribe()

    // ── 2. Foydalanuvchiga kelgan notificationlar ──────────────
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
          addNotification({ ...row, urgent: row.type === 'attack' })
      )
      .subscribe()

    // ── 3. O'yinchi pozitsiyalari (broadcast, DBsiz) ───────────
    // { config: { broadcast: { self: false } } } ishlatilmaydi —
    // u ichida presence triggerlaydi va StrictMode da crash qiladi.
    // O'z pozitsiyamizni filtr payload.userId === user.id orqali qilamiz.
    const posChannel = supabase
      .channel('player-positions')
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

    posChannelRef.current = posChannel

    return () => {
      supabase.removeChannel(territoriesChannel)
      supabase.removeChannel(notifChannel)
      supabase.removeChannel(posChannel)
      posChannelRef.current = null
    }
  }, [user?.id])

  // GPS pozitsiyasini boshqa o'yinchilarga yuborish
  const broadcastPosition = useCallback(
    (lat, lng) => {
      if (!user || !posChannelRef.current) return
      posChannelRef.current.send({
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
