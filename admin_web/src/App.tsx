import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import ProtectedLayout from './components/ProtectedLayout'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/pesanan" element={<OrdersPage />} />
            <Route path="/pesanan/:id" element={<OrderDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/pesanan" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}