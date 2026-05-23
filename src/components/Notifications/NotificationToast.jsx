import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '../../store/useNotificationStore'
import { Sword, MapPin, Users, Zap, AlertTriangle } from 'lucide-react'
import { NOTIFICATION_TYPES } from '../../constants/gameConfig'

const ICONS = {
  [NOTIFICATION_TYPES.ATTACK]: { icon: Sword, color: 'text-neon-red', bg: 'bg-red-500/10 border-red-500/30' },
  [NOTIFICATION_TYPES.CAPTURE]: { icon: MapPin, color: 'text-neon-green', bg: 'bg-green-500/10 border-green-500/30' },
  [NOTIFICATION_TYPES.CLAN]: { icon: Users, color: 'text-neon-cyan', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  [NOTIFICATION_TYPES.LEVEL_UP]: { icon: Zap, color: 'text-neon-amber', bg: 'bg-amber-500/10 border-amber-500/30' },
  [NOTIFICATION_TYPES.SYSTEM]: { icon: AlertTriangle, color: 'text-text-secondary', bg: 'bg-bg-elevated border-bg-border' },
}

export function NotificationToast() {
  const { toasts } = useNotificationStore()

  return (
    <div className="fixed top-4 left-0 right-0 z-[1100] px-4 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = ICONS[toast.type] || ICONS[NOTIFICATION_TYPES.SYSTEM]
          const Icon = config.icon
          return (
            <motion.div
              key={toast.toastId}
              initial={{ opacity: 0, y: -60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border pointer-events-auto ${config.bg}`}
            >
              <div className={`shrink-0 ${config.color}`}>
                <Icon size={18} />
              </div>
              <p className="text-sm text-text-primary font-medium leading-snug flex-1">
                {toast.message}
              </p>
              {toast.urgent && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-2 rounded-full bg-neon-red shrink-0"
                />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
