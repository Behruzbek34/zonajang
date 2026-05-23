import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { NOTIFICATION_TYPES } from '../constants/gameConfig'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  toasts: [],
  isLoading: false,

  unreadCount: () => get().notifications.filter((n) => !n.is_read).length,

  fetchNotifications: async (userId) => {
    if (!userId) return
    set({ isLoading: true })
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    set({ notifications: data || [], isLoading: false })
  },

  // Realtime orqali kelgan yoki lokal yaratilgan notification
  addNotification: (notification) => {
    // Supabase row formatiga moslashtirish
    const n = {
      id: notification.id || `local_${Date.now()}`,
      user_id: notification.user_id,
      type: notification.type,
      message: notification.message,
      is_read: false,
      created_at: notification.created_at || new Date().toISOString(),
    }
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 50),
    }))
    if (notification.urgent || notification.type === NOTIFICATION_TYPES.ATTACK) {
      get().showToast(n)
    }
  },

  showToast: (notification) => {
    const toast = { ...notification, toastId: `toast_${Date.now()}` }
    set((s) => ({ toasts: [...s.toasts, toast] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.toastId !== toast.toastId) }))
    }, 4000)
  },

  markRead: async (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    }))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  },

  markAllRead: async (userId) => {
    if (!userId) return
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
    }))
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
  },
}))
