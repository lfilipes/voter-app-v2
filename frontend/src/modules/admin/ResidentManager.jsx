/**
 * Manage residents (voters) for a condominium
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { getResidents, uploadResidentsExcel } from '../../services/adminApi'

export default function ResidentManager() {
  const { condId } = useParams()
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (condId) loadResidents()
  }, [condId])

  const loadResidents = async () => {
    const result = await getResidents(condId)
    if (result.success) {
      setResidents(result.residents)
    }
    setLoading(false)
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Selecione um arquivo Excel')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    const result = await uploadResidentsExcel(condId, file)
    if (result.success) {
      setSuccess(`${result.created} residentes importados com sucesso!`)
      setFile(null)
      document.getElementById('excel-file').value = ''
      loadResidents()
    } else {
      setError(result.error)
    }
    setUploading(false)
  }

  if (loading) return <div className="text-center py-8">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Moradores / Votantes</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importar via Excel</CardTitle>
          <CardDescription>
            O arquivo deve ter as colunas: nome, email, apartamento, cpf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFileUpload} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert className="bg-green-50"><AlertDescription>{success}</AlertDescription></Alert>}
            
            <div className="space-y-2">
              <Label>Arquivo Excel</Label>
              <Input id="excel-file" type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} required />
            </div>
            
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Importando...' : 'Importar Votantes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Moradores</CardTitle>
          <CardDescription>{residents.length} morador(es) cadastrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {residents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum morador cadastrado</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apartamento</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Pode Votar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residents.map((r) => (
                    <TableRow key={r.email}>
                      <TableCell>{r.apartment}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell className="font-mono">{r.cpf}</TableCell>
                      <TableCell>{r.can_vote ? 'Sim' : 'Não (deu procuração)'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}