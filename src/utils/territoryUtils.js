import { pointInPolygon, polygonArea } from './gpsUtils'

// Check if new territory overlaps any existing territory
export function findOverlappingTerritories(newPolygon, territories) {
  return territories.filter((t) => {
    // Quick bounding box check first
    const bb1 = boundingBox(newPolygon)
    const bb2 = boundingBox(t.coordinates)
    if (!boundingBoxOverlap(bb1, bb2)) return false
    // Then check if any point of one is inside the other
    return (
      newPolygon.some((p) => pointInPolygon(p, t.coordinates)) ||
      t.coordinates.some((p) => pointInPolygon(p, newPolygon))
    )
  })
}

// Bounding box of a polygon [[lat,lng],...]
export function boundingBox(points) {
  const lats = points.map((p) => p[0])
  const lngs = points.map((p) => p[1])
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  }
}

export function boundingBoxOverlap(a, b) {
  return (
    a.minLat <= b.maxLat &&
    a.maxLat >= b.minLat &&
    a.minLng <= b.maxLng &&
    a.maxLng >= b.minLng
  )
}

// Determine territory relationship to current user
export function territoryRelation(territory, currentUserId, userClanId) {
  if (territory.userId === currentUserId) return 'own'
  if (userClanId && territory.clanId === userClanId) return 'ally'
  return 'enemy'
}

// Calculate leaderboard rankings
export function rankPlayers(players) {
  return [...players]
    .sort((a, b) => b.totalArea - a.totalArea)
    .map((p, i) => ({ ...p, rank: i + 1 }))
}

// XP to rank lookup
export function getPlayerRank(xp, ranks) {
  let current = ranks[0]
  for (const rank of ranks) {
    if (xp >= rank.minXp) current = rank
    else break
  }
  return current
}

// XP progress to next rank
export function xpProgress(xp, ranks) {
  for (let i = 0; i < ranks.length - 1; i++) {
    if (xp < ranks[i + 1].minXp) {
      const rangeStart = ranks[i].minXp
      const rangeEnd = ranks[i + 1].minXp
      return {
        current: xp - rangeStart,
        total: rangeEnd - rangeStart,
        percent: ((xp - rangeStart) / (rangeEnd - rangeStart)) * 100,
        nextRank: ranks[i + 1],
      }
    }
  }
  return { current: 0, total: 0, percent: 100, nextRank: null }
}

// Generate territory capture XP
export function calculateCaptureXP(areaM2, isConquest = false) {
  const baseXP = Math.round(areaM2 * 0.001)
  const conquestBonus = isConquest ? 100 : 0
  return baseXP + conquestBonus + 50
}

// Check if territory should trigger attack notification
export function isUnderAttack(territory, attackerPos, thresholdM = 50) {
  return territory.coordinates.some(
    (coord) => {
      const d = Math.sqrt(
        (coord[0] - attackerPos[0]) ** 2 + (coord[1] - attackerPos[1]) ** 2
      ) * 111000
      return d < thresholdM
    }
  )
}
