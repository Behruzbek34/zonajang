import { useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, useMap } from 'react-leaflet'
import { useGameStore } from '../../store/useGameStore'
import { useAuthStore } from '../../store/useAuthStore'
import { GAME_CONFIG, TERRITORY_COLORS } from '../../constants/gameConfig'
import 'leaflet/dist/leaflet.css'

function MapController({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

export function MapView() {
  const { territories, currentPath, currentPosition, livePlayers } = useGameStore()
  const { user } = useAuthStore()

  const getRelation = (territory) => {
    if (!user) return 'enemy'
    if (territory.userId === 'current_user') return 'own'
    if (user.clan && territory.clanId === user.clan) return 'ally'
    return 'enemy'
  }

  return (
    <MapContainer
      center={GAME_CONFIG.TASHKENT_CENTER}
      zoom={GAME_CONFIG.DEFAULT_ZOOM}
      className="w-full h-full"
      zoomControl={false}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <MapController center={currentPosition} />

      {territories.map((territory) => {
        const relation = getRelation(territory)
        const color =
          relation === 'own'
            ? TERRITORY_COLORS.own
            : relation === 'ally'
            ? TERRITORY_COLORS.ally
            : territory.color
        return (
          <Polygon
            key={territory.id}
            positions={territory.coordinates}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: GAME_CONFIG.TERRITORY_OPACITY,
              weight: GAME_CONFIG.TERRITORY_STROKE_WIDTH,
              opacity: GAME_CONFIG.TERRITORY_STROKE_OPACITY,
              dashArray: relation === 'own' ? null : '4 2',
            }}
          />
        )
      })}

      {currentPath.length > 1 && (
        <Polyline
          positions={currentPath}
          pathOptions={{ color: '#6366f1', weight: 3, opacity: 0.9, dashArray: '6 4' }}
        />
      )}

      {currentPosition && (
        <>
          <CircleMarker
            center={currentPosition}
            radius={18}
            pathOptions={{
              color: '#6366f1',
              fillColor: '#6366f1',
              fillOpacity: 0.1,
              weight: 1,
              opacity: 0.4,
            }}
          />
          <CircleMarker
            center={currentPosition}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#6366f1',
              fillOpacity: 1,
              weight: 2.5,
              opacity: 1,
            }}
          />
        </>
      )}

      {livePlayers.map((player) => (
        <CircleMarker
          key={player.id}
          center={player.pos}
          radius={6}
          pathOptions={{
            color: '#ffffff',
            fillColor: player.color,
            fillOpacity: 1,
            weight: 2,
            opacity: 1,
          }}
        />
      ))}
    </MapContainer>
  )
}
