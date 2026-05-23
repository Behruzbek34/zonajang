// Haversine formula — meters between two [lat, lng] points
export function distanceBetween([lat1, lng1], [lat2, lng2]) {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

// Speed in km/h between two positions with timestamps
export function speedKmh(pos1, pos2, dt_ms) {
  const dist = distanceBetween(pos1, pos2)
  return (dist / (dt_ms / 1000)) * 3.6
}

// Check if path forms a closed shape (start ≈ end)
export function isPathClosed(points, thresholdM = 20) {
  if (points.length < 3) return false
  return distanceBetween(points[0], points[points.length - 1]) <= thresholdM
}

// Total path length in meters
export function pathLength(points) {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += distanceBetween(points[i - 1], points[i])
  }
  return total
}

// Approximate polygon area in m² using shoelace formula (flat-earth ok at city scale)
export function polygonArea(points) {
  const R = 6371000
  const toRadLocal = (d) => (d * Math.PI) / 180
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const [lat1, lng1] = points[i]
    const [lat2, lng2] = points[(i + 1) % n]
    area +=
      toRadLocal(lng2 - lng1) *
      (2 + Math.sin(toRadLocal(lat1)) + Math.sin(toRadLocal(lat2)))
  }
  return Math.abs((area * R * R) / 2)
}

// Format area for display
export function formatArea(m2) {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} km²`
  if (m2 >= 10_000) return `${(m2 / 10_000).toFixed(1)} ga`
  return `${Math.round(m2)} m²`
}

// Check if a point is inside a polygon (ray casting)
export function pointInPolygon([lat, lng], polygon) {
  let inside = false
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = polygon[i]
    const [yj, xj] = polygon[j]
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Simplify path using Ramer-Douglas-Peucker for performance
export function simplifyPath(points, tolerance = 0.00005) {
  if (points.length <= 2) return points
  let maxDist = 0
  let maxIdx = 0
  const [p1, p2] = [points[0], points[points.length - 1]]
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], p1, p2)
    if (d > maxDist) { maxDist = d; maxIdx = i }
  }
  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), tolerance)
    const right = simplifyPath(points.slice(maxIdx), tolerance)
    return [...left.slice(0, -1), ...right]
  }
  return [p1, p2]
}

function perpendicularDistance([lat, lng], [lat1, lng1], [lat2, lng2]) {
  const dx = lat2 - lat1
  const dy = lng2 - lng1
  const mag = Math.sqrt(dx * dx + dy * dy)
  if (mag === 0) return Math.sqrt((lat - lat1) ** 2 + (lng - lng1) ** 2)
  return Math.abs(dy * lat - dx * lng + lat2 * lng1 - lng2 * lat1) / mag
}
