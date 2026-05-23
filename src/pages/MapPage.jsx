import { useEffect } from 'react'
import { MapView } from '../components/Map/MapView'
import { HUD } from '../components/HUD/HUD'
import { CaptureControls } from '../components/Map/CaptureControls'
import { useGPS } from '../hooks/useGPS'
import { useRealtime } from '../hooks/useRealtime'
import { useAuthStore } from '../store/useAuthStore'
import { useGameStore } from '../store/useGameStore'
import { useNotificationStore } from '../store/useNotificationStore'

export default function MapPage() {
  const user = useAuthStore((s) => s.user)
  const { fetchTerritories } = useGameStore()
  const { fetchNotifications } = useNotificationStore()

  // Realtime: territory + notification + player broadcast
  const { broadcastPosition } = useRealtime()

  // GPS tracking (broadcastPosition realtime ga ulaydi)
  useGPS({ broadcastPosition })

  useEffect(() => {
    fetchTerritories()
    if (user?.id) fetchNotifications(user.id)
  }, [user?.id])

  return (
    <>
      <div className="fixed inset-0 z-0">
        <MapView />
      </div>
      <HUD />
      <CaptureControls />
    </>
  )
}
