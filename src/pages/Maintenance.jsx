import { useState, useEffect } from 'react'
import { Plus, Trash2, Wrench, AlertTriangle, Calendar, FileText } from 'lucide-react'
import { getVehicles } from '../api/fmTrackApi.js'

const STORAGE_KEY = 'fm-track-maintenance'

const defaultMaintenance = {
  id: '',
  vehicleId: '',
  vehicleName: '',
  type: 'aceite',
  description: '',
  lastService: '',
  nextService: '',
  notes: ''
}

const maintenanceTypes = [
  { value: 'aceite', label: 'Cambio de Aceite', icon: '🛢️' },
  { value: 'cubiertas', label: 'Cambio de Cubiertas', icon: '🔘' },
  { value: 'seguro', label: 'Vencimiento de Seguro', icon: '🛡️' },
  { value: 'licencia', label: 'Vencimiento de Licencia', icon: '📄' },
  { value: 'service', label: 'Service General', icon: '🔧' },
  { value: 'filtros', label: 'Cambio de Filtros', icon: '⚙️' },
  { value: 'frenos', label: 'Revision de Frenos', icon: '🛑' },
]

function getStatusColor(date) {
  if (!date) return 'badge-blue'
  const diff = new Date(date) - new Date()
  const days = diff / (1000 * 60 * 60 * 24)
  if (days < 0) return 'badge-red'
  if (days < 15) return 'badge-yellow'
  return 'badge-green'
}

function getStatusLabel(date) {
  if (!date) return 'Sin fecha'
  const diff = new Date(date) - new Date()
  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return `Vencido (${Math.abs(days)} días)`
  if (days === 0) return 'Vence hoy'
  return `En ${days} días`
}

export default function Maintenance() {
  const [vehicles, setVehicles] = useState([])
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...defaultMaintenance, id: Date.now().toString() })

  useEffect(() => { getVehicles().then(setVehicles).catch(() => {}) }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch {}
  }, [])

  function saveItems(newItems) {
    setItems(newItems)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const entry = {
      ...form,
      vehicleName: vehicles.find(v => v.id === form.vehicleId)?.name || form.vehicleId
    }
    if (items.find(i => i.id === form.id)) {
      saveItems(items.map(i => i.id === form.id ? entry : i))
    } else {
      saveItems([...items, { ...entry, id: Date.now().toString() }])
    }
    setShowModal(false)
    setForm({ ...defaultMaintenance, id: Date.now().toString() })
  }

  function handleDelete(id) {
    if (confirm('¿Eliminar este registro?'))
      saveItems(items.filter(i => i.id !== id))
  }

  const typesWithItems = maintenanceTypes.map(t => ({
    ...t,
    items: items.filter(i => i.type === t.value)
  }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="page-title">
          <h1>Mantenimiento</h1>
          <p>Control de servicios, seguros y vencimientos por vehículo</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setForm({ ...defaultMaintenance, id: Date.now().toString() })
          setShowModal(true)
        }}>
          <Plus size={16} /> Agregar
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {typesWithItems.map(t => {
          if (t.items.length === 0) return null
          return (
            <div className="stat-card" key={t.value} style={{ padding: 0 }}>
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid hsl(var(--border))',
                background: 'hsl(var(--muted) / 0.3)',
                fontSize: '0.88rem', fontWeight: 600
              }}>
                {t.icon} {t.label}
              </div>
              <div style={{ overflow: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vehículo</th>
                      <th>Descripción</th>
                      <th>Último servicio</th>
                      <th>Próximo vencimiento</th>
                      <th>Estado</th>
                      <th>Notas</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.items.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.vehicleName}</strong></td>
                        <td>{item.description || '—'}</td>
                        <td>{item.lastService ? new Date(item.lastService).toLocaleDateString('es-AR') : '—'}</td>
                        <td><strong>{item.nextService ? new Date(item.nextService).toLocaleDateString('es-AR') : '—'}</strong></td>
                        <td>
                          <span className={getStatusColor(item.nextService)}>
                            {getStatusLabel(item.nextService)}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                          {item.notes || '—'}
                        </td>
                        <td>
                          <button onClick={() => handleDelete(item.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--destructive))' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
        {items.length === 0 && (
          <div className="stat-card" style={{ textAlign: 'center', padding: 40 }}>
            <Wrench size={40} style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 12 }} />
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>No hay registros de mantenimiento todavía.</p>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
              Hacé clic en "Agregar" para programar cambios de aceite, cubiertas, seguros, etc.
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 16px' }}>
              {form.id ? 'Nuevo Registro' : 'Editar Registro'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Vehículo</label>
                <select
                  value={form.vehicleId}
                  onChange={e => setForm({ ...form, vehicleId: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '8px 12px',
                    border: '1px solid hsl(var(--border))', borderRadius: 8,
                    fontSize: '0.88rem', background: 'white'
                  }}
                >
                  <option value="">Seleccionar vehículo</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 12px',
                    border: '1px solid hsl(var(--border))', borderRadius: 8,
                    fontSize: '0.88rem', background: 'white'
                  }}
                >
                  {maintenanceTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Último servicio</label>
                  <input type="date" value={form.lastService} onChange={e => setForm({ ...form, lastService: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Próximo vencimiento</label>
                  <input type="date" value={form.nextService} onChange={e => setForm({ ...form, nextService: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
