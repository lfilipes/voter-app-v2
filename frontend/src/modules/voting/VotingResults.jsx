/**
 * Visualização de Resultados para o Votante
 * Versão simplificada do ReportsDashboard
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { getElectionResults } from '../../services/adminApi'
import ElectionResultsChart from '../admin/ElectionResultsChart'

export default function VotingResults({ assembly, condominiumId, onBack }) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    setLoading(true)
    const result = await getElectionResults(condominiumId, assembly.number)
    if (result.success) {
      setResults(result)
    } else {
      setError(result.error || 'Erro ao carregar resultados')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando resultados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>📊 Resultados da Votação</CardTitle>
            <div className="text-sm text-gray-500 mt-2">
              <p><strong>Assembleia:</strong> {assembly.name}</p>
              <p><strong>Número:</strong> {assembly.number}</p>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {results && (
              <>
                {/* Cards de estatísticas simplificados */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-800">{results.total_eligible_voters}</div>
                    <div className="text-xs text-blue-600">Votantes Elegíveis</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-800">{results.total_votes_cast}</div>
                    <div className="text-xs text-green-600">Votos Registrados</div>
                  </div>
                </div>
                
                {/* Resultados por item */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Resultados por Item</h3>
                  {results.items_results?.map((item, idx) => (
                    <ElectionResultsChart key={item.item_id} item={item} itemNumber={idx + 1} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}