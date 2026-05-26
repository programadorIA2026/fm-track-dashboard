import { useState, useEffect, useMemo } from 'react'
import { Search, AlertTriangle, Gauge, MapPin, Clock } from 'lucide-react'
import { getVehicles, getDetectedEvents } from '../api/fmTrackApi'
import { DEFAULT_FROM, DEFAULT_TO } from '../config'
import { formatSpeed, formatDateTime } from '../utils/helpers'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const violationIcon = L.divIcon({
  className: 'vehicle-marker-icon',
  html: `<div style="width:14px;height:14px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export default function Violations() {
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState('all')
  const [fromDate, setFromDate] = useState('2026-04-01')
  const [toDate, setToDate] = useState('2026-04-30')
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getVehicles().then(setVehicles).catch(() => {})
  }, [])

  async function loadViolations() {
    setLoading(true)
    const from = `${fromDate}T00:00:00Z`
    const to = `${toDate}T23:59:59Z`
    try {
      const ids = selectedVehicle === 'all'
        ? vehicles.map(v => v.id)
        : [selectedVehicle]
      const results = await Promise.all(
        ids.map(id => getDetectedEvents(id, from, to)
          .then(r => r.events?.map(e => ({ ...e, object_id: id })) || [])
        )
      )
      setViolations(results.flat().filter(Boolean))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (vehicles.length > 0) loadViolations()
  }, [vehicles])

  const violationLocations = useMemo(() =>
    violations.filter(v => v.start?.location?.latitude).map(v => ({
      lat: v.start.location.latitude,
      lng: v.start.location.longitude,
      name: v.name,
      speed: v.start.speed,
      time: v.start.datetime,
      vehicle: vehicles.find(vv => vv.id === v.object_id)?.name || v.object_id,
      duration: v.duration,
      description: v.description
    })),
    [violations, vehicles]
  )

  const uniqueDates = useMemo(() => {
    const dates = new Set(violations.map(v =>
      new Date(v.start?.datetime).toLocaleDateString('es-AR')
    ))
    return Array.from(dates).sort()
  }, [violations])

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Excesos de Velocidad</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', margin: '4px 0 0' }}>
          Eventos de exceso de velocidad por vehículo
        </p>
      </div>

      <div className="filter-bar">
        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} style={{ minWidth: 200 }}>
          <option value="all">Todos los vehículos</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <div>
          <span style={{ color: 'hsl(var(--muted-foreground))', marginRight: 6, fontSize: '0.85rem' }}>Desde:</span>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div>
          <span style={{ color: 'hsl(var(--muted-foreground))', marginRight: 6, fontSize: '0.85rem' }}>Hasta:</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={loadViolations}>
          <Search size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Consultar
        </button>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Total Excesos</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{violations.length}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Límite más común</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
            {violations.length > 0
              ? Object.entries(violations.reduce((acc, v) => {
                  acc[v.name] = (acc[v.name] || 0) + 1
                  return acc
                }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
              : '—'}
          </div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Días con eventos</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{uniqueDates.length}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Velocidad máxima</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
            {formatSpeed(Math.max(...violations.map(v => v.start?.speed || 0)))}
          </div>
        </div>
      </div>

      {violationLocations.length > 0 && (
        <div className="map-container" style={{ height: '300px', marginBottom: 24 }}>
          <MapContainer
            center={[-24.84, -65.41]} zoom={10}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {violationLocations.map((vl, i) => (
              <Marker key={i} position={[vl.lat, vl.lng]} icon={violationIcon}>
                <Popup>
                  <div style={{ fontFamily: 'system-ui', minWidth: 180 }}>
                    <strong style={{ color: '#ef4444' }}>{vl.name}</strong>
                    <div style={{ marginTop: 6, fontSize: '0.85rem' }}>
                      <div><strong>{vl.vehicle}</strong></div>
                      <div>Velocidad: {formatSpeed(vl.speed)}</div>
                      <div>Duración: {vl.duration}s</div>
                      <div style={{ fontSize: '0.75rem', marginTop: 4, color: '#999' }}>
                        {formatDateTime(vl.time)}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <div className="stat-card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Evento</th>
                <th>Fecha</th>
                <th>Velocidad</th>
                <th>Duración</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {violations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'hsl(var(--muted-foreground))' }}>
                    No hay excesos en el período seleccionado
                  </td>
                </tr>
              ) : violations.slice(0, 200).map((v, i) => {
                const veh = vehicles.find(vv => vv.id === v.object_id)
                return (
                  <tr key={i}>
                    <td><strong>{veh?.name || v.object_id}</strong></td>
                    <td><span className="badge badge-red">{v.name}</span></td>
                    <td>{formatDateTime(v.start?.datetime)}</td>
                    <td><strong style={{ color: 'hsl(var(--destructive))' }}>{formatSpeed(v.start?.speed)}</strong></td>
                    <td>{v.duration}s</td>
                    <td style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                      {v.start?.location?.latitude?.toFixed(4)}, {v.start?.location?.longitude?.toFixed(4)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
