import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'
import { useAuthStore } from '../../store/useAuthStore'
import { formatArea } from '../../utils/gpsUtils'
import { Zap, MapPin, Navigation, Target } from 'lucide-react'

export function HUD() {
  const { isTracking, currentPath, captureProgress, pathLengthM } = useGameStore()
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <>
      {/* Top stats bar — fixed at top, above Leaflet */}
      <div className="fixed top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="flex items-start justify-between px-3 pt-12">
          {/* XP + Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl px-3 py-2 flex flex-col gap-1 pointer-events-auto"
          >
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-neon-amber" />
              <span className="text-xs text-text-secondary">XP</span>
              <span className="text-sm font-bold text-neon-amber">{user.xp.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-neon-purple" />
              <span className="text-xs text-text-secondary">Hudud</span>
              <span className="text-sm font-bold text-neon-purple">
                {formatArea(user.totalArea)}
              </span>
            </div>
          </motion.div>

          {/* Live indicator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl px-3 py-2 flex items-center gap-2 pointer-events-auto"
          >
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 rounded-full bg-neon-green"
            />
            <span className="text-xs font-semibold text-neon-green">JONLI</span>
          </motion.div>
        </div>
      </div>

      {/* Tracking info panel — fixed above capture button, above Leaflet */}
      <AnimatePresence>
        {isTracking && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed left-3 right-3 z-[1000]"
            style={{ bottom: '168px' }}
          >
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  >
                    <Navigation size={16} className="text-neon-purple" />
                  </motion.div>
                  <span className="text-sm font-semibold text-text-primary">Yozilmoqda</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-text-secondary">Nuqtalar</div>
                    <div className="text-sm font-bold text-neon-cyan">{currentPath.length}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-secondary">Masofa</div>
                    <div className="text-sm font-bold text-neon-amber">
                      {pathLengthM >= 1000
                        ? `${(pathLengthM / 1000).toFixed(1)} km`
                        : `${Math.round(pathLengthM)} m`}
                    </div>
                  </div>
                </div>
              </div>

              {captureProgress > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Target size={13} className="text-neon-green" />
                      <span className="text-xs text-neon-green font-medium">Yopilmoqda...</span>
                    </div>
                    <span className="text-xs text-neon-green font-bold">
                      {Math.round(captureProgress * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full"
                      style={{ width: `${captureProgress * 100}%` }}
                      animate={{ boxShadow: ['0 0 4px #10b981', '0 0 12px #10b981', '0 0 4px #10b981'] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
