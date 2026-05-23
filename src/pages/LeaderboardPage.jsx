import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import { useAuthStore } from '../store/useAuthStore'
import { formatArea } from '../utils/gpsUtils'
import { GAME_CONFIG } from '../constants/gameConfig'
import { Trophy, Map, Zap, Users, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TABS = [
  { id: 'players', label: 'Jangchilar', icon: Trophy },
  { id: 'clans', label: 'Jamoalar', icon: Users },
]

function getRankIcon(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function getPlayerRank(xp) {
  return (
    [...GAME_CONFIG.RANKS].reverse().find((r) => xp >= r.minXp) || GAME_CONFIG.RANKS[0]
  )
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('players')
  const { leaderboard, fetchLeaderboard, isLoadingLeaderboard } = useGameStore()
  const [clans, setClans] = useState([])
  const [isLoadingClans, setIsLoadingClans] = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    fetchLeaderboard()
    loadClans()
  }, [])

  const loadClans = async () => {
    setIsLoadingClans(true)
    const { data } = await supabase
      .from('clans_with_stats')
      .select('*')
      .order('total_area', { ascending: false })
      .limit(50)
    setClans(data || [])
    setIsLoadingClans(false)
  }

  const ranked = leaderboard

  return (
    <div className="h-full bg-bg-base overflow-y-auto pb-20">
      <div className="px-4 pt-14 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">
            Top <span className="text-neon-amber">Reyting</span>
          </h1>
          <p className="text-text-secondary text-sm">
            {ranked.length > 0 ? `${ranked.length} ta jangchi` : 'Hali hech kim yo\'q'}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { fetchLeaderboard(); loadClans() }}
          disabled={isLoadingLeaderboard}
          className="p-2.5 glass-card rounded-xl border border-bg-border text-text-muted disabled:opacity-40"
        >
          <motion.div
            animate={isLoadingLeaderboard ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          >
            <RefreshCw size={18} />
          </motion.div>
        </motion.button>
      </div>

      <div className="flex gap-2 px-4 mb-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-neon-purple/20 border border-neon-purple/40 text-neon-purple'
                : 'bg-bg-elevated border border-bg-border text-text-secondary'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Players */}
      {activeTab === 'players' && (
        <div className="px-4">
          {isLoadingLeaderboard ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-2xl p-4 border border-bg-border animate-pulse h-16" />
              ))}
            </div>
          ) : ranked.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🏆</p>
              <p className="text-text-secondary font-medium">Hali reyting yo'q</p>
              <p className="text-text-muted text-sm mt-1">Birinchi bo'ling — hudud egallang!</p>
            </div>
          ) : (
            <>
              {ranked.length >= 3 && (
                <div className="glass-card rounded-2xl p-4 mb-3 flex items-end justify-center gap-3">
                  {[ranked[1], ranked[0], ranked[2]].map((p, i) => {
                    const heights = ['h-20', 'h-28', 'h-16']
                    const r = i === 0 ? 2 : i === 1 ? 1 : 3
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-center gap-1 flex-1"
                      >
                        <div className="text-xl">{p.avatar || '⚡'}</div>
                        <div className="text-xs font-bold text-text-primary truncate w-full text-center">
                          {p.username}
                        </div>
                        <div className="text-[10px] text-text-secondary">
                          {formatArea(p.total_area_m2 || 0)}
                        </div>
                        <div
                          className={`w-full ${heights[i]} rounded-t-xl flex items-center justify-center text-lg font-black`}
                          style={{
                            backgroundColor: `${p.color || '#6366f1'}30`,
                            border: `1px solid ${p.color || '#6366f1'}50`,
                          }}
                        >
                          {getRankIcon(r)}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {ranked.map((player, idx) => {
                  const rank = idx + 1
                  const isMe = player.id === user?.id
                  const pRank = getPlayerRank(player.xp || 0)
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border ${
                        isMe
                          ? 'bg-neon-purple/10 border-neon-purple/30'
                          : 'glass-card border-bg-border'
                      }`}
                    >
                      <div className="w-8 text-center">
                        <span className={`font-black ${rank <= 3 ? 'text-lg' : 'text-sm text-text-secondary'}`}>
                          {getRankIcon(rank)}
                        </span>
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{
                          backgroundColor: `${player.color || '#6366f1'}20`,
                          border: `1px solid ${player.color || '#6366f1'}40`,
                        }}
                      >
                        {player.avatar || '⚡'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className={`font-bold text-sm truncate ${isMe ? 'text-neon-purple' : 'text-text-primary'}`}>
                            {player.username}
                          </p>
                          {isMe && <span className="text-[10px] text-neon-purple shrink-0">(Siz)</span>}
                        </div>
                        <span className="text-[10px] text-text-muted">
                          {pRank.icon} {pRank.name}{player.clan ? ` · ${player.clan}` : ''}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: player.color || '#6366f1' }}>
                          {formatArea(player.total_area_m2 || 0)}
                        </p>
                        <div className="flex items-center gap-0.5 justify-end">
                          <Zap size={10} className="text-neon-amber" />
                          <span className="text-[10px] text-text-secondary">
                            {(player.xp || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Clans */}
      {activeTab === 'clans' && (
        <div className="px-4">
          {isLoadingClans ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card rounded-2xl p-4 border border-bg-border animate-pulse h-20" />
              ))}
            </div>
          ) : clans.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🛡️</p>
              <p className="text-text-secondary font-medium">Hali jamoa yo'q</p>
              <p className="text-text-muted text-sm mt-1">Jamoa yarating!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {clans.map((clan, idx) => (
                <motion.div
                  key={clan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className="glass-card rounded-2xl p-4 border border-bg-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{clan.badge}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-text-secondary">#{idx + 1}</span>
                        <h3 className="font-bold text-text-primary">{clan.name}</h3>
                      </div>
                      {clan.description && (
                        <p className="text-xs text-text-secondary">{clan.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Users size={11} />{clan.member_count || 0} a'zo
                    </span>
                    <span className="flex items-center gap-1">
                      <Map size={11} />{formatArea(clan.total_area || 0)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
