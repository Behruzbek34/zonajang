import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { GAME_CONFIG } from '../constants/gameConfig'

export const useAuthStore = create((set, get) => ({
  user: null,       // profiles row merged with auth info
  session: null,
  isLoading: true,  // true while checking existing session on app start

  // Called once in App.jsx on mount
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const profile = await get()._fetchProfile(session.user.id)
      set({ session, user: profile, isLoading: false })
    } else {
      set({ isLoading: false })
    }

    // Keep store in sync with Supabase session changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const profile = await get()._fetchProfile(session.user.id)
        set({ session, user: profile })
      } else {
        set({ session: null, user: null })
      }
    })
  },

  _fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  },

  login: async (email, password) => {
    set({ isLoading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ isLoading: false })
      return { success: false, error: _uzError(error.message) }
    }
    const profile = await get()._fetchProfile(data.user.id)
    set({ session: data.session, user: profile, isLoading: false })
    return { success: true }
  },

  register: async (username, email, password, avatar = '⚡', color = '#6366f1') => {
    set({ isLoading: true })

    // Username bandligini tekshirish
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      set({ isLoading: false })
      return { success: false, error: 'Bu foydalanuvchi nomi band. Boshqa nom tanlang.' }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, avatar, color } },
    })

    if (error) {
      set({ isLoading: false })
      return { success: false, error: _uzError(error.message) }
    }

    // Trigger profil yaratadi — bir oz kutish kerak
    await new Promise((r) => setTimeout(r, 800))
    const profile = await get()._fetchProfile(data.user.id)
    set({ session: data.session, user: profile, isLoading: false })
    return { success: true }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  // Profil ma'lumotlarini yangilash (clan o'zgarganda, XP qo'shilganda)
  refreshProfile: async () => {
    const { session } = get()
    if (!session) return
    const profile = await get()._fetchProfile(session.user.id)
    if (profile) set({ user: profile })
  },

  getPlayerRank: () => {
    const { user } = get()
    const xp = user?.xp || 0
    return (
      [...GAME_CONFIG.RANKS].reverse().find((r) => xp >= r.minXp) ||
      GAME_CONFIG.RANKS[0]
    )
  },
}))

// Supabase xato xabarlarini o'zbekchaga tarjima
function _uzError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email yoki parol noto\'g\'ri.'
  if (msg.includes('Email not confirmed'))       return 'Emailingizni tasdiqlang (spam papkani ham tekshiring).'
  if (msg.includes('User already registered'))   return 'Bu email allaqachon ro\'yxatdan o\'tgan.'
  if (msg.includes('Password should be'))        return 'Parol kamida 6 ta belgi bo\'lishi kerak.'
  if (msg.includes('Unable to validate'))        return 'Tarmoq xatosi. Qayta urinib ko\'ring.'
  return msg
}
