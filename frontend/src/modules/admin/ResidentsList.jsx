/**
 * Lista de Residentes (Votantes)
 * Exibe todos os moradores cadastrados no condomínio
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { getResidents } from '../../services/adminApi'

export default function ResidentsList() {
  const { condId } = useParams()
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (condId) {
      loadResidents()
    }
  }, [condId])

  const loadResidents = async () => {
    setLoading(true)
    const result = await getResidents(condId)
    
    if (result.success) {
      setResidents(result.residents || [])
      setError('')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const formatCpf = (cpf) => {
    if (!cpf) return '-'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Carregando residentes...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Residentes / Votantes</CardTitle>
        <CardDescription>
          Lista de todos os moradores cadastrados neste condomínio
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {residents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nenhum residente cadastrado. Faça o upload do Excel com os votantes.
          </div>
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
                {residents.map((resident) => (
                  <TableRow key={resident.email}>
                    <TableCell className="font-medium">{resident.apartment}</TableCell>
                    <TableCell>{resident.name}</TableCell>
                    <TableCell>{resident.email}</TableCell>
                    <TableCell className="font-mono">{formatCpf(resident.cpf)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        resident.can_vote 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {resident.can_vote ? 'Sim' : 'Não (deu procuração)'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}