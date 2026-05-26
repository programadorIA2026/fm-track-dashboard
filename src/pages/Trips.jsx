import { useState, useEffect } from 'react'
import { Search, Download, Truck, Clock, MapPin } from 'lucide-react'
import { getVehicles, getTrips } from '../api/fmTrackApi'
import { DEFAULT_FROM, DEFAULT_TO } from '../config'
import { formatMeters, formatDuration, formatDateTime } from '../utils/helpers'

export default function Trips() {
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState('all')
  const [fromDate, setFromDate] = useState('2026-04-01')
  const [toDate, setToDate] = useState('2026-04-30')
  const [tripsData, setTripsData] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getVehicles().then(setVehicles).catch(() => {})
  }, [])

  async function loadTrips() {
    setLoading(true)
    const from = `${fromDate}T00:00:00Z`
    const to = `${toDate}T23:59:59Z`
    try {
      const ids = selectedVehicle === 'all'
        ? vehicles.map(v => v.id)
        : [selectedVehicle]
      const results = await Promise.all(
        ids.map(id => getTrips(id, from, to).then(r => ({ id, trips: r.trips || [] })))
      )
      setTripsData(Object.fromEntries(results.map(r => [r.id, r.trips])))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (vehicles.length > 0) loadTrips()
  }, [vehicles])

  const allTrips = selectedVehicle === 'all'
    ? Object.values(tripsData).flat()
    : (tripsData[selectedVehicle] || [])

  const totalKm = allTrips.reduce((s, t) => s + (t.mileage || 0), 0)
  const totalDur = allTrips.reduce((s, t) => s + (t.trip_duration || 0), 0)
  const avgKm = allTrips.length > 0 ? totalKm / allTrips.length : 0

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Reporte de Viajes</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', margin: '4px 0 0' }}>
          Historial de viajes por vehículo y período
        </p>
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'hsl(var(--muted-foreground))' }} />
          <select
            value={selectedVehicle}
            onChange={e => setSelectedVehicle(e.target.value)}
            style={{ paddingLeft: 32, minWidth: 200 }}
          >
            <option value="all">Todos los vehículos</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <span style={{ color: 'hsl(var(--muted-foreground))', marginRight: 6, fontSize: '0.85rem' }}>Desde:</span>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div>
          <span style={{ color: 'hsl(var(--muted-foreground))', marginRight: 6, fontSize: '0.85rem' }}>Hasta:</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={loadTrips}>
          <Search size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Consultar
        </button>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Total Viajes</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{allTrips.length.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Distancia Total</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{formatMeters(totalKm)}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Duración Total</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{formatDuration(totalDur)}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Promedio por Viaje</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{formatMeters(avgKm)}</div>
        </div>
      </div>

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
                <th>Inicio</th>
                <th>Fin</th>
                <th>Duración</th>
                <th>Distancia</th>
                <th>Origen</th>
                <th>Destino</th>
              </tr>
            </thead>
            <tbody>
              {allTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'hsl(var(--muted-foreground))' }}>
                    No hay viajes en el período seleccionado
                  </td>
                </tr>
              ) : allTrips.slice(0, 200).map((t, i) => {
                const v = vehicles.find(vv => vv.id === t.object_id)
                return (
                  <tr key={i}>
                    <td><strong>{v?.name || t.object_id}</strong></td>
                    <td>{formatDateTime(t.trip_start?.datetime)}</td>
                    <td>{formatDateTime(t.trip_end?.datetime)}</td>
                    <td>{formatDuration(t.trip_duration)}</td>
                    <td>{formatMeters(t.mileage)}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.trip_start?.address?.locality || `${t.trip_start?.latitude?.toFixed(4)}, ${t.trip_start?.longitude?.toFixed(4)}`}
                    </td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.trip_end?.address?.locality || `${t.trip_end?.latitude?.toFixed(4)}, ${t.trip_end?.longitude?.toFixed(4)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {allTrips.length > 200 && (
            <div style={{ padding: 12, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
              Mostrando 200 de {allTrips.length} viajes
            </div>
          )}
        </div>
      )}
    </div>
  )
}
