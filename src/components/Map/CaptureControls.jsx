import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Locate } from 'lucide-react'
import { useGameStore } from '../../store/useGameStore'
import { useNotificationStore } from '../../store/useNotificationStore'
import { useAuthStore } from '../../store/useAuthStore'
import { formatArea } from '../../utils/gpsUtils'

export function CaptureControls() {
  const {
    isTracking,
    startTracking,
    stopTracking,
    captureTerritory,
    currentPath,
    currentPosition,
    setMapCenter,
  } = useGameStore()
  const { addNotification } = useNotificationStore()
  const { user, refreshProfile } = useAuthStore()
  const [lastCapture, setLastCapture] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleStartStop = async () => {
    if (isTracking) {
      if (currentPath.length >= 10) {
        setIsSaving(true)
        const result = await captureTerritory(user)
        setIsSaving(false)
        if (result?.success) {
          // Trigger XP va area ni yangiladi — profilni refresh qilamiz
          await refreshProfile()
          addNotification({
            type: 'capture',
            message: `Yangi yer egallandi! +${result.xp} XP · ${formatArea(result.territory?.area_m2 || 0)}`,
            urgent: false,
          })
          setLastCapture(result)
          setTimeout(() => setLastCapture(null), 4000)
        } else {
          addNotification({ type: 'system', message: result?.reason || 'Xato yuz berdi', urgent: false })
          stopTracking()
        }
      } else {
        stopTracking()
      }
    } else {
      startTracking()
    }
  }

  const handleLocate = () => {
    if (currentPosition) {
      setMapCenter(currentPosition)
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      )
    }
  }

  return (
    <>
      {/* Muvaffaqiyatli egallash popup */}
      <AnimatePresence>
        {lastCapture && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-[1100] pointer-events-none"
          >
            <div className="glass-card border border-neon-green/40 rounded-3xl p-6 text-center shadow-neon-green">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: 2, duration: 0.4 }}
                className="text-5xl mb-3"
              >
                🎉
              </motion.div>
              <p className="text-neon-green font-bold text-lg mb-1">Hudud Egallandi!</p>
              <p className="text-text-secondary text-sm mb-2">
                {formatArea(lastCapture.territory?.area_m2 || 0)}
              </p>
              <p className="text-neon-amber font-bold">+{lastCapture.xp} XP</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Joylashuvni topish */}
      <div className="fixed right-4 z-[1000]" style={{ bottom: '100px' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLocate}
          className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center
                     border border-bg-border active:border-neon-cyan transition-colors"
        >
          <Locate size={20} className="text-neon-cyan" />
        </motion.button>
      </div>

      {/* Asosiy tugma */}
      <div className="fixed left-0 right-0 z-[1000] flex justify-center px-4" style={{ bottom: '72px' }}>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={handleStartStop}
          disabled={isSaving}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base
                      transition-all duration-300 shadow-lg disabled:opacity-60 ${
                        isTracking
                          ? 'bg-neon-red/20 border border-neon-red/50 text-neon-red shadow-neon-red'
                          : 'bg-neon-purple/20 border border-neon-purple/50 text-neon-purple shadow-neon-purple'
                      }`}
        >
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full"
              />
              <span>Saqlanmoqda...</span>
            </>
          ) : (
            <>
              <motion.div
                animate={isTracking ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {isTracking ? <Square size={20} /> : <Play size={20} />}
              </motion.div>
              <span>{isTracking ? 'Tugatish' : 'Yozishni Boshlash'}</span>
              {isTracking && currentPath.length > 0 && (
                <span className="text-xs bg-current/10 px-2 py-0.5 rounded-full">
                  {currentPath.length} nuqta
                </span>
              )}
            </>
          )}
        </motion.button>
      </div>
    </>
  )
}
