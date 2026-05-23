import { useEffect } from 'react'
import {
  connectSocket,
  disconnectSocket,
  onTerritoryNew,
  onTerritoryRemoved,
  onPlayerMoved,
  onBattleStarted,
  onNotification,
} from '../services/socket'
import { useGameStore } from '../store/useGameStore'
import { useNotificationStore } from '../store/useNotificationStore'

export function useWebSocket(token) {
  const { addTerritory, removeTerritory, updateLivePlayer, removeLivePlayer } = useGameStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!token) return

    const socket = connectSocket(token)

    const cleanups = [
      onTerritoryNew((territory) => addTerritory(territory)),
      onTerritoryRemoved(({ id }) => removeTerritory(id)),
      onPlayerMoved((player) => {
        if (player.online === false) {
          removeLivePlayer(player.id)
        } else {
          updateLivePlayer(player)
        }
      }),
      onBattleStarted((battle) => {
        addNotification({
          type: 'attack',
          message: `${battle.attackerUsername} sizning hududingizga hujum qilmoqda!`,
          urgent: true,
        })
      }),
      onNotification((n) => addNotification(n)),
    ]

    socket.on('connect', () => {
      console.log('WebSocket ulandi')
    })

    socket.on('disconnect', () => {
      console.log('WebSocket uzildi')
    })

    return () => {
      cleanups.forEach((fn) => fn())
      disconnectSocket()
    }
  }, [token])
}
