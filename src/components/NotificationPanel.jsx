import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, AlertTriangle } from 'lucide-react'

export default function NotificationPanel({ violations, vehicles }) {
  const [notifications, setNotifications] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const lastCount = useRef(0)

  useEffect(() => {
    if (!violations || violations.length === lastCount.current) return
    const newOnes = violations.slice(lastCount.current)
    lastCount.current = violations.length
    if (newOnes.length === 0) return
    newOnes.forEach(v => {
      const veh = vehicles?.find(vv => vv.id === v.object_id)
      const id = Date.now() + Math.random()
      setNotifications(prev => [{
        id,
        vehicle: veh?.name || v.object_id,
        message: `Exceso de velocidad: ${v.name}`,
        speed: v.start?.speed,
        time: v.start?.datetime,
        icon: AlertTriangle
      }, ...prev].slice(0, 20))
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, 8000)
    })
  }, [violations])

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button className="btn-outline" onClick={() => setShowPanel(!showPanel)} style={{ padding: '8px 12px' }}>
          <Bell size={18} />
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: 'hsl(var(--destructive))', color: 'white',
              width: 18, height: 18, borderRadius: '50%',
              fontSize: '0.65rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 700
            }}>{notifications.length}</span>
          )}
        </button>
      </div>

      {showPanel && (
        <div style={{
          position: 'fixed', top: 60, right: 16, width: 360,
          maxHeight: '60vh', background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          zIndex: 999, overflow: 'auto'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '14px 16px',
            borderBottom: '1px solid hsl(var(--border))'
          }}>
            <strong>Notificaciones</strong>
            <button onClick={() => setShowPanel(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>
              <X size={16} />
            </button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
              Sin notificaciones
            </div>
          ) : notifications.map(n => (
            <div key={n.id} style={{
              padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))',
              display: 'flex', gap: 10, alignItems: 'flex-start'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'hsl(var(--destructive) / 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={14} color="hsl(var(--destructive))" />
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600 }}>{n.vehicle}</div>
                <div>{n.message} · <strong>{Math.round(n.speed)} km/h</strong></div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                  {new Date(n.time).toLocaleString('es-AR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
