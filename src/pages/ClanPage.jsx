import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'
import { formatArea } from '../utils/gpsUtils'
import { GAME_CONFIG } from '../constants/gameConfig'
import { Users, Plus, Map, Shield, X, RefreshCw } from 'lucide-react'

const BADGE_OPTIONS = ['🛡️', '⚔️', '🔥', '🌊', '⚡', '🎯', '💜', '🦅', '🐉', '🌟', '💎', '🏆']

export default function ClanPage() {
  const { user, refreshProfile } = useAuthStore()
  const [clans, setClans] = useState([])
  const [myClan, setMyClan] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newClan, setNewClan] = useState({ name: '', description: '', badge: '🛡️' })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchClans = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('clans_with_stats')
      .select('*')
      .order('total_area', { ascending: false })
    setClans(data || [])
    setIsLoading(false)
  }

  const fetchMyClan = async () => {
    if (!user?.clan_id) { setMyClan(null); return }
    const { data } = await supabase
      .from('clans_with_stats')
      .select('*')
      .eq('id', user.clan_id)
      .single()
    setMyClan(data)
  }

  useEffect(() => {
    fetchClans()
  }, [])

  useEffect(() => {
    fetchMyClan()
  }, [user?.clan_id])

  const handleJoin = async (clan) => {
    if (!user) return
    setIsSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ clan_id: clan.id })
      .eq('id', user.id)
    if (err) { setError(err.message); setIsSaving(false); return }
    await refreshProfile()
    await fetchClans()
    setIsSaving(false)
  }

  const handleLeave = async () => {
    if (!user) return
    setIsSaving(true)
    const { error: err } = await supabase
      .from('profiles')
      .update({ clan_id: null })
      .eq('id', user.id)
    if (err) { setError(err.message); setIsSaving(false); return }
    await refreshProfile()
    setMyClan(null)
    await fetchClans()
    setIsSaving(false)
  }

  const handleCreate = async () => {
    if (!newClan.name.trim()) return setError('Jamoa nomi kiritilmadi')
    if (!user) return
    setIsSaving(true)
    setError('')

    // Clan yaratish
    const { data: created, error: cErr } = await supabase
      .from('clans')
      .insert({
        name: newClan.name.trim(),
        badge: newClan.badge,
        description: newClan.description.trim() || null,
        leader_id: user.id,
      })
      .select()
      .single()

    if (cErr) {
      setError(cErr.message.includes('unique') ? 'Bu nom band. Boshqa nom tanlang.' : cErr.message)
      setIsSaving(false)
      return
    }

    // Profilni yangilash
    await supabase.from('profiles').update({ clan_id: created.id }).eq('id', user.id)
    await refreshProfile()
    await fetchClans()
    setShowCreate(false)
    setNewClan({ name: '', description: '', badge: '🛡️' })
    setIsSaving(false)
  }

  return (
    <div className="h-full bg-bg-base overflow-y-auto pb-20">
      <div className="px-4 pt-14 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">
            Ja<span className="text-neon-cyan">moa</span>
          </h1>
          <p className="text-text-secondary text-sm">Birgalikda hudud egallang</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={fetchClans}
            disabled={isLoading}
            className="p-2.5 glass-card rounded-xl border border-bg-border text-text-muted disabled:opacity-40"
          >
            <motion.div
              animate={isLoading ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            >
              <RefreshCw size={18} />
            </motion.div>
          </motion.button>
          {!user?.clan_id && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                         bg-neon-purple/20 border border-neon-purple/40 text-neon-purple text-sm font-medium"
            >
              <Plus size={16} />
              Yaratish
            </motion.button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-neon-red text-sm">{error}</p>
        </div>
      )}

      {/* Mening jamoam */}
      {myClan && (
        <div className="px-4 mb-4">
          <div className="glass-card rounded-2xl p-4 border border-neon-cyan/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{myClan.badge}</div>
                <div>
                  <p className="text-xs text-neon-cyan font-medium uppercase tracking-wide">Mening Jamoam</p>
                  <h3 className="font-black text-text-primary">{myClan.name}</h3>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLeave}
                disabled={isSaving}
                className="p-2 rounded-xl bg-bg-elevated border border-bg-border text-text-muted
                           active:text-neon-red disabled:opacity-40"
              >
                <X size={16} />
              </motion.button>
            </div>
            <div className="flex gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Users size={12} className="text-text-muted" />
                {myClan.member_count || 1} a'zo
              </span>
              <span className="flex items-center gap-1">
                <Map size={12} className="text-text-muted" />
                {formatArea(myClan.total_area || 0)}
              </span>
            </div>
            {myClan.description && (
              <p className="text-xs text-text-muted mt-2 pt-2 border-t border-bg-border">
                {myClan.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Jamoalar ro'yxati */}
      <div className="px-4">
        {!user?.clan_id && (
          <p className="text-xs text-text-muted uppercase tracking-wide mb-3">
            Jamoalarga Qo'shiling
          </p>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-4 border border-bg-border animate-pulse h-24" />
            ))}
          </div>
        ) : clans.filter((c) => c.id !== user?.clan_id).length === 0 && !user?.clan_id ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🛡️</p>
            <p className="text-text-secondary font-medium">Hali jamoa yo'q</p>
            <p className="text-text-muted text-sm mt-1">Birinchi jamoani yarating!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {clans
              .filter((c) => c.id !== user?.clan_id)
              .map((clan, idx) => (
                <motion.div
                  key={clan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className="glass-card rounded-2xl p-4 border border-bg-border"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">{clan.badge}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text-primary truncate">{clan.name}</h3>
                      {clan.description && (
                        <p className="text-xs text-text-secondary mt-0.5">{clan.description}</p>
                      )}
                      <div className="flex gap-3 text-xs text-text-muted mt-1.5">
                        <span className="flex items-center gap-0.5">
                          <Users size={11} />{clan.member_count || 0} a'zo
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Map size={11} />{formatArea(clan.total_area || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!user?.clan_id && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleJoin(clan)}
                      disabled={isSaving}
                      className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold
                                 border border-neon-cyan/30 text-neon-cyan bg-cyan-500/10
                                 active:bg-cyan-500/20 disabled:opacity-40 transition-all"
                    >
                      Qo'shilish
                    </motion.button>
                  )}
                </motion.div>
              ))}
          </div>
        )}
      </div>

      {/* Jamoa yaratish modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[1200] flex items-end px-4 pb-8"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="glass-card w-full rounded-3xl p-6 border border-bg-border"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-text-primary">Yangi Jamoa</h3>
                <button onClick={() => setShowCreate(false)} className="text-text-muted">
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-text-secondary mb-2 block">Badge</label>
                  <div className="grid grid-cols-6 gap-2">
                    {BADGE_OPTIONS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setNewClan({ ...newClan, badge: b })}
                        className={`h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                          newClan.badge === b
                            ? 'bg-neon-purple/20 border-2 border-neon-purple'
                            : 'bg-bg-elevated border border-bg-border'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block">Jamoa nomi *</label>
                  <input
                    type="text"
                    placeholder="Toshkent Qahramonlari"
                    value={newClan.name}
                    onChange={(e) => setNewClan({ ...newClan, name: e.target.value })}
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block">Tavsif (ixtiyoriy)</label>
                  <input
                    type="text"
                    placeholder="Jamoangiz haqida..."
                    value={newClan.description}
                    onChange={(e) => setNewClan({ ...newClan, description: e.target.value })}
                    maxLength={60}
                  />
                </div>
                {error && <p className="text-neon-red text-sm text-center">{error}</p>}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  disabled={isSaving}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <><Shield size={18} /><span>Jamoa Yaratish</span></>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
