import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { distanceBetween, isPathClosed, polygonArea, simplifyPath } from '../utils/gpsUtils'
import { GAME_CONFIG } from '../constants/gameConfig'
import { useAuthStore } from './useAuthStore'

export const useGameStore = create((set, get) => ({
  territories: [],
  leaderboard: [],
  livePlayers: [],       // boshqa online o'yinchilar (broadcast orqali)
  mapCenter: GAME_CONFIG.TASHKENT_CENTER,

  isTracking: false,
  currentPath: [],
  currentPosition: null,
  pathLengthM: 0,
  captureProgress: 0,

  isLoadingTerritories: false,
  isLoadingLeaderboard: false,

  setMapCenter: (center) => set({ mapCenter: center }),

  // ── Supabase fetches ──────────────────────────────────────

  fetchTerritories: async () => {
    set({ isLoadingTerritories: true })
    const { data, error } = await supabase
      .from('territories')
      .select('*')
      .order('captured_at', { ascending: false })
    if (!error) set({ territories: data || [] })
    set({ isLoadingTerritories: false })
  },

  fetchLeaderboard: async () => {
    set({ isLoadingLeaderboard: true })
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .limit(100)
    if (!error) set({ leaderboard: data || [] })
    set({ isLoadingLeaderboard: false })
  },

  // ── Realtime callbacks (called from useRealtime hook) ────

  addTerritory: (territory) =>
    set((s) => ({
      territories: [territory, ...s.territories.filter((t) => t.id !== territory.id)],
    })),

  removeTerritory: (id) =>
    set((s) => ({ territories: s.territories.filter((t) => t.id !== id) })),

  updateLivePlayer: (player) =>
    set((s) => ({
      livePlayers: [...s.livePlayers.filter((p) => p.id !== player.id), player],
    })),

  removeLivePlayer: (id) =>
    set((s) => ({ livePlayers: s.livePlayers.filter((p) => p.id !== id) })),

  // ── GPS tracking ─────────────────────────────────────────

  startTracking: () =>
    set({ isTracking: true, currentPath: [], pathLengthM: 0, captureProgress: 0 }),

  stopTracking: () =>
    set({ isTracking: false, currentPath: [], captureProgress: 0, pathLengthM: 0 }),

  updatePosition: (newPos) => {
    const { currentPath, isTracking } = get()
    if (!isTracking) return

    const prev = currentPath[currentPath.length - 1]
    if (prev && distanceBetween(prev, newPos) < GAME_CONFIG.MIN_DISTANCE_TO_RECORD_M) return

    const newPath = [...currentPath, newPos]
    let newLength = get().pathLengthM
    if (prev) newLength += distanceBetween(prev, newPos)

    let captureProgress = 0
    if (newPath.length >= GAME_CONFIG.MIN_POINTS_FOR_CAPTURE) {
      const distToStart = distanceBetween(newPath[0], newPos)
      const threshold = GAME_CONFIG.CAPTURE_CLOSE_THRESHOLD_M * 3
      if (distToStart < threshold) {
        captureProgress = Math.max(0, 1 - distToStart / threshold)
      }
    }

    set({
      currentPath: newPath.slice(-GAME_CONFIG.MAX_PATH_POINTS),
      currentPosition: newPos,
      pathLengthM: newLength,
      captureProgress,
    })

    if (
      newPath.length >= GAME_CONFIG.MIN_POINTS_FOR_CAPTURE &&
      isPathClosed(newPath, GAME_CONFIG.CAPTURE_CLOSE_THRESHOLD_M)
    ) {
      const { user } = useAuthStore.getState()
      if (user) get().captureTerritory(user)
    }
  },

  // ── Territory capture ─────────────────────────────────────

  captureTerritory: async (user) => {
    const { currentPath } = get()
    if (currentPath.length < GAME_CONFIG.MIN_POINTS_FOR_CAPTURE) return null

    const simplified = simplifyPath(currentPath, 0.00005)
    const area = polygonArea(simplified)

    if (area < GAME_CONFIG.MIN_TERRITORY_AREA_M2) {
      return { success: false, reason: `Hudud juda kichik (${Math.round(area)} m²). Kamida 500 m² bo'lishi kerak.` }
    }

    const coordinates = [...simplified, simplified[0]]

    // Supabase ga yozish (trigger XP + area ni o'zi yangilaydi)
    const { data, error } = await supabase
      .from('territories')
      .insert({
        user_id: user.id,
        username: user.username,
        color: user.color || '#6366f1',
        coordinates,
        area_m2: area,
      })
      .select()
      .single()

    set({ currentPath: [], captureProgress: 0, pathLengthM: 0, isTracking: false })

    if (error) return { success: false, reason: 'Serverga saqlashda xato: ' + error.message }

    const xpEarned = Math.max(1, Math.floor(area * GAME_CONFIG.XP_PER_M2)) + GAME_CONFIG.XP_PER_CAPTURE
    return { success: true, territory: data, xp: xpEarned }
  },
}))
