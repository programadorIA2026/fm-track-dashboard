export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatMeters(m) {
  if (!m || m <= 0) return '0 km'
  const km = m / 1000
  if (km < 1) return `${Math.round(m)} m`
  return `${km.toLocaleString('es-AR', { maximumFractionDigits: 1 })} km`
}

export function formatSpeed(s) {
  if (s == null) return '—'
  return `${Math.round(s)} km/h`
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function formatTimeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `Hace ${days}d`
}

export function vehicleStatus(lastCoord) {
  if (!lastCoord) return { label: 'Sin datos', className: 'badge-red' }
  const diff = Date.now() - new Date(lastCoord.server_datetime).getTime()
  const hours = diff / 3600000
  if (hours > 24) return { label: 'Offline', className: 'badge-red' }
  if (lastCoord.speed > 0) return { label: 'En movimiento', className: 'badge-green' }
  if (hours > 2) return { label: 'Detenido', className: 'badge-yellow' }
  return { label: 'Detenido', className: 'badge-blue' }
}

export function getLatLngBounds(vehicles) {
  const coords = vehicles
    .filter(v => v.last_coordinate)
    .map(v => [v.last_coordinate.latitude, v.last_coordinate.longitude])
  if (coords.length === 0) return null
  const lats = coords.map(c => c[0])
  const lngs = coords.map(c => c[1])
  return [
    [Math.min(...lats) - 0.05, Math.min(...lngs) - 0.05],
    [Math.max(...lats) + 0.05, Math.max(...lngs) + 0.05]
  ]
}
