import { useEffect, useMemo } from 'react'
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import { GOOGLE_MAPS_KEY } from '../config'
import { formatSpeed, formatDateTime, formatTimeAgo, vehicleStatus } from '../utils/helpers'

const containerStyle = { width: '100%', height: '100%' }

function createIconUrl(color, isMoving) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="10" fill="${color}" stroke="white" stroke-width="3"/>
    ${isMoving ? `<circle cx="14" cy="14" r="14" fill="${color}" opacity="0.2">
      <animate attributeName="r" values="10;20" dur="1.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.3;0" dur="1.5s" repeatCount="indefinite"/>
    </circle>` : ''}
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export default function GoogleMapView({ vehicles, height = '400px', center = { lat: -24.84, lng: -65.41 }, zoom = 11, markers: extraMarkers, onMapClick }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  })

  const mapOptions = useMemo(() => ({
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    styles: [
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    ],
  }), [])

  if (loadError) {
    return (
      <div className="map-container" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ color: 'hsl(var(--destructive))', fontWeight: 600 }}>Error al cargar Google Maps</p>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
            Configurá GOOGLE_MAPS_KEY en src/config.js
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="map-container" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="map-container" style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={mapOptions}
        onClick={onMapClick}
      >
        {vehicles?.filter(v => v.last_coordinate).map(v => {
          const status = vehicleStatus(v.last_coordinate)
          const color = status.className.includes('green') ? '#22c55e'
            : status.className.includes('yellow') ? '#eab308'
            : status.className.includes('red') ? '#ef4444' : '#3b82f6'
          const isMoving = v.last_coordinate.speed > 0
          return (
            <Marker
              key={v.id}
              position={{ lat: v.last_coordinate.latitude, lng: v.last_coordinate.longitude }}
              icon={{ url: createIconUrl(color, isMoving), scaledSize: { width: 28, height: 28 } }}
              title={v.name}
            />
          )
        })}

        {extraMarkers?.map((m, i) => (
          <Marker
            key={`extra-${i}`}
            position={{ lat: m.lat, lng: m.lng }}
            icon={m.icon || {
              url: m.color ? createIconUrl(m.color, false) : createIconUrl('#ef4444', false),
              scaledSize: { width: 24, height: 24 },
            }}
          />
        ))}
      </GoogleMap>
    </div>
  )
}
