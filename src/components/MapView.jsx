import { useEffect, useState, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { formatSpeed, formatDateTime, formatTimeAgo, vehicleStatus } from '../utils/helpers'

function createIcon(color, isMoving) {
  const size = isMoving ? 18 : 14
  return L.divIcon({
    className: 'vehicle-marker-icon',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      ${isMoving ? 'animation:pulse 1.5s infinite' : ''}
    "><style>
      @keyframes pulse {
        0%{box-shadow:0 0 0 0 ${color}88}
        70%{box-shadow:0 0 0 10px ${color}00}
        100%{box-shadow:0 0 0 0 ${color}00}
      }
    </style></div>`,
    iconSize: [size + 6, size + 6],
    iconAnchor: [(size + 6) / 2, (size + 6) / 2],
  })
}

function MapBounds({ vehicles }) {
  const map = useMap()
  const coords = useMemo(() => vehicles
    .filter(v => v.last_coordinate)
    .map(v => [v.last_coordinate.latitude, v.last_coordinate.longitude]),
    [vehicles]
  )
  useEffect(() => {
    if (coords.length > 0) {
      const lats = coords.map(c => c[0])
      const lngs = coords.map(c => c[1])
      map.fitBounds([
        [Math.min(...lats) - 0.02, Math.min(...lngs) - 0.02],
        [Math.max(...lats) + 0.02, Math.max(...lngs) + 0.02]
      ], { padding: [30, 30] })
    }
  }, [coords, map])
  return null
}

export default function MapView({ vehicles, height = '400px' }) {
  return (
    <div className="map-container" style={{ height }}>
      <MapContainer
        center={[-24.84, -65.41]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds vehicles={vehicles} />
        {vehicles.filter(v => v.last_coordinate).map(v => {
          const status = vehicleStatus(v.last_coordinate)
          const color = status.className.includes('green') ? '#22c55e'
            : status.className.includes('yellow') ? '#eab308'
            : status.className.includes('red') ? '#ef4444' : '#3b82f6'
          const isMoving = v.last_coordinate.speed > 0
          return (
            <Marker
              key={v.id}
              position={[v.last_coordinate.latitude, v.last_coordinate.longitude]}
              icon={createIcon(color, isMoving)}
            >
              <Popup>
                <div style={{ minWidth: 200, fontFamily: 'system-ui' }}>
                  <strong style={{ fontSize: '1rem' }}>{v.name}</strong>
                  <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#666' }}>
                    <div>IMEI: {v.imei}</div>
                    <div>Velocidad: <strong>{formatSpeed(v.last_coordinate.speed)}</strong></div>
                    <div>Dirección: {v.last_coordinate.direction}°</div>
                    <div>Altitud: {v.last_coordinate.altitude} m</div>
                    <div>Satélites: {v.last_coordinate.satellites_count}</div>
                    <div style={{ marginTop: 4 }}>
                      <span className={status.className}>{status.label}</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: '0.75rem', color: '#999' }}>
                      {formatDateTime(v.last_coordinate.datetime)}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
