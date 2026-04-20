import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AdminLogin from './modules/admin/AdminLogin'
import AdminDashboard from './modules/admin/AdminDashboard'
import UploadVoters from './modules/admin/UploadVoters'
import UploadProxy from './modules/admin/UploadProxy'
import ResidentsList from './modules/admin/ResidentsList'
import ProxiesList from './modules/admin/ProxiesList'
import AssemblyManager from './modules/admin/AssemblyManager'
import CondominiumManager from './modules/admin/CondominiumManager'
import VotingModule from './modules/voting/VotingModule'

// Componente para proteger rotas admin
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }
  
  if (!user) {
    return <Navigate to="/Admin" replace />
  }
  
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Voting Module - Public routes (NÃO usa Firebase Auth) */}
        <Route path="/vote/*" element={<VotingModule />} />
        
        {/* Admin routes - Protegidas com Firebase Auth */}
        <Route path="/Admin" element={<AdminLogin />} />
        <Route path="/admin/condominios" element={
          <AdminRoute>
            <CondominiumManager />
          </AdminRoute>
        } />
        <Route path="/admin/condominios/:condId/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/condominios/:condId/votantes" element={
          <AdminRoute>
            <UploadVoters />
          </AdminRoute>
        } />
        <Route path="/admin/condominios/:condId/procuracao" element={
          <AdminRoute>
            <UploadProxy />
          </AdminRoute>
        } />
        <Route path="/admin/condominios/:condId/residentes" element={
          <AdminRoute>
            <ResidentsList />
          </AdminRoute>
        } />
        <Route path="/admin/condominios/:condId/procuracaoes" element={
          <AdminRoute>
            <ProxiesList />
          </AdminRoute>
        } />
        <Route path="/admin/condominios/:condId/votacoes" element={
          <AdminRoute>
            <AssemblyManager />
          </AdminRoute>
        } />
        
        {/* Default route - redirect to voting module */}
        <Route path="/" element={<Navigate to="/vote" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App