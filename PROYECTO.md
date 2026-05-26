# Monitoreo de Flotas - Dashboard

Dashboard de monitoreo de flota para **DON DANTE SRL** usando la API de Ruptela (api.fm-track.com).

## Stack

- **Framework:** React 19 + Vite 8
- **Estilos:** Tailwind CSS v4 (tema claro corporativo)
- **Mapas:** Google Maps (via @react-google-maps/api) + Leaflet (zonas polígonos)
- **Gráficos:** Recharts
- **Iconos:** Lucide React
- **Ruteo:** React Router DOM
- **API:** Ruptela FM-Track (api.fm-track.com)

## Estructura del proyecto

```
fm-track-dashboard/
├── index.html
├── package.json
├── vite.config.js           # Proxy /api-proxy → api.fm-track.com (CORS fix)
├── vercel.json              # Rewrites SPA + proxy API
├── src/
│   ├── main.jsx             # Entry point con BrowserRouter
│   ├── App.jsx              # Routes
│   ├── config.js            # API_KEY, GOOGLE_MAPS_KEY, etc.
│   ├── index.css            # Tema claro corporativo
│   ├── api/
│   │   └── fmTrackApi.js    # Todos los llamados a la API de Ruptela
│   ├── utils/
│   │   └── helpers.js       # FormatDuration, formatMeters, vehicleStatus, etc.
│   ├── components/
│   │   ├── Layout.jsx       # Layout principal con topbar + sidebar + notificaciones
│   │   ├── Sidebar.jsx      # Navegación lateral
│   │   ├── MapView.jsx      # (obsoleto - Leaflet) Reemplazado por GoogleMapView
│   │   ├── GoogleMapView.jsx # Componente mapa Google Maps
│   │   └── NotificationPanel.jsx  # Panel de notificaciones de excesos
│   └── pages/
│       ├── Dashboard.jsx    # Mapa en vivo + stats + tarjetas vehículos
│       ├── Trips.jsx        # Reporte de viajes con filtros y export CSV
│       ├── Violations.jsx   # Excesos de velocidad con mapa y export CSV
│       ├── Productivity.jsx # Score, km/vehículo, actividad por hora
│       ├── Maintenance.jsx  # Mantenimiento por km (aceite, cubiertas) y fecha (seguro, licencia)
│       └── Zones.jsx        # Geocercas circulares y polígonos dibujables
```

## API Key (FM-Track)

```
API_KEY = 0Rgf-opKTQimHfGHpSpVkK_dGXh42Tke
BASE_URL = /api-proxy  (se resuelve a https://api.fm-track.com via proxy de Vercel)
```

### Vehículos disponibles

| Vehículo | ID (UUID) | IMEI | Última actividad |
|---|---|---|---|
| OTW225 - MERCEDS | f977f940-c868-11ea-9cbc-337efbacf0eb | 862549043203598 | Activo (26/05/2026) |
| NXV 575 | ff8738aa-0778-11ec-9085-5394d7288496 | 861359039199813 | 13/05/2026 |
| AD432TF | dbf67c38-e92f-11ef-840c-ef265be26118 | 867481032587572 | Activo (26/05/2026) |
| Achelo AE-333-MV | f1c96f06-e930-11ef-a024-6f7ec207370c | 864547036088677 | Activo (26/05/2026) |

### Endpoints API usados

- `GET /objects?version=1` - Listar vehículos
- `GET /objects-last-coordinate?version=2` - Últimas coordenadas
- `GET /objects/{id}/trips?version=1` - Viajes por vehículo
- `GET /detected-events?version=1` - Excesos de velocidad
- `GET /fuel-events?version=1` - Eventos de combustible
- `GET /drivers?version=2` - Conductores
- `GET /users?version=1` - Usuarios
- `GET /geozones?version=1` - Geocercas (desde API)

### Endpoints sin acceso (403)
Ecodriving, driver state, coordinate history, countries report.

## Configuración necesaria

### Google Maps
En `src/config.js`:
```js
export const GOOGLE_MAPS_KEY = 'AIzaSy...'  // Maps JavaScript API
```
Sin esta key los mapas muestran error. Obtener de console.cloud.google.com.

## Funcionalidades implementadas

### Dashboard (/)
- Mapa Google Maps con marcadores animados por vehículo (verde = mov, azul = detenido, rojo = offline)
- Stats: total vehículos, online/offline, km totales, excesos
- Tarjetas individuales por vehículo con estado, velocidad, km, excesos
- Polling cada 30s
- Exportar PDF (window.print)

### Viajes (/viajes)
- Filtro por vehículo y rango de fechas
- Stats: total viajes, distancia total, duración, promedio
- Tabla con origen/destino (localidad), duración, distancia
- Export CSV y PDF
- Límite 500 viajes en pantalla (completo en CSV)

### Excesos de Velocidad (/excesos)
- Mapa Google con puntos rojos de excesos
- Stats: total, velocidad máxima, días con eventos, límite más común
- Tabla con detalle: vehículo, evento, velocidad, ubicación
- Export CSV y PDF

### Productividad (/productividad)
- Score de productividad (0-100) combinando viajes, km y excesos
- Gráfico de barras: km por vehículo
- Pie chart: distribución de km
- Gráfico de actividad por hora (excesos)
- Score horizontal bar chart
- Tabla comparativa completa
- Tarjetas individuales con % de utilización

### Mantenimiento (/mantenimiento)
- Dos tipos de items:
  - **Por km:** Cambio de aceite, cubiertas, filtros, frenos, service general
  - **Por fecha:** Seguro, licencia, habilitación municipal, ruta/SENASA
- Al seleccionar vehículo, auto-completa km actuales desde viajes
- Campos: km último service, intervalo cada X km, km actuales
- Colores: verde (ok), amarillo (próximo <15%), rojo (vencido)
- Filas vencidas con fondo rosa pastel
- Datos guardados en localStorage (clave: fm-track-maintenance)
- Modal de creación con validaciones

### Zonas (/zonas)
- Dos tipos de geocercas:
  - **Circulares:** click en mapa para definir centro, luego modal con nombre y radio
  - **Polígonos:** modo dibujo, click para agregar vértices, numerados
- Botones claros: "Zona Circular" (primary), "Dibujar Polígono" (outline)
- Preview en tiempo real durante dibujo
- Datos guardados en localStorage (clave: fm-track-zones2)

### Notificaciones
- Panel de notificaciones en topbar (campana)
- Detecta excesos de velocidad nuevos automáticamente
- Muestra alertas que desaparecen a los 8 segundos
- Contador de notificaciones no leídas

## Deploy

### GitHub
```bash
git remote set-url origin https://github.com/programadorIA2026/fm-track-dashboard.git
git push -u origin main
```

### Vercel
- Conectar repo de GitHub
- Vercel detecta Vite automáticamente
- vercel.json configurado con rewrites SPA + proxy API

## Próximas mejoras posibles
- Autenticación/login para múltiples clientes
- Historial de rutas en mapa por vehículo
- Alertas sonoras de excesos
- Reportes programados por email
- Panel admin con usuarios y permisos
- Integración con alertas de geocercas (cuando la API tenga datos)
- Múltiples períodos seleccionables (no solo abril 2026)
