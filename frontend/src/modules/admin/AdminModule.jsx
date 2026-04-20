/**
 * Módulo 1 - Admin Module (Ponto de Entrada)
 * Este módulo gerencia toda a funcionalidade administrativa
 * 
 * URL de acesso: /Admin (case-sensitive)
 * 
 * A palavra "Admin" adjacente à URL base é a forma escondida de acessar
 * Exemplo: http://localhost:3000/Admin
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

/**
 * Verifica se o usuário está autenticado
 * Se não estiver, redireciona para a tela de login
 */
function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/Admin" replace />
  }
  
  return children
}

/**
 * Módulo Admin - Exportação principal
 * Define as rotas internas do módulo:
 * - /Admin -> Tela de login
 * - /Admin/dashboard -> Dashboard com menu (protegido)
 */
export default function AdminModule() {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        } 
      />
    </Routes>
  )
}