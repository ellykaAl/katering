import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import ProtectedLayout from './components/ProtectedLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import SchedulePage from './pages/SchedulePage'
import MenusPage from './pages/MenusPage'
import CategoriesPage from './pages/CategoriesPage'
import CustomersPage from './pages/CustomersPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pesanan" element={<OrdersPage />} />
            <Route path="/pesanan/:id" element={<OrderDetailPage />} />
            <Route path="/jadwal" element={<SchedulePage />} />
            <Route path="/menu" element={<MenusPage />} />
            <Route path="/kategori" element={<CategoriesPage />} />
            <Route path="/pelanggan" element={<CustomersPage />} />
            <Route path="/pengaturan" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}