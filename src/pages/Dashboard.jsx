import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Truck, Gauge, MapPin, Clock, TrendingUp, AlertTriangle,
  Activity, Navigation
} from 'lucide-react'
import { getAllData } from '../api/fmTrackApi'
import { POLL_INTERVAL, DEFAULT_FROM, DEFAULT_TO } from '../config'
import {
  formatMeters, formatDuration, formatSpeed, formatTimeAgo, vehicleStatus
} from '../utils/helpers'
import MapView from '../components/MapView.jsx'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ flex: 1, minWidth: 180 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{value}</div>
          {sub && <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}15`, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  )
}

function VehicleCard({ vehicle }) {
  const v = vehicle
  const status = v.last_coordinate ? vehicleStatus(v.last_coordinate) : { label: 'Sin datos', className: 'badge-red' }
  const totalKm = v.trips?.reduce((s, t) => s + (t.mileage || 0), 0) || 0
  const totalTime = v.trips?.reduce((s, t) => s + (t.trip_duration || 0), 0) || 0
  const violationCount = v.violations?.length || 0

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{v.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>IMEI: {v.imei}</div>
        </div>
        <span className={status.className}>{status.label}</span>
      </div>
      {v.last_coordinate ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.85rem' }}>
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Navigation size={12} style={{ display: 'inline', marginRight: 4 }} />
            {formatSpeed(v.last_coordinate.speed)}
          </div>
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
            {formatTimeAgo(v.last_coordinate.server_datetime)}
          </div>
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>
            <TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />
            {formatMeters(totalKm)}
          </div>
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
            {violationCount} excesos
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Sin datos de ubicación</div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const d = await getAllData(DEFAULT_FROM, DEFAULT_TO)
      setData(d)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  const stats = useMemo(() => {
    if (!data) return null
    const v = data.vehicles
    const onlineMovil = v.filter(ve => ve.last_coordinate?.speed > 0 &&
      (Date.now() - new Date(ve.last_coordinate.server_datetime).getTime()) < 3600000).length
    const onlineDetenido = v.filter(ve => ve.last_coordinate && ve.last_coordinate.speed === 0 &&
      (Date.now() - new Date(ve.last_coordinate.server_datetime).getTime()) < 3600000).length
    const offline = v.filter(ve => !ve.last_coordinate ||
      (Date.now() - new Date(ve.last_coordinate.server_datetime).getTime()) >= 3600000).length
    const totalKm = v.reduce((s, ve) => s + (ve.trips?.reduce((s2, t) => s2 + (t.mileage || 0), 0) || 0), 0)
    const totalViolations = v.reduce((s, ve) => s + (ve.violations?.length || 0), 0)
    const activeVehicles = v.filter(ve => ve.trips?.length > 0).length
    return { total: v.length, onlineMovil, onlineDetenido, offline, totalKm, totalViolations, activeVehicles }
  }, [data])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <AlertTriangle size={48} color="hsl(var(--destructive))" style={{ marginBottom: 16 }} />
        <h2>Error al conectar con la API</h2>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>{error}</p>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={fetchData}>Reintentar</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', margin: '4px 0 0' }}>
          Monitoreo en vivo · Abril 2026 · Datos actualizados cada 30s
        </p>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard icon={Truck} label="Vehículos" value={stats.total}
          sub={`${stats.onlineMovil} en movimiento, ${stats.onlineDetenido} detenidos`}
          color="#22c55e" />
        <StatCard icon={MapPin} label="Offline" value={stats.offline}
          sub="Sin conexión >1h" color="#ef4444" />
        <StatCard icon={TrendingUp} label="Km Totales" value={formatMeters(stats.totalKm)}
          sub={`${stats.activeVehicles} vehículos activos`} color="#3b82f6" />
        <StatCard icon={AlertTriangle} label="Excesos" value={stats.totalViolations}
          sub="Eventos de velocidad" color="#eab308" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <MapView vehicles={data.vehicles} height="380px" />
      </div>

      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 14 }}>Vehículos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {data.vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
        </div>
      </div>
    </div>
  )
}
