import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Truck, Gauge, BarChart3,
  ChevronRight, Wrench, Map, Bell
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/viajes', icon: Truck, label: 'Viajes' },
  { to: '/excesos', icon: Gauge, label: 'Excesos Velocidad' },
  { to: '/productividad', icon: BarChart3, label: 'Productividad' },
  { to: '/mantenimiento', icon: Wrench, label: 'Mantenimiento' },
  { to: '/zonas', icon: Map, label: 'Zonas' },
]

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <a href="https://monitoreodeflotas.com" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ background: 'white', borderRadius: 8, padding: 4, display: 'flex' }}>
            <img
              src="/logo.png"
              alt="Monitoreo de Flotas"
              style={{ height: 32, width: 'auto' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'white', lineHeight: 1.2 }}>
              Monitoreo de<br />Flotas
            </div>
            <div style={{ fontSize: '0.65rem', color: 'hsl(var(--sidebar-foreground) / 0.6)' }}>Dashboard</div>
          </div>
        </a>
      </div>

      <nav style={{ padding: '12px 0', flex: 1 }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={18} />
            <span style={{ flex: 1 }}>{item.label}</span>
            <ChevronRight size={14} />
          </NavLink>
        ))}
      </nav>

      <div style={{
        padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: '0.78rem', color: 'hsl(var(--sidebar-foreground) / 0.7)',
        textAlign: 'center'
      }}>
        DON DANTE SRL
      </div>
    </div>
  )
}
