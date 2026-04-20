/**
 * Modal para exibir a lista de votantes de uma votação
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { getResidents } from '../../services/adminApi'

export default function ElectionVotersModal({ isOpen, onClose, election, condominiumId }) {
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && condominiumId) {
      loadResidents()
    }
  }, [isOpen, condominiumId])

  const loadResidents = async () => {
    setLoading(true)
    setError('')
    
    const result = await getResidents(condominiumId)
    
    if (result.success) {
      setResidents(result.residents)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  if (!election) {
    return null
  }

  const electionName = election.name || 'Votação'
  const electionNumber = election.number || '-'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Votantes - {electionName}</DialogTitle>
          <DialogDescription>
            Número da votação: {electionNumber} | Total de votantes: {residents.length}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              Carregando votantes...
            </div>
          )}
          
          {error && (
            <div className="text-center py-8 text-red-500">
              Erro: {error}
            </div>
          )}
          
          {!loading && !error && residents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum votante cadastrado para este condomínio.
            </div>
          )}
          
          {!loading && !error && residents.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apartamento</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residents.map((resident) => (
                    <TableRow key={resident.email}>
                      <TableCell className="font-medium">{resident.apartment}</TableCell>
                      <TableCell>{resident.name}</TableCell>
                      <TableCell>{resident.email}</TableCell>
                      <TableCell className="font-mono">{resident.cpf}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          resident.can_vote 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {resident.can_vote ? 'Pode votar' : 'Deu procuração'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}