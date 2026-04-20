/**
 * Manage condominiums
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { getCondominiums, createCondominium } from '../../services/adminApi'
import { useAuth } from '../../hooks/useAuth'

export default function CondominiumManager() {
  const navigate = useNavigate()
  const { isAdmin, loading: authLoading } = useAuth()
  const [condominiums, setCondominiums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    cnpj: '',
    phone: '',
    email_admin: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // ============================================
    // VERIFICA SE É ADMIN
    // ============================================
    if (!authLoading && !isAdmin) {
      navigate('/Admin')
      return
    }
    loadCondominiums()
  }, [authLoading, isAdmin, navigate])

  const loadCondominiums = async () => {
    const result = await getCondominiums()
    if (result.success) {
      setCondominiums(result.condominiums)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    const result = await createCondominium(formData)
    if (result.success) {
      setSuccess(`Condomínio ${formData.name} criado com sucesso! ID: ${result.condominium_id}`)
      setShowForm(false)
      setFormData({ name: '', address: '', cnpj: '', phone: '', email_admin: '' })
      loadCondominiums()
    } else {
      setError(result.error)
    }
  }

  const handleSelectCondominium = (condId, condName) => {
    localStorage.setItem('selectedCondId', condId)
    localStorage.setItem('selectedCondName', condName)
    navigate(`/admin/condominios/${condId}/dashboard`)
  }

  if (loading || authLoading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Condomínios</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Novo Condomínio'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Condomínio</CardTitle>
            <CardDescription>Cadastre um novo condomínio no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {success && <Alert className="bg-green-50"><AlertDescription>{success}</AlertDescription></Alert>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Condomínio *</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email do Administrador *</Label>
                  <Input type="email" required value={formData.email_admin} onChange={(e) => setFormData({...formData, email_admin: e.target.value})} />
                </div>
              </div>
              
              <Button type="submit">Criar Condomínio</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Condomínios</CardTitle>
          <CardDescription>{condominiums.length} condomínio(s) cadastrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {condominiums.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum condomínio cadastrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Admin Email</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {condominiums.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.address || '-'}</TableCell>
                    <TableCell>{c.email_admin}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleSelectCondominium(c.id, c.name)}>
                        Selecionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}