import { useState, useEffect } from 'react'
import { Plus, Trash2, Map, Circle, AlertTriangle } from 'lucide-react'
import { MapContainer, TileLayer, Circle as CircleLeaflet, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const STORAGE_KEY = 'fm-track-zones'
const centerIcon = L.divIcon({
  className: 'vehicle-marker-icon',
  html: `<div style="width:12px;height:12px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) })
  return null
}

export default function Zones() {
  const [zones, setZones] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newZone, setNewZone] = useState({ name: '', lat: -24.84, lng: -65.41, radius: 500, color: '#3b82f6' })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setZones(JSON.parse(saved))
    } catch {}
  }, [])

  function saveZones(newZones) {
    setZones(newZones)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newZones))
  }

  function handleAdd() {
    if (!newZone.name) return
    saveZones([...zones, { ...newZone, id: Date.now().toString() }])
    setShowModal(false)
    setNewZone({ name: '', lat: -24.84, lng: -65.41, radius: 500, color: '#3b82f6' })
  }

  function handleDelete(id) {
    if (confirm('¿Eliminar esta zona?'))
      saveZones(zones.filter(z => z.id !== id))
  }

  const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="page-title">
          <h1>Zonas</h1>
          <p>Geocercas y delimitación de áreas de operación</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nueva Zona
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
        <div className="map-container" style={{ height: '400px' }}>
          <MapContainer
            center={[-24.84, -65.41]} zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {zones.map(z => (
              <CircleLeaflet
                key={z.id}
                center={[z.lat, z.lng]}
                radius={z.radius}
                pathOptions={{
                  color: z.color,
                  fillColor: z.color,
                  fillOpacity: 0.15,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'system-ui' }}>
                    <strong>{z.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Radio: {z.radius}m
                    </div>
                  </div>
                </Popup>
              </CircleLeaflet>
            ))}
          </MapContainer>
        </div>

        <div className="stat-card" style={{ overflow: 'auto', maxHeight: 400 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 12px' }}>Zonas definidas</h3>
          {zones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
              <Map size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p>No hay zonas definidas</p>
              <p style={{ fontSize: '0.8rem' }}>Creá zonas para monitorear el área de operación de tus vehículos</p>
            </div>
          ) : zones.map(z => (
            <div key={z.id} style={{
              padding: '10px 12px', borderBottom: '1px solid hsl(var(--border))',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: z.color }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{z.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                    Radio {z.radius}m
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(z.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--destructive))' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 16px' }}>Nueva Zona</h2>
            <div className="form-group">
              <label>Nombre de la zona</label>
              <input value={newZone.name} onChange={e => setNewZone({ ...newZone, name: e.target.value })} placeholder="Ej: Zona Salta Centro" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Latitud</label>
                <input type="number" step="0.0001" value={newZone.lat} onChange={e => setNewZone({ ...newZone, lat: +e.target.value })} />
              </div>
              <div className="form-group">
                <label>Longitud</label>
                <input type="number" step="0.0001" value={newZone.lng} onChange={e => setNewZone({ ...newZone, lng: +e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Radio (metros)</label>
              <input type="number" value={newZone.radius} onChange={e => setNewZone({ ...newZone, radius: +e.target.value })} />
            </div>
            <div className="form-group">
              <label>Color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {colors.map(c => (
                  <div key={c} onClick={() => setNewZone({ ...newZone, color: c })}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: c,
                      cursor: 'pointer', border: newZone.color === c ? '3px solid hsl(var(--foreground))' : '3px solid transparent'
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAdd}>Agregar Zona</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
