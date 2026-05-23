import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'
import { Sword } from 'lucide-react'
import { GAME_CONFIG } from '../constants/gameConfig'

const AVATAR_OPTIONS = ['⚡', '🔥', '🌊', '🎯', '💜', '🛡️', '🗡️', '🌟']

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    avatar: '⚡',
    color: '#6366f1',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.username.length < 3)
      return setError('Foydalanuvchi nomi kamida 3 ta belgi bo\'lishi kerak')
    if (form.password.length < 6)
      return setError('Parol kamida 6 ta belgi bo\'lishi kerak')
    const result = await register(form.username, form.email, form.password, form.avatar, form.color)
    if (result.success) {
      navigate('/map')
    } else {
      setError(result.error || 'Ro\'yxatdan o\'tishda xato yuz berdi')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 py-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-text-primary">
            Zona<span className="text-neon-purple">Jang</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">Yangi Jangchi</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar */}
          <div>
            <label className="text-xs text-text-secondary mb-2 block">Avatar tanlang</label>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setForm({ ...form, avatar: av })}
                  className={`h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    form.avatar === av
                      ? 'bg-neon-purple/20 border-2 border-neon-purple scale-110'
                      : 'bg-bg-elevated border border-bg-border'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-text-secondary mb-2 block">Hudud rangi</label>
            <div className="flex gap-2 flex-wrap">
              {GAME_CONFIG.PLAYER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.color === c ? 'scale-125 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">
              Foydalanuvchi nomi *
            </label>
            <input
              type="text"
              placeholder="sardor_boss"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              maxLength={20}
              autoCapitalize="none"
            />
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Email *</label>
            <input
              type="email"
              placeholder="email@manzil.uz"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Parol *</label>
            <input
              type="password"
              placeholder="kamida 6 belgi"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-neon-red text-sm text-center py-2 bg-red-500/10 rounded-xl border border-red-500/20"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileTap={{ scale: 0.97 }}
            className="btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <Sword size={18} />
                <span>Jangga Kirish</span>
              </>
            )}
          </motion.button>

          <p className="text-center text-text-secondary text-sm">
            Hisobingiz bormi?{' '}
            <Link to="/login" className="text-neon-purple font-semibold">
              Kirish
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
