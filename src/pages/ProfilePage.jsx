import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useGameStore } from '../store/useGameStore'
import { formatArea } from '../utils/gpsUtils'
import { getPlayerRank, xpProgress } from '../utils/territoryUtils'
import { GAME_CONFIG } from '../constants/gameConfig'
import { LogOut, Map, Zap, Trophy, Flag } from 'lucide-react'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { territories } = useGameStore()

  if (!user) return null

  const currentRank = getPlayerRank(user.xp || 0, GAME_CONFIG.RANKS)
  const progress = xpProgress(user.xp || 0, GAME_CONFIG.RANKS)
  const ownTerritories = territories.filter(
    (t) => t.userId === user.id || t.userId === 'current_user'
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const STATS = [
    { icon: Map, label: 'Jami Hudud', value: formatArea(user.totalArea || 0), color: 'text-neon-purple' },
    { icon: Flag, label: 'Hududlar', value: ownTerritories.length, color: 'text-neon-cyan' },
    { icon: Zap, label: 'Tajriba', value: `${(user.xp || 0).toLocaleString()} XP`, color: 'text-neon-amber' },
    { icon: Trophy, label: 'Daraja', value: currentRank.name, color: 'text-neon-green' },
  ]

  return (
    <div className="h-full bg-bg-base overflow-y-auto pb-20">
      {/* Header */}
      <div className="relative px-4 pt-14 pb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 to-transparent pointer-events-none" />

        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 10px rgba(99,102,241,0.3)',
                  '0 0 25px rgba(99,102,241,0.6)',
                  '0 0 10px rgba(99,102,241,0.3)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
              style={{
                backgroundColor: `${user.color || '#6366f1'}20`,
                border: `2px solid ${user.color || '#6366f1'}`,
              }}
            >
              {user.avatar || '⚡'}
            </motion.div>

            <div>
              <h2 className="text-xl font-black text-text-primary">{user.username}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-lg">{currentRank.icon}</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: user.color || '#6366f1' }}
                >
                  {currentRank.name}
                </span>
              </div>
              {user.clan ? (
                <p className="text-xs text-text-secondary mt-0.5">🛡️ {user.clan}</p>
              ) : (
                <p className="text-xs text-text-muted mt-0.5">Jamoa yo'q</p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-bg-elevated border border-bg-border text-text-muted
                       active:text-neon-red active:border-red-500/30 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* XP Progress */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-text-secondary mb-2">
            <span>
              {currentRank.icon} {currentRank.name}
            </span>
            {progress.nextRank && (
              <span className="text-neon-purple">
                {progress.nextRank.icon} {progress.nextRank.name}
              </span>
            )}
          </div>
          <div className="h-2.5 bg-bg-elevated rounded-full overflow-hidden border border-bg-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress.percent, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan"
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>{progress.current.toLocaleString()} XP</span>
            {progress.total > 0 && <span>{progress.total.toLocaleString()} XP</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-4">
        {STATS.map(({ icon: Icon, label, value, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-4 border border-bg-border"
          >
            <Icon size={18} className={`mb-2 ${color}`} />
            <p className={`text-lg font-black ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Territories */}
      <div className="px-4">
        <h3 className="text-sm font-bold text-text-secondary mb-3 uppercase tracking-wide">
          Mening Hududlarim
        </h3>
        {ownTerritories.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center border border-bg-border">
            <p className="text-4xl mb-2">🗺️</p>
            <p className="text-text-secondary text-sm">Hali hudud yo'q</p>
            <p className="text-text-muted text-xs mt-1">
              Xaritaga borib yurishni boshlang!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ownTerritories.map((t) => (
              <div
                key={t.id}
                className="glass-card rounded-xl p-3 border border-bg-border flex items-center gap-3"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: t.color || user.color || '#6366f1' }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {formatArea(t.area)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(t.capturedAt).toLocaleDateString('uz-UZ')}
                    {t.isLocal && (
                      <span className="ml-1 text-neon-amber">(mahalliy)</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
