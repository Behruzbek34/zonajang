import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useNotificationStore } from '../store/useNotificationStore'
import { AntiCheat } from '../utils/antiCheatUtils'

export function useGPS({ broadcastPosition } = {}) {
  const watchRef = useRef(null)
  const lastPosRef = useRef(null)
  const lastTimestampRef = useRef(null)
  const { isTracking, updatePosition } = useGameStore()
  const { showToast } = useNotificationStore()

  const handlePosition = useCallback(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      const newPos = [lat, lng]
      const now = Date.now()

      const check = AntiCheat.validatePosition(newPos, lastPosRef.current, lastTimestampRef.current)
      if (!check.valid) {
        showToast({ type: 'system', message: check.message, urgent: false })
        return
      }
      if (check.warning) {
        showToast({ type: 'system', message: check.warning, urgent: false })
      }

      lastPosRef.current = newPos
      lastTimestampRef.current = now

      updatePosition(newPos)

      // Boshqa o'yinchilarga pozitsiyani broadcast qilish
      broadcastPosition?.(lat, lng)
    },
    [updatePosition, showToast, broadcastPosition]
  )

  const handleError = useCallback(
    (err) => {
      const msgs = {
        1: 'GPS ruxsat berilmadi. Brauzer sozlamalarini tekshiring.',
        2: 'GPS signali topilmadi. Ochiq joyga chiqing.',
        3: 'GPS vaqt tugadi. Qayta urinib ko\'ring.',
      }
      showToast({ type: 'system', message: msgs[err.code] || 'GPS xatosi.', urgent: true })
    },
    [showToast]
  )

  useEffect(() => {
    if (!navigator.geolocation) {
      showToast({ type: 'system', message: 'Brauzer GPS-ni qo\'llab-quvvatlamaydi.', urgent: true })
      return
    }
    if (isTracking) {
      watchRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
      )
    } else {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = null
      }
    }
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [isTracking, handlePosition, handleError])
}
