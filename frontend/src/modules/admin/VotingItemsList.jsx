/**
 * Módulo 2 - Lista de Itens de Votação
 * Exibe todas as votações que têm itens cadastrados
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { getAllVotingElections, getVotingItemsByElection, deleteVotingItems } from '../../services/votingApi'

export default function VotingItemsList() {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedElection, setSelectedElection] = useState(null)
  const [itemsDetail, setItemsDetail] = useState(null)

  const loadElections = async () => {
    setLoading(true)
    const result = await getAllVotingElections()
    
    if (result.success) {
      setElections(result.elections)
      setError('')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadElections()
  }, [])

  const handleViewDetails = async (election) => {
    const result = await getVotingItemsByElection(election.election_number)
    if (result.success) {
      setSelectedElection(election)
      setItemsDetail(result.data)
    } else {
      setError(result.error)
    }
  }

  const handleDelete = async (electionNumber) => {
    if (window.confirm(`Tem certeza que deseja deletar todos os itens da votação ${electionNumber}?`)) {
      const result = await deleteVotingItems(electionNumber)
      if (result.success) {
        loadElections()
        setSelectedElection(null)
        setItemsDetail(null)
      } else {
        setError(result.error)
      }
    }
  }

  const closeDetails = () => {
    setSelectedElection(null)
    setItemsDetail(null)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Carregando itens de votação...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Itens de Votação Cadastrados</CardTitle>
        <CardDescription>
          Lista de todas as votações que já têm seus itens cadastrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {elections.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nenhum item de votação cadastrado ainda.
            Use o formulário "Itens de Votação" para cadastrar os itens de uma assembleia.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Total Itens</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {elections.map((election) => (
                    <TableRow key={election.election_number}>
                      <TableCell className="font-medium">{election.election_number}</TableCell>
                      <TableCell>{election.election_name}</TableCell>
                      <TableCell>{election.total_items}</TableCell>
                      <TableCell>{election.created_at ? new Date(election.created_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(election)}
                        >
                          📋 Ver Itens
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(election.election_number)}
                        >
                          🗑️ Deletar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Modal de detalhes dos itens */}
            {selectedElection && itemsDetail && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{selectedElection.election_name}</h2>
                    <Button variant="ghost" onClick={closeDetails} className="text-gray-500">
                      ✕ Fechar
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-700">Número da Votação:</h3>
                      <p>{itemsDetail.election_number}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-700">Informativo:</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{itemsDetail.informative_text}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Itens para Votação:</h3>
                      <div className="space-y-2">
                        {itemsDetail.items.map((item) => (
                          <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                            <span className="font-medium">Item {item.item_number}:</span>
                            <span className="ml-2 text-gray-700">{item.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}