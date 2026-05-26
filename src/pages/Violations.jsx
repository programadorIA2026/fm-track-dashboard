import { useState, useEffect, useMemo } from 'react'
import { Search, AlertTriangle, Printer, Download } from 'lucide-react'
import { getVehicles, getDetectedEvents } from '../api/fmTrackApi'
import { formatSpeed, formatDateTime } from '../utils/helpers'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const violationIcon = L.divIcon({
  className: 'vehicle-marker-icon',
  html: `<div style="width:14px;height:14px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
})

export default function Violations() {
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState('all')
  const [fromDate, setFromDate] = useState('2026-04-01')
  const [toDate, setToDate] = useState('2026-04-30')
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { getVehicles().then(setVehicles).catch(() => {}) }, [])

  async function loadViolations() {
    setLoading(true)
    const from = `${fromDate}T00:00:00Z`
    const to = `${toDate}T23:59:59Z`
    try {
      const ids = selectedVehicle === 'all' ? vehicles.map(v => v.id) : [selectedVehicle]
      const results = await Promise.all(
        ids.map(id => getDetectedEvents(id, from, to)
          .then(r => r.events?.map(e => ({ ...e, object_id: id })) || [])
        )
      )
      setViolations(results.flat().filter(Boolean))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    if (vehicles.length > 0) loadViolations()
  }, [vehicles])

  const violationLocations = useMemo(() =>
    violations.filter(v => v.start?.location?.latitude).map(v => ({
      lat: v.start.location.latitude, lng: v.start.location.longitude,
      name: v.name, speed: v.start.speed, time: v.start.datetime,
      vehicle: vehicles.find(vv => vv.id === v.object_id)?.name || v.object_id,
      duration: v.duration
    })),
    [violations, vehicles]
  )

  const uniqueDates = useMemo(() =>
    Array.from(new Set(violations.map(v => new Date(v.start?.datetime).toLocaleDateString('es-AR')))).sort(),
    [violations]
  )

  const maxViolation = useMemo(() =>
    violations.length > 0 ? Math.max(...violations.map(v => v.start?.speed || 0)) : 0,
    [violations]
  )

  function handleExportCSV() {
    const rows = [['Vehículo','Evento','Fecha','Velocidad (km/h)','Duración (s)','Latitud','Longitud']]
    violations.slice(0, 5000).forEach(v => {
      const veh = vehicles.find(vv => vv.id === v.object_id)
      rows.push([
        veh?.name || v.object_id, v.name,
        v.start?.datetime || '',
        v.start?.speed || 0, v.duration || 0,
        v.start?.location?.latitude || '',
        v.start?.location?.longitude || '',
      ])
    })
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'excesos-velocidad.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="page-title" style={{ marginBottom: 20 }}>
        <h1>Excesos de Velocidad</h1>
        <p>Eventos de exceso de velocidad por vehículo</p>
      </div>

      <div className="filter-bar">
        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} style={{ minWidth: 200 }}>
          <option value="all">Todos los vehículos</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <label>Desde:</label>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <label>Hasta:</label>
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <button className="btn-primary" onClick={loadViolations}>
          <Search size={16} /> Consultar
        </button>
        <button className="btn-outline" onClick={handleExportCSV}>
          <Download size={16} /> CSV
        </button>
        <button className="btn-outline" onClick={() => window.print()}>
          <Printer size={16} /> PDF
        </button>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Total Excesos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{violations.length}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Velocidad Máxima</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--destructive))' }}>{formatSpeed(maxViolation)}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Días con Eventos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{uniqueDates.length}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Límite más común</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {violations.length > 0
              ? Object.entries(violations.reduce((acc, v) => {
                  acc[v.name] = (acc[v.name] || 0) + 1
                  return acc
                }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
              : '—'}
          </div>
        </div>
      </div>

      {violationLocations.length > 0 && (
        <div className="map-container" style={{ height: '280px', marginBottom: 20 }}>
          <MapContainer center={[-24.84, -65.41]} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {violationLocations.map((vl, i) => (
              <Marker key={i} position={[vl.lat, vl.lng]} icon={violationIcon}>
                <Popup>
                  <div style={{ fontFamily: 'system-ui', minWidth: 160 }}>
                    <strong style={{ color: '#ef4444' }}>{vl.name}</strong>
                    <div style={{ marginTop: 4, fontSize: '0.82rem' }}>
                      <div><strong>{vl.vehicle}</strong></div>
                      <div>Vel: {formatSpeed(vl.speed)} · {vl.duration}s</div>
                      <div style={{ fontSize: '0.75rem', marginTop: 2, color: '#666' }}>{formatDateTime(vl.time)}</div>
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
              ) : violations.slice(0, 300).map((v, i) => {
                const veh = vehicles.find(vv => vv.id === v.object_id)
                return (
                  <tr key={i}>
                    <td><strong>{veh?.name || v.object_id}</strong></td>
                    <td><span className="badge badge-red">{v.name}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{formatDateTime(v.start?.datetime)}</td>
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
