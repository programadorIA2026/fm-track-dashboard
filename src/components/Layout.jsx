import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import NotificationPanel from './NotificationPanel.jsx'
import { useState, useEffect } from 'react'
import { getAllData } from '../api/fmTrackApi.js'
import { DEFAULT_FROM, DEFAULT_TO } from '../config.js'

const pageTitles = {
  '/': { title: 'Dashboard', sub: 'Monitoreo en vivo de la flota' },
  '/viajes': { title: 'Viajes', sub: 'Historial de viajes y distancias' },
  '/excesos': { title: 'Excesos de Velocidad', sub: 'Eventos de exceso de velocidad' },
  '/productividad': { title: 'Productividad', sub: 'Análisis de rendimiento de la flota' },
  '/mantenimiento': { title: 'Mantenimiento', sub: 'Control de servicios, seguros y vencimientos' },
  '/zonas': { title: 'Zonas', sub: 'Geocercas y alertas de zona' },
}

export default function Layout() {
  const location = useLocation()
  const [allViolations, setAllViolations] = useState([])
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    getAllData(DEFAULT_FROM, DEFAULT_TO).then(d => {
      setVehicles(d.vehicles)
      setAllViolations(d.vehicles.flatMap(v => v.violations.map(e => ({ ...e, object_id: v.id }))))
    }).catch(() => {})
  }, [])

  const page = pageTitles[location.pathname] || { title: '', sub: '' }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div style={{ fontWeight: 600 }}>{page.title}</div>
            <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>{page.sub}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationPanel violations={allViolations} vehicles={vehicles} />
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'hsl(var(--success))',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>En vivo</span>
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
