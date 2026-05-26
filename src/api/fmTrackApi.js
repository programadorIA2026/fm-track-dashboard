import { API_KEY, BASE_URL } from '../config'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}${text ? ': ' + text.slice(0, 100) : ''}`)
  }
  return res.json()
}

function buildUrl(path, params = {}) {
  const qs = new URLSearchParams({ api_key: API_KEY, ...params })
  return `${BASE_URL}${path}?${qs}`
}

export async function getVehicles() {
  return fetchJson(buildUrl('/objects', { version: '1' }))
}

export async function getLastCoordinates() {
  return fetchJson(buildUrl('/objects-last-coordinate', { version: '2' }))
}

export async function getTrips(objectId, from, to) {
  return fetchJson(buildUrl(`/objects/${objectId}/trips`, {
    version: '1', from_datetime: from, to_datetime: to
  }))
}

export async function getDrivers() {
  return fetchJson(buildUrl('/drivers', { version: '2' }))
}

export async function getUsers() {
  return fetchJson(buildUrl('/users', { version: '1' }))
}

export async function getDetectedEvents(objectId, from, to) {
  return fetchJson(buildUrl('/detected-events', {
    version: '1', object_id: objectId, from_datetime: from, to_datetime: to
  }))
}

export async function getFuelEvents(objectId, from, to) {
  return fetchJson(buildUrl('/fuel-events', {
    version: '1', object_id: objectId, from_datetime: from, to_datetime: to
  }))
}

export async function getGeozones() {
  return fetchJson(buildUrl('/geozones', { version: '1' }))
}

export async function getAllData(from, to) {
  const [vehicles, coords, drivers, users] = await Promise.all([
    getVehicles(), getLastCoordinates(), getDrivers(), getUsers()
  ])
  const enriched = vehicles.map(v => {
    const lc = coords.results?.find(c => c.id === v.id)?.last_coordinate || null
    return { ...v, last_coordinate: lc }
  })
  const tripPromises = enriched.map(v =>
    getTrips(v.id, from, to).then(r => ({ id: v.id, trips: r.trips || [] })).catch(() => ({ id: v.id, trips: [] }))
  )
  const tripsResults = await Promise.all(tripPromises)
  const tripsMap = Object.fromEntries(tripsResults.map(t => [t.id, t.trips]))

  const violationPromises = enriched.map(v =>
    getDetectedEvents(v.id, from, to)
      .then(r => ({ id: v.id, events: r.events || [] }))
      .catch(() => ({ id: v.id, events: [] }))
  )
  const vioResults = await Promise.all(violationPromises)
  const violationsMap = Object.fromEntries(vioResults.map(v => [v.id, v.events]))

  return {
    vehicles: enriched.map(v => ({ ...v, trips: tripsMap[v.id] || [], violations: violationsMap[v.id] || [] })),
    drivers, users
  }
}
