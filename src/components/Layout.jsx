import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div style={{ fontWeight: 600 }}>Panel de Monitoreo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(var(--primary))', display: 'inline-block' }} />
            En vivo
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
