import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNotificationStore } from '../store/useNotificationStore'
import { useAuthStore } from '../store/useAuthStore'
import { Sword, MapPin, Users, Zap, AlertTriangle, CheckCheck, BellOff } from 'lucide-react'
import { NOTIFICATION_TYPES } from '../constants/gameConfig'

const ICONS = {
  [NOTIFICATION_TYPES.ATTACK]:  { icon: Sword,         color: 'text-neon-red',       bg: 'bg-red-500/10 border-red-500/20' },
  [NOTIFICATION_TYPES.CAPTURE]: { icon: MapPin,         color: 'text-neon-green',     bg: 'bg-green-500/10 border-green-500/20' },
  [NOTIFICATION_TYPES.CLAN]:    { icon: Users,          color: 'text-neon-cyan',      bg: 'bg-cyan-500/10 border-cyan-500/20' },
  [NOTIFICATION_TYPES.LEVEL_UP]:{ icon: Zap,            color: 'text-neon-amber',     bg: 'bg-amber-500/10 border-amber-500/20' },
  [NOTIFICATION_TYPES.SYSTEM]:  { icon: AlertTriangle,  color: 'text-text-secondary', bg: 'glass-card border-bg-border' },
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000)    return 'Hozir'
  if (diff < 3600000)  return `${Math.floor(diff / 60000)} daqiqa oldin`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} soat oldin`
  return `${Math.floor(diff / 86400000)} kun oldin`
}

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markRead, markAllRead, isLoading, unreadCount } =
    useNotificationStore()
  const user = useAuthStore((s) => s.user)
  const unread = unreadCount()

  useEffect(() => {
    if (user?.id) fetchNotifications(user.id)
  }, [user?.id])

  return (
    <div className="h-full bg-bg-base overflow-y-auto pb-20">
      <div className="px-4 pt-14 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">
            Xab<span className="text-neon-purple">arlar</span>
          </h1>
          {unread > 0 && (
            <p className="text-text-secondary text-sm">{unread} ta o'qilmagan</p>
          )}
        </div>
        {unread > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => markAllRead(user?.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-elevated
                       border border-bg-border text-text-secondary text-sm"
          >
            <CheckCheck size={15} />
            Barchasini o'qi
          </motion.button>
        )}
      </div>

      <div className="px-4 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-4 border border-bg-border animate-pulse h-16" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <BellOff size={48} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary font-medium">Hali xabar yo'q</p>
            <p className="text-text-muted text-sm mt-1">
              Hudud egallasangiz yoki hujum bo'lsa, bu yerda ko'rinadi
            </p>
          </div>
        ) : (
          notifications.map((n, idx) => {
            const config = ICONS[n.type] || ICONS[NOTIFICATION_TYPES.SYSTEM]
            const Icon = config.icon
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => markRead(n.id)}
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  !n.is_read ? config.bg : 'glass-card border-bg-border opacity-60'
                }`}
              >
                <div className={`shrink-0 mt-0.5 ${config.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary leading-snug">{n.message}</p>
                  <p className="text-xs text-text-muted mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-neon-purple shrink-0 mt-1.5" />
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
