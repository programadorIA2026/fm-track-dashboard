import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { getAllData } from '../api/fmTrackApi'
import { DEFAULT_FROM, DEFAULT_TO } from '../config'
import { formatMeters, formatDuration, vehicleStatus } from '../utils/helpers'
import { Truck, TrendingUp, Clock, Activity } from 'lucide-react'

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#ec4899']

export default function Productivity() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllData(DEFAULT_FROM, DEFAULT_TO)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const vehicleStats = useMemo(() => {
    if (!data) return []
    return data.vehicles.map(v => {
      const km = v.trips?.reduce((s, t) => s + (t.mileage || 0), 0) || 0
      const dur = v.trips?.reduce((s, t) => s + (t.trip_duration || 0), 0) || 0
      const trips = v.trips?.length || 0
      const violations = v.violations?.length || 0
      const status = v.last_coordinate ? vehicleStatus(v.last_coordinate) : { label: 'Sin datos' }
      const lastActive = v.trips?.length > 0
        ? new Date(v.trips[v.trips.length - 1].trip_end?.datetime).getTime()
        : null
      return {
        name: v.name,
        km: Math.round(km / 1000),
        duration: dur,
        trips,
        violations,
        status: status.label,
        lastActive,
        avgKmPerTrip: trips > 0 ? Math.round(km / trips / 1000) : 0,
        avgTimePerTrip: trips > 0 ? Math.round(dur / trips) : 0
      }
    }).sort((a, b) => b.km - a.km)
  }, [data])

  const pieData = useMemo(() =>
    vehicleStats.map(v => ({ name: v.name, value: v.km })),
    [vehicleStats]
  )

  const avgKm = vehicleStats.length > 0
    ? Math.round(vehicleStats.reduce((s, v) => s + v.km, 0) / vehicleStats.length)
    : 0

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Productividad</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', margin: '4px 0 0' }}>
          Análisis de rendimiento y utilización de la flota · Abril 2026
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="stat-card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Kilómetros por Vehículo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vehicleStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                  borderRadius: 8, color: 'hsl(var(--foreground))'
                }}
                formatter={(v) => [`${v} km`, 'Distancia']}
              />
              <Bar dataKey="km" radius={[4, 4, 0, 0]}>
                {vehicleStats.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Distribución de Kilómetros</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData} cx="50%" cy="50%"
                innerRadius={55} outerRadius={90}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                  borderRadius: 8, color: 'hsl(var(--foreground))'
                }}
                formatter={(v) => [`${v} km`]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="stat-card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Estado</th>
              <th>Viajes</th>
              <th>Km totales</th>
              <th>Horas totales</th>
              <th>Km/viaje</th>
              <th>Min/viaje</th>
              <th>Excesos</th>
            </tr>
          </thead>
          <tbody>
            {vehicleStats.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'hsl(var(--muted-foreground))' }}>
                  Sin datos disponibles
                </td>
              </tr>
            ) : vehicleStats.map((v, i) => (
              <tr key={i}>
                <td><strong>{v.name}</strong></td>
                <td>
                  <span className={`badge ${
                    v.status === 'En movimiento' ? 'badge-green'
                    : v.status === 'Detenido' ? 'badge-blue'
                    : 'badge-red'
                  }`}>{v.status}</span>
                </td>
                <td>{v.trips}</td>
                <td><strong>{v.km.toLocaleString()} km</strong></td>
                <td>{formatDuration(v.duration)}</td>
                <td>{v.avgKmPerTrip} km</td>
                <td>{Math.round(v.avgTimePerTrip / 60)} min</td>
                <td>
                  <span className={`badge ${v.violations > 0 ? 'badge-red' : 'badge-green'}`}>
                    {v.violations}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {vehicleStats.map((v, i) => {
          const utilization = Math.min(Math.round((v.duration / (30 * 24 * 3600)) * 100), 100)
          return (
            <div className="stat-card" key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>{v.name}</div>
                <span className={`badge ${
                  utilization > 10 ? 'badge-green'
                  : utilization > 3 ? 'badge-yellow'
                  : 'badge-red'
                }`}>{utilization}%</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                <div><TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />{v.km} km</div>
                <div><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{formatDuration(v.duration)}</div>
                <div><Truck size={12} style={{ display: 'inline', marginRight: 4 }} />{v.trips} viajes</div>
                <div><Activity size={12} style={{ display: 'inline', marginRight: 4 }} />{v.avgKmPerTrip} km/viaje</div>
              </div>
              <div style={{
                marginTop: 12, height: 4, borderRadius: 2,
                background: 'hsl(var(--border))', overflow: 'hidden'
              }}>
                <div style={{
                  width: `${utilization}%`, height: '100%',
                  background: utilization > 10 ? '#22c55e'
                    : utilization > 3 ? '#eab308' : '#ef4444',
                  borderRadius: 2, transition: 'width 0.5s'
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
