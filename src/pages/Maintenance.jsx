import { useState, useEffect } from 'react'
import { Plus, Trash2, Wrench, AlertTriangle, Calendar, Gauge } from 'lucide-react'
import { getVehicles, getTrips } from '../api/fmTrackApi.js'
import { DEFAULT_FROM, DEFAULT_TO } from '../config.js'

const STORAGE_KEY = 'fm-track-maintenance'

const maintenanceTypes = [
  { value: 'aceite', label: 'Cambio de Aceite', icon: '🛢️', unit: 'km', requiresKm: true },
  { value: 'cubiertas', label: 'Cambio de Cubiertas', icon: '🔘', unit: 'km', requiresKm: true },
  { value: 'filtros', label: 'Cambio de Filtros', icon: '⚙️', unit: 'km', requiresKm: true },
  { value: 'frenos', label: 'Revisión de Frenos', icon: '🛑', unit: 'km', requiresKm: true },
  { value: 'service', label: 'Service General', icon: '🔧', unit: 'km', requiresKm: true },
  { value: 'seguro', label: 'Vencimiento de Seguro', icon: '🛡️', unit: 'fecha', requiresKm: false },
  { value: 'licencia', label: 'Vencimiento de Licencia', icon: '📄', unit: 'fecha', requiresKm: false },
  { value: 'vto_habilitacion', label: 'Vto. Habilitación Municipal', icon: '🏛️', unit: 'fecha', requiresKm: false },
  { value: 'vto_ruta', label: 'Vto. Ruta / SENASA', icon: '🚛', unit: 'fecha', requiresKm: false },
]

function getKmStatus(currentKm, lastServiceKm, intervalKm) {
  if (!lastServiceKm || !intervalKm) return { label: 'Sin datos', className: 'badge-blue' }
  const sinceLast = currentKm - lastServiceKm
  const remaining = intervalKm - sinceLast
  if (remaining <= 0) return { label: `Vencido (${Math.abs(remaining).toLocaleString()} km)`, className: 'badge-red' }
  if (remaining <= intervalKm * 0.15) return { label: `Próximo (${remaining.toLocaleString()} km)`, className: 'badge-yellow' }
  return { label: `${remaining.toLocaleString()} km restantes`, className: 'badge-green' }
}

function getDateStatus(date) {
  if (!date) return { label: 'Sin fecha', className: 'badge-blue' }
  const diff = new Date(date) - new Date()
  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: `Vencido (${Math.abs(days)} días)`, className: 'badge-red' }
  if (days === 0) return { label: 'Vence hoy', className: 'badge-yellow' }
  if (days <= 15) return { label: `En ${days} días`, className: 'badge-yellow' }
  return { label: `En ${days} días`, className: 'badge-green' }
}

