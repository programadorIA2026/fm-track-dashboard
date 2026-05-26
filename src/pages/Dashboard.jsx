import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Truck, MapPin, Clock, TrendingUp, AlertTriangle,
  Printer, Navigation
} from 'lucide-react'
import { getAllData } from '../api/fmTrackApi'
import { POLL_INTERVAL, DEFAULT_FROM, DEFAULT_TO } from '../config'
import {
  formatMeters, formatDuration, formatSpeed, formatTimeAgo, vehicleStatus
} from '../utils/helpers'
import GoogleMapView from '../components/GoogleMapView.jsx'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ flex: 1, minWidth: 170 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
          {sub && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}12`, display: 'flex',
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
  const violationCount = v.violations?.length || 0

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>IMEI: {v.imei}</div>
        </div>
        <span className={status.className}>{status.label}</span>
      </div>
      {v.last_coordinate ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.82rem' }}>
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Navigation size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {formatSpeed(v.last_coordinate.speed)}
          </div>
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {formatTimeAgo(v.last_coordinate.server_datetime)}
          </div>
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>
            <TrendingUp size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {formatMeters(totalKm)}
          </div>
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {violationCount} excesos
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))' }}>Sin datos de ubicación</div>
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
    const now = Date.now()
    const onlineMovil = v.filter(ve => ve.last_coordinate?.speed > 0 &&
      (now - new Date(ve.last_coordinate.server_datetime).getTime()) < 3600000).length
    const onlineDetenido = v.filter(ve => ve.last_coordinate && ve.last_coordinate.speed === 0 &&
      (now - new Date(ve.last_coordinate.server_datetime).getTime()) < 3600000).length
    const offline = v.filter(ve => !ve.last_coordinate ||
      (now - new Date(ve.last_coordinate.server_datetime).getTime()) >= 3600000).length
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Monitoreo en vivo · Abril 2026 · Datos actualizados cada 30s
          </p>
        </div>
        <button className="btn-outline" onClick={() => window.print()}>
          <Printer size={16} /> Exportar PDF
        </button>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatCard icon={Truck} label="Vehículos" value={stats.total}
          sub={`${stats.onlineMovil} en movimiento, ${stats.onlineDetenido} detenidos`} color="#2563eb" />
        <StatCard icon={MapPin} label="Offline" value={stats.offline}
          sub="Sin conexión >1h" color="#ef4444" />
        <StatCard icon={TrendingUp} label="Km Totales" value={formatMeters(stats.totalKm)}
          sub={`${stats.activeVehicles} vehículos activos`} color="#16a34a" />
        <StatCard icon={AlertTriangle} label="Excesos" value={stats.totalViolations}
          sub="Eventos de velocidad" color="#d97706" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <GoogleMapView vehicles={data.vehicles} height="360px" />
      </div>

      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Vehículos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
          {data.vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
        </div>
      </div>
    </div>
  )
}
