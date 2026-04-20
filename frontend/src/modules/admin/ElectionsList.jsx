/**
 * Módulo 1 - Lista de Votações (Assembleias)
 * Exibe todas as assembleias/votações cadastradas
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { getAssemblies } from '../../services/adminApi'
import ElectionVotersModal from './ElectionVotersModal'

export default function ElectionsList() {
  const { condId } = useParams()
  const [assemblies, setAssemblies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAssembly, setSelectedAssembly] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadAssemblies = async () => {
    if (!condId) return
    
    setLoading(true)
    const result = await getAssemblies(condId)
    
    if (result.success) {
      setAssemblies(result.assemblies || [])
      setError('')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadAssemblies()
  }, [condId])

  const handleViewVoters = (assembly) => {
    setSelectedAssembly(assembly)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Carregando votações...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Votações Cadastradas</CardTitle>
          <CardDescription>
            Lista de todas as assembleias/votações registradas neste condomínio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {assemblies.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhuma votação cadastrada ainda.
              Use o formulário "Itens de Votação" para cadastrar uma assembleia.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assemblies.map((assembly) => (
                    <TableRow key={assembly.number}>
                      <TableCell className="font-medium">{assembly.number}</TableCell>
                      <TableCell>{assembly.name}</TableCell>
                      <TableCell>{assembly.date ? new Date(assembly.date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{assembly.items_count || 0}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          assembly.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {assembly.status === 'active' ? 'Ativa' : 'Finalizada'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewVoters(assembly)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          👥 Ver Votantes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <ElectionVotersModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        election={selectedAssembly}
        condominiumId={condId}
      />
    </>
  )
}