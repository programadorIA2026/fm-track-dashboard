import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Trips from './pages/Trips.jsx'
import Violations from './pages/Violations.jsx'
import Productivity from './pages/Productivity.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/viajes" element={<Trips />} />
        <Route path="/excesos" element={<Violations />} />
        <Route path="/productividad" element={<Productivity />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
