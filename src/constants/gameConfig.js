export const GAME_CONFIG = {
  // GPS tracking
  GPS_UPDATE_INTERVAL_MS: 2000,
  MIN_DISTANCE_TO_RECORD_M: 5,
  CAPTURE_CLOSE_THRESHOLD_M: 20,
  MIN_TERRITORY_AREA_M2: 500,
  MAX_PATH_POINTS: 500,

  // Anti-cheat
  MAX_SPEED_KMH: 30,
  TELEPORT_THRESHOLD_M: 200,
  MIN_POINTS_FOR_CAPTURE: 10,

  // Territory
  TERRITORY_OPACITY: 0.35,
  TERRITORY_STROKE_WIDTH: 2,
  TERRITORY_STROKE_OPACITY: 0.8,

  // Game
  XP_PER_M2: 0.001,
  XP_PER_CAPTURE: 50,
  POINTS_PER_M2: 1,

  // Map
  DEFAULT_ZOOM: 15,
  TASHKENT_CENTER: [41.2995, 69.2401],
  SAMARKAND_CENTER: [39.6547, 66.9758],
  NAMANGAN_CENTER: [41.0011, 71.6725],

  // Colors
  PLAYER_COLORS: [
    '#6366f1', // indigo
    '#22d3ee', // cyan
    '#10b981', // green
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // violet
    '#f97316', // orange
    '#06b6d4', // light cyan
  ],

  // Ranks
  RANKS: [
    { name: 'Yangi Boshlagan', minXp: 0, icon: '🌱' },
    { name: 'Kuchayuvchi', minXp: 500, icon: '⚡' },
    { name: 'Hududchi', minXp: 2000, icon: '🗺️' },
    { name: 'Sardor', minXp: 5000, icon: '⚔️' },
    { name: 'General', minXp: 15000, icon: '🎖️' },
    { name: 'Qo\'mondon', minXp: 50000, icon: '👑' },
    { name: 'Legenda', minXp: 150000, icon: '🔱' },
  ],
}

export const TERRITORY_COLORS = {
  own: '#6366f1',
  ally: '#10b981',
  enemy: '#ef4444',
  neutral: '#475569',
}

export const NOTIFICATION_TYPES = {
  ATTACK: 'attack',
  CAPTURE: 'capture',
  DEFEND: 'defend',
  CLAN: 'clan',
  SYSTEM: 'system',
  LEVEL_UP: 'levelup',
}