export default function Maintenance() {
  const [vehicles, setVehicles] = useState([])
  const [items, setItems] = useState([])
  const [vehicleKm, setVehicleKm] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    id: Date.now().toString(), vehicleId: '', type: 'aceite',
    description: '',
    lastServiceKm: '', intervalKm: '', currentKm: '',
    lastService: '', nextService: '', notes: ''
  })

  useEffect(() => {
    getVehicles().then(async vehs => {
      setVehicles(vehs)
      const kmMap = {}
      await Promise.all(vehs.map(async v => {
        try {
          const trips = await getTrips(v.id, DEFAULT_FROM, DEFAULT_TO)
          const totalKm = (trips.trips || []).reduce((s, t) => s + (t.mileage || 0), 0)
          kmMap[v.id] = Math.round(totalKm / 1000)
        } catch { kmMap[v.id] = 0 }
      }))
      setVehicleKm(kmMap)
    }).catch(() => {})
  }, [])

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
      vehicleName: vehicles.find(v => v.id === form.vehicleId)?.name || form.vehicleId,
      id: Date.now().toString(),
    }
    saveItems([...items, entry])
    setShowModal(false)
    setForm({ id: '', vehicleId: '', type: 'aceite', description: '', lastServiceKm: '', intervalKm: '', currentKm: '', lastService: '', nextService: '', notes: '' })
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
          <p>Control de servicios por km y vencimientos por fecha</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setForm({ id: '', vehicleId: '', type: 'aceite', description: '', lastServiceKm: '', intervalKm: '', currentKm: '', lastService: '', nextService: '', notes: '' })
          setShowModal(true)
        }}>
          <Plus size={16} /> Agregar
        </button>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Total Registros</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{items.length}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Vencidos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--destructive))' }}>
            {items.filter(i => {
              if (maintenanceTypes.find(t => t.value === i.type)?.requiresKm) {
                return i.intervalKm && (i.currentKm - i.lastServiceKm) >= i.intervalKm
              }
              return i.nextService && new Date(i.nextService) < new Date()
            }).length}
          </div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Próximos a vencer</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--warning))' }}>
            {items.filter(i => {
              if (maintenanceTypes.find(t => t.value === i.type)?.requiresKm) {
                const remaining = i.intervalKm - (i.currentKm - i.lastServiceKm)
                return remaining > 0 && remaining <= i.intervalKm * 0.15
              }
              if (i.nextService) {
                const days = (new Date(i.nextService) - new Date()) / (1000 * 60 * 60 * 24)
                return days > 0 && days <= 15
              }
              return false
            }).length}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {typesWithItems.map(t => {
          if (t.items.length === 0) return null
          const isKmBased = t.requiresKm
          return (
            <div className="stat-card" key={t.value} style={{ padding: 0 }}>
              <div style={{
                padding: '12px 18px', borderBottom: '1px solid hsl(var(--border))',
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
                      {isKmBased ? (
                        <>
                          <th>Último service (km)</th>
                          <th>Intervalo (km)</th>
                          <th>Km actuales</th>
                          <th>Estado</th>
                        </>
                      ) : (
                        <>
                          <th>Último</th>
                          <th>Vencimiento</th>
                          <th>Estado</th>
                        </>
                      )}
                      <th>Notas</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.items.map(item => {
                      const status = isKmBased
                        ? getKmStatus(+(item.currentKm || 0), +(item.lastServiceKm || 0), +(item.intervalKm || 0))
                        : getDateStatus(item.nextService)
                      return (
                        <tr key={item.id} style={status.className === 'badge-red' ? {
                          background: 'hsl(350 80% 92%)',
                          borderBottom: '1px solid hsl(350 50% 85%)'
                        } : {}}>
                          {isKmBased && !item.lastServiceKm && !item.intervalKm ? (
                            <>
                              <td><strong>{item.vehicleName}</strong></td>
                              <td>{item.description || '—'}</td>
                              <td colSpan={2} style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
                                Completá km del último service e intervalo para ver el estado
                              </td>
                              <td>{item.currentKm ? `${Number(item.currentKm).toLocaleString()} km` : '—'}</td>
                              <td><span className={status.className}>{status.label}</span></td>
                              <td style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>{item.notes || '—'}</td>
                              <td>
                                <button onClick={() => handleDelete(item.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--destructive))' }}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </>
                          ) : (
                          <>
                          <td><strong>{item.vehicleName}</strong></td>
                          <td>{item.description || '—'}</td>
                          {isKmBased ? (
                            <>
                              <td>{item.lastServiceKm ? `${Number(item.lastServiceKm).toLocaleString()} km` : '—'}</td>
                              <td>{item.intervalKm ? `Cada ${Number(item.intervalKm).toLocaleString()} km` : '—'}</td>
                              <td>{item.currentKm ? `${Number(item.currentKm).toLocaleString()} km` : '—'}</td>
                              <td><span className={status.className}>{status.label}</span></td>
                            </>
                          ) : (
                            <>
                              <td>{item.lastService ? new Date(item.lastService).toLocaleDateString('es-AR') : '—'}</td>
                              <td><strong>{item.nextService ? new Date(item.nextService).toLocaleDateString('es-AR') : '—'}</strong></td>
                              <td><span className={status.className}>{status.label}</span></td>
                            </>
                          )}
                          <td style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>{item.notes || '—'}</td>
                          <td>
                            <button onClick={() => handleDelete(item.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--destructive))' }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                          </>
                          )}
                        </tr>
                      )
                    })}
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
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 16px' }}>Nuevo Registro</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Vehículo</label>
                <select value={form.vehicleId} onChange={e => {
                    const vid = e.target.value
                    const km = vehicleKm[vid] || ''
                    setForm({ ...form, vehicleId: vid, currentKm: km ? String(km) : form.currentKm })
                  }}
                  required style={{ width: '100%', padding: '8px 12px', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: '0.88rem', background: 'white' }}>
                  <option value="">Seleccionar vehículo</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} {vehicleKm[v.id] ? `(${vehicleKm[v.id].toLocaleString()} km)` : ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: '0.88rem', background: 'white' }}>
                  {maintenanceTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {maintenanceTypes.find(t => t.value === form.type)?.requiresKm ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Km en último service</label>
                    <input type="number" value={form.lastServiceKm} onChange={e => setForm({ ...form, lastServiceKm: e.target.value })}
                      placeholder="Ej: 150000" />
                  </div>
                  <div className="form-group">
                    <label>Intervalo cada (km)</label>
                    <input type="number" value={form.intervalKm} onChange={e => setForm({ ...form, intervalKm: e.target.value })}
                      placeholder="Ej: 10000" required />
                  </div>
                  <div className="form-group">
                    <label>Km actuales del vehículo</label>
                    <input type="number" value={form.currentKm} onChange={e => setForm({ ...form, currentKm: e.target.value })}
                      placeholder="Ej: 158000" required />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Último</label>
                    <input type="date" value={form.lastService} onChange={e => setForm({ ...form, lastService: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Vencimiento</label>
                    <input type="date" value={form.nextService} onChange={e => setForm({ ...form, nextService: e.target.value })} required />
                  </div>
                </div>
              )}

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
