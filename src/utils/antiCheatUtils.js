import { speedKmh, distanceBetween } from './gpsUtils'
import { GAME_CONFIG } from '../constants/gameConfig'

export const AntiCheat = {
  violations: [],

  // Check GPS position for suspicious behavior
  validatePosition(newPos, prevPos, prevTimestamp) {
    const now = Date.now()
    const dt = now - prevTimestamp

    if (!prevPos) return { valid: true }

    const speed = speedKmh(prevPos, newPos, dt)
    const dist = distanceBetween(prevPos, newPos)

    // Speed check — suspicious if >30 km/h consistently
    if (speed > GAME_CONFIG.MAX_SPEED_KMH) {
      return {
        valid: false,
        reason: 'tez_harakat',
        message: 'Juda tez harakat qilmoqdasiz. GPS tekshirilmoqda.',
        speed,
      }
    }

    // Teleport check — sudden large jump
    if (dist > GAME_CONFIG.TELEPORT_THRESHOLD_M && dt < 5000) {
      return {
        valid: false,
        reason: 'teleport',
        message: 'Noto\'g\'ri GPS harakati aniqlandi.',
        dist,
      }
    }

    // Accuracy check
    if (newPos.accuracy && newPos.accuracy > 50) {
      return {
        valid: true,
        warning: 'GPS aniqligi past. Signal kuchsiz bo\'lishi mumkin.',
      }
    }

    return { valid: true }
  },

  // Check path for impossible movement patterns
  validatePath(points) {
    if (points.length < GAME_CONFIG.MIN_POINTS_FOR_CAPTURE) {
      return {
        valid: false,
        reason: 'kam_nuqta',
        message: `Hudud egallash uchun kamida ${GAME_CONFIG.MIN_POINTS_FOR_CAPTURE} nuqta kerak.`,
      }
    }

    // Check for artificially perfect circles/shapes (bot detection)
    const irregularity = measurePathIrregularity(points)
    if (irregularity < 0.1) {
      return {
        valid: false,
        reason: 'bot_shabl',
        message: 'Avtomatik harakat aniqlandi.',
      }
    }

    return { valid: true }
  },

  // Check if user has multiple accounts (basic check via device fingerprint)
  checkMultiAccount(deviceId, userId) {
    // In production: check server-side with device fingerprinting
    const key = `device_${deviceId}`
    const stored = localStorage.getItem(key)
    if (stored && stored !== userId) {
      return {
        suspicious: true,
        message: 'Bu qurilmada boshqa hisob mavjud.',
      }
    }
    localStorage.setItem(key, userId)
    return { suspicious: false }
  },

  recordViolation(type, details) {
    this.violations.push({
      type,
      details,
      timestamp: Date.now(),
    })
    // After 5 violations, flag account
    if (this.violations.length >= 5) {
      return { flagged: true, violations: this.violations }
    }
    return { flagged: false }
  },
}

// Measure how "human-like" a path is (0=perfect shape, 1=very irregular)
function measurePathIrregularity(points) {
  if (points.length < 4) return 1
  const diffs = []
  for (let i = 2; i < points.length; i++) {
    const d1 = distanceBetween(points[i - 2], points[i - 1])
    const d2 = distanceBetween(points[i - 1], points[i])
    diffs.push(Math.abs(d1 - d2))
  }
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
  const variance = diffs.reduce((a, b) => a + (b - avg) ** 2, 0) / diffs.length
  return Math.min(1, Math.sqrt(variance) / (avg + 0.001))
}
