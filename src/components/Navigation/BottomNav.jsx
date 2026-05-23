import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Map, Trophy, User, Users, Bell } from 'lucide-react'
import { useNotificationStore } from '../../store/useNotificationStore'

const TABS = [
  { to: '/map', icon: Map, label: 'Xarita' },
  { to: '/leaderboard', icon: Trophy, label: 'Reyting' },
  { to: '/clan', icon: Users, label: 'Jamoa' },
  { to: '/notifications', icon: Bell, label: 'Xabar' },
  { to: '/profile', icon: User, label: 'Profil' },
]

export function BottomNav() {
  const { unreadCount } = useNotificationStore()
  const unread = unreadCount()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[900] safe-area-pb">
      <div className="glass-card border-t border-bg-border px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {TABS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className="flex-1">
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`flex flex-col items-center gap-0.5 py-2 relative transition-colors ${
                    isActive ? 'text-neon-purple' : 'text-text-muted'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-neon-purple rounded-full"
                    />
                  )}

                  <div className="relative">
                    <Icon
                      size={22}
                      className={isActive ? 'drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]' : ''}
                    />
                    {to === '/notifications' && unread > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 bg-neon-red text-white text-[9px] font-bold
                                   w-4 h-4 rounded-full flex items-center justify-center"
                      >
                        {unread > 9 ? '9+' : unread}
                      </motion.span>
                    )}
                  </div>

                  <span className={`text-[10px] font-medium ${isActive ? 'text-neon-purple' : ''}`}>
                    {label}
                  </span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
