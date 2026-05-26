import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import { getAllData, getVehicles, getDetectedEvents } from '../api/fmTrackApi'
import { DEFAULT_FROM, DEFAULT_TO } from '../config'
import { formatMeters, formatDuration, vehicleStatus } from '../utils/helpers'
import { Truck, TrendingUp, Clock, Activity, AlertTriangle, Printer } from 'lucide-react'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#ec4899']

export default function Productivity() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activityData, setActivityData] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const d = await getAllData(DEFAULT_FROM, DEFAULT_TO)
        setData(d)
        const vehs = await getVehicles()
        const hours = Array.from({ length: 24 }, (_, h) => {
          const item = { hour: `${h}:00`, count: 0, label: h === 0 ? '0' : h === 6 ? '6' : h === 12 ? '12' : h === 18 ? '18' : '' }
          return item
        })
        for (const v of vehs) {
          try {
            const events = await getDetectedEvents(v.id, DEFAULT_FROM, DEFAULT_TO)
            if (events.events) {
              events.events.forEach(e => {
                if (e.start?.datetime) {
                  const h = new Date(e.start.datetime).getHours()
                  if (hours[h]) hours[h].count++
                }
              })
            }
          } catch {}
        }
        setActivityData(hours)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  const vehicleStats = useMemo(() => {
    if (!data) return []
    return data.vehicles.map(v => {
      const km = v.trips?.reduce((s, t) => s + (t.mileage || 0), 0) || 0
      const dur = v.trips?.reduce((s, t) => s + (t.trip_duration || 0), 0) || 0
      const trips = v.trips?.length || 0
      const violations = v.violations?.length || 0
      const status = v.last_coordinate ? vehicleStatus(v.last_coordinate) : { label: 'Sin datos' }
      return {
        name: v.name, km: Math.round(km / 1000), duration: dur,
        trips, violations, status: status.label,
        avgKmPerTrip: trips > 0 ? Math.round(km / trips / 1000) : 0,
        avgTimePerTrip: trips > 0 ? Math.round(dur / trips / 60) : 0,
        score: Math.round((trips * 0.3 + (km / 1000) * 0.4 + Math.max(0, 100 - violations * 2)) / 3)
      }
    }).sort((a, b) => b.score - a.score)
  }, [data])

  const pieData = useMemo(() => vehicleStats.map(v => ({ name: v.name, value: v.km })), [vehicleStats])
  const totalKm = vehicleStats.reduce((s, v) => s + v.km, 0)
  const avgScore = vehicleStats.length > 0
    ? Math.round(vehicleStats.reduce((s, v) => s + v.score, 0) / vehicleStats.length)
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="page-title">
          <h1>Productividad</h1>
          <p>Análisis de rendimiento y utilización de la flota · Abril 2026</p>
        </div>
        <button className="btn-outline" onClick={() => window.print()}><Printer size={16} /> PDF</button>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <div className="stat-card" style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Score General</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: avgScore > 70 ? '#16a34a' : avgScore > 50 ? '#d97706' : '#dc2626' }}>
            {avgScore}/100
          </div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Km Totales</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalKm.toLocaleString()} km</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Mejor Vehículo</div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>{vehicleStats[0]?.name || '—'}</div>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
            Score: {vehicleStats[0]?.score || 0}
          </div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Mayor Km</div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>{vehicleStats[0]?.name || '—'}</div>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
            {vehicleStats[0]?.km || 0} km
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div className="stat-card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14 }}>Kilómetros por Vehículo</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={vehicleStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip contentStyle={{
                background: 'white', border: '1px solid hsl(var(--border))',
                borderRadius: 8, color: 'hsl(var(--foreground))'
              }} formatter={(v) => [`${v} km`]} />
              <Bar dataKey="km" radius={[4, 4, 0, 0]}>
                {vehicleStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14 }}>Distribución de Kilómetros</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{
                background: 'white', border: '1px solid hsl(var(--border))',
                borderRadius: 8
              }} formatter={(v) => [`${v} km`]} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {activityData && (
          <div className="stat-card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14 }}>Actividad por Hora (excesos)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={activityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{
                  background: 'white', border: '1px solid hsl(var(--border))', borderRadius: 8
                }} />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="stat-card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14 }}>Score de Productividad</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={vehicleStats} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{
                background: 'white', border: '1px solid hsl(var(--border))', borderRadius: 8
              }} formatter={(v) => [`${v}/100`]} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {vehicleStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="stat-card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Vehículo</th>
              <th>Estado</th>
              <th>Score</th>
              <th>Viajes</th>
              <th>Km totales</th>
              <th>Horas totales</th>
              <th>Km/viaje</th>
              <th>Min/viaje</th>
              <th>Excesos</th>
            </tr>
          </thead>
          <tbody>
            {vehicleStats.map((v, i) => (
              <tr key={i}>
                <td style={{ color: 'hsl(var(--muted-foreground))' }}>{i + 1}</td>
                <td><strong>{v.name}</strong></td>
                <td>
                  <span className={`badge ${v.status === 'En movimiento' ? 'badge-green' : v.status === 'Detenido' ? 'badge-blue' : 'badge-red'}`}>
                    {v.status}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontWeight: 700, fontSize: '1rem',
                    color: v.score > 70 ? '#16a34a' : v.score > 50 ? '#d97706' : '#dc2626'
                  }}>{v.score}</span>
                </td>
                <td>{v.trips}</td>
                <td><strong>{v.km.toLocaleString()} km</strong></td>
                <td>{formatDuration(v.duration)}</td>
                <td>{v.avgKmPerTrip} km</td>
                <td>{v.avgTimePerTrip} min</td>
                <td><span className={`badge ${v.violations > 0 ? 'badge-red' : 'badge-green'}`}>{v.violations}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
        {vehicleStats.map((v, i) => {
          const utilization = v.trips > 0
            ? Math.min(Math.round((v.duration / (30 * 24 * 3600)) * 100), 100)
            : 0
          return (
            <div className="stat-card" key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.name}</div>
                <span className={`badge ${utilization > 10 ? 'badge-green' : utilization > 3 ? 'badge-yellow' : 'badge-red'}`}>
                  {utilization}% uso
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))' }}>
                <div><TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />{v.km} km</div>
                <div><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{formatDuration(v.duration)}</div>
                <div><Truck size={12} style={{ display: 'inline', marginRight: 4 }} />{v.trips} viajes</div>
                <div><Activity size={12} style={{ display: 'inline', marginRight: 4 }} />Score {v.score}</div>
              </div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'hsl(var(--border))', overflow: 'hidden' }}>
                <div style={{
                  width: `${utilization}%`, height: '100%',
                  background: utilization > 10 ? '#16a34a' : utilization > 3 ? '#d97706' : '#dc2626',
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
