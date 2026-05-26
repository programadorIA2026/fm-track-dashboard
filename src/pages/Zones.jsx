import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Map, Circle, Hexagon, Crosshair } from 'lucide-react'
import { MapContainer, TileLayer, Polygon, Circle as CircleLeaflet, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const STORAGE_KEY = 'fm-track-zones2'

function getCenter(points) {
  if (!points || points.length === 0) return [-24.84, -65.41]
  const lats = points.map(p => p[0])
  const lngs = points.map(p => p[1])
  return [lats.reduce((a, b) => a + b, 0) / lats.length, lngs.reduce((a, b) => a + b, 0) / lngs.length]
}

function ClickHandler({ drawing, onAddPoint }) {
  useMapEvents({
    click: (e) => {
      if (drawing) {
        onAddPoint([e.latlng.lat, e.latlng.lng])
      }
    }
  })
  return null
}

const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#ec4899', '#0891b2']

export default function Zones() {
  const [zones, setZones] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [drawPoints, setDrawPoints] = useState([])
  const [newZone, setNewZone] = useState({ name: '', type: 'circle', lat: -24.84, lng: -65.41, radius: 500, color: '#2563eb', points: [] })

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

  function handleAddPoint(latlng) {
    setDrawPoints(prev => [...prev, latlng])
  }

  function handleUndoPoint() {
    setDrawPoints(prev => prev.slice(0, -1))
  }

  function finishDrawing() {
    if (drawPoints.length < 3) {
      alert('Se necesitan al menos 3 puntos para un polígono')
      return
    }
    setNewZone({ name: '', type: 'polygon', lat: -24.84, lng: -65.41, radius: 500, color: '#2563eb', points: [...drawPoints] })
    setDrawing(false)
    setDrawPoints([])
    setShowModal(true)
  }

  function cancelDrawing() {
    setDrawing(false)
    setDrawPoints([])
  }

  function handleSave() {
    if (!newZone.name) return
    const zone = {
      ...newZone,
      id: Date.now().toString(),
      center: newZone.type === 'polygon' ? getCenter(newZone.points) : [newZone.lat, newZone.lng],
    }
    saveZones([...zones, zone])
    setShowModal(false)
    setNewZone({ name: '', type: 'circle', lat: -24.84, lng: -65.41, radius: 500, color: '#2563eb', points: [] })
  }

  function handleDelete(id) {
    if (confirm('¿Eliminar esta zona?'))
      saveZones(zones.filter(z => z.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="page-title">
          <h1>Zonas</h1>
          <p>Geocercas circulares y polígonos dibujables en el mapa</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {drawing ? (
            <>
              <button className="btn-outline" onClick={handleUndoPoint} disabled={drawPoints.length === 0}>
                Deshacer punto ({drawPoints.length})
              </button>
              <button className="btn-primary" onClick={finishDrawing} disabled={drawPoints.length < 3}>
                <Hexagon size={16} /> Finalizar polígono
              </button>
              <button className="btn-danger" onClick={cancelDrawing}>
                Cancelar dibujo
              </button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={() => {
                setNewZone({ name: '', type: 'circle', lat: -24.84, lng: -65.41, radius: 500, color: '#2563eb', points: [] })
                setShowModal(true)
              }}>
                <Plus size={16} /> Zona Circular
              </button>
              <button className="btn-outline" onClick={() => {
                setDrawing(true); setDrawPoints([])
              }}>
                <Hexagon size={16} /> Dibujar Polígono
              </button>
            </>
          )}
        </div>
      </div>

      {drawing && (
        <div className="stat-card" style={{ marginBottom: 16, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Crosshair size={18} color="hsl(var(--primary))" />
          <span style={{ fontSize: '0.88rem' }}>
            <strong>Dibujando polígono:</strong> hacé clic en el mapa para agregar puntos ({drawPoints.length} puntos)
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>
        <div className="map-container" style={{ height: '450px' }}>
          <MapContainer
            center={[-24.84, -65.41]} zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler drawing={drawing} onAddPoint={handleAddPoint} />

            {zones.filter(z => z.type === 'circle').map(z => (
              <CircleLeaflet
                key={z.id}
                center={z.center || [z.lat, z.lng]}
                radius={z.radius}
                pathOptions={{ color: z.color, fillColor: z.color, fillOpacity: 0.12, weight: 2 }}
              >
                <Popup>
                  <div style={{ fontFamily: 'system-ui' }}>
                    <strong>{z.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Radio: {z.radius}m</div>
                  </div>
                </Popup>
              </CircleLeaflet>
            ))}

            {zones.filter(z => z.type === 'polygon').map(z => (
              <Polygon
                key={z.id}
                positions={z.points}
                pathOptions={{ color: z.color, fillColor: z.color, fillOpacity: 0.12, weight: 2 }}
              >
                <Popup>
                  <div style={{ fontFamily: 'system-ui' }}>
                    <strong>{z.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{z.points.length} vértices</div>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {drawPoints.length > 0 && (
              <>
                <Polygon
                  positions={drawPoints}
                  pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.08, weight: 2, dashArray: '5,5' }}
                />
                {drawPoints.map((p, i) => (
                  <Marker key={i} position={p} icon={L.divIcon({
                    className: 'vehicle-marker-icon',
                    html: `<div style="width:10px;height:10px;background:#2563eb;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:8px;font-weight:700">${i + 1}</div>`,
                    iconSize: [14, 14], iconAnchor: [7, 7],
                  })} />
                ))}
              </>
            )}
          </MapContainer>
        </div>

        <div className="stat-card" style={{ overflow: 'auto', maxHeight: 450 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 12px' }}>
            Zonas ({zones.length})
          </h3>
          {zones.length === 0 && !drawing ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
              <Map size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p>No hay zonas definidas</p>
              <p style={{ fontSize: '0.8rem' }}>
                Creá zonas circulares o dibujá polígonos para delimitar áreas como parcelas, fincas, depósitos, etc.
              </p>
            </div>
          ) : zones.map(z => (
            <div key={z.id} style={{
              padding: '10px 12px', borderBottom: '1px solid hsl(var(--border))',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: z.type === 'polygon' ? 2 : '50%', background: z.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{z.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>
                    {z.type === 'circle' ? `Radial ${z.radius}m` : `Polígono (${z.points.length} vértices)`}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(z.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--destructive))', flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 16px' }}>
              {newZone.type === 'polygon' ? 'Guardar Polígono' : 'Nueva Zona Circular'}
            </h2>
            <div className="form-group">
              <label>Nombre de la zona</label>
              <input value={newZone.name} onChange={e => setNewZone({ ...newZone, name: e.target.value })}
                placeholder={newZone.type === 'polygon' ? 'Ej: Parcela Norte' : 'Ej: Zona Salta Centro'} />
            </div>

            {newZone.type === 'circle' && (
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
            )}

            {newZone.type === 'circle' && (
              <div className="form-group">
                <label>Radio (metros)</label>
                <input type="number" value={newZone.radius} onChange={e => setNewZone({ ...newZone, radius: +e.target.value })} />
              </div>
            )}

            {newZone.type === 'polygon' && (
              <div className="form-group">
                <label>Vértices: {newZone.points.length}</label>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                  Puntos capturados del dibujo en el mapa
                </div>
              </div>
            )}

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
              <button className="btn-primary" onClick={handleSave}>Guardar Zona</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
