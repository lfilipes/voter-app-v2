/**
 * Módulo de Relatórios - Dashboard de Resultados
 * Exibe gráficos e tabelas detalhadas das votações
 * Com atualização automática a cada 10 segundos
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { getAssemblies, getAssemblyInfo, getElectionResults, getDetailedVotes } from '../../services/adminApi'
import ElectionResultsChart from './ElectionResultsChart'
import ElectionResultsTable from './ElectionResultsTable'
import ResultsCards from './ResultsCards'

export default function ReportsDashboard() {
  const { condId } = useParams()
  
  // Estados para lista de assembleias
  const [assemblies, setAssemblies] = useState([])
  const [selectedAssembly, setSelectedAssembly] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Estados para resultados
  const [assemblyInfo, setAssemblyInfo] = useState(null)
  const [results, setResults] = useState(null)
  const [detailedVotes, setDetailedVotes] = useState(null)
  const [loadingResults, setLoadingResults] = useState(false)
  
  // Estado para aba ativa (gráficos ou tabela)
  const [activeReportTab, setActiveReportTab] = useState('charts')

  // ============================================
  // CARREGA LISTA DE ASSEMBLEIAS
  // ============================================
  useEffect(() => {
    if (condId) {
      loadAssemblies()
    }
  }, [condId])

  const loadAssemblies = async () => {
    setLoading(true)
    const result = await getAssemblies(condId)
    console.log('Assemblies carregadas:', result)
    if (result.success) {
      setAssemblies(result.assemblies || [])
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  // ============================================
  // SELECIONA ASSEMBLEIA E CARREGA RESULTADOS
  // ============================================
  const handleSelectAssembly = async (assemblyNumber) => {
    console.log('Selecionando assembleia:', assemblyNumber)
    setSelectedAssembly(assemblyNumber)
    setLoadingResults(true)
    setError('')
    setAssemblyInfo(null)
    setResults(null)
    setDetailedVotes(null)
    
    try {
      // 1. Busca informações da assembleia
      const infoResult = await getAssemblyInfo(condId, assemblyNumber)
      console.log('Info da assembleia:', infoResult)
      
      if (infoResult.success) {
        setAssemblyInfo({
          name: infoResult.name,
          number: infoResult.number,
          date: infoResult.date,
          status: infoResult.status,
          informative_text: infoResult.informative_text
        })
      } else {
        console.error('Erro ao buscar info:', infoResult.error)
      }
      
      // 2. Busca resultados agregados (para gráficos)
      const resultsResult = await getElectionResults(condId, assemblyNumber)
      console.log('Resultados agregados:', resultsResult)
      if (resultsResult.success) {
        setResults(resultsResult)
      } else {
        setError(resultsResult.error || 'Erro ao carregar resultados')
      }
      
      // 3. Busca votos detalhados (para tabela)
      const detailedResult = await getDetailedVotes(condId, assemblyNumber)
      console.log('Votos detalhados:', detailedResult)
      if (detailedResult.success) {
        setDetailedVotes(detailedResult.votes_by_item)
      }
      
    } catch (err) {
      console.error('Erro no handler:', err)
      setError('Erro ao carregar resultados')
    } finally {
      setLoadingResults(false)
    }
  }

  // ============================================
  // ATUALIZAÇÃO AUTOMÁTICA DOS RESULTADOS (POLLING)
  // ============================================
  useEffect(() => {
    // Só executa se houver uma assembleia selecionada
    if (!selectedAssembly) return
    
    // Função para recarregar os resultados
    const refreshResults = async () => {
      console.log('🔄 Atualizando resultados automaticamente...')
      
      try {
        // 1. Recarrega resultados agregados (para gráficos)
        const resultsResult = await getElectionResults(condId, selectedAssembly)
        if (resultsResult.success) {
          setResults(resultsResult)
          console.log('✅ Resultados agregados atualizados')
        }
        
        // 2. Recarrega votos detalhados (para tabela)
        const detailedResult = await getDetailedVotes(condId, selectedAssembly)
        if (detailedResult.success) {
          setDetailedVotes(detailedResult.votes_by_item)
          console.log('✅ Votos detalhados atualizados')
        }
      } catch (err) {
        console.error('❌ Erro na atualização automática:', err)
      }
    }
    
    // Recarrega imediatamente após seleção
    refreshResults()
    
    // Configura polling a cada 10 segundos
    const interval = setInterval(refreshResults, 10000)
    
    // Limpa o intervalo quando a assembleia mudar ou o componente desmontar
    return () => {
      console.log('🛑 Parando atualização automática')
      clearInterval(interval)
    }
  }, [selectedAssembly, condId])

  // ============================================
  // FORMATA DATA
  // ============================================
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Data não informada'
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  // ============================================
  // RENDERIZA TELA DE CARREGAMENTO
  // ============================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando votações...</span>
      </div>
    )
  }

  // ============================================
  // RENDERIZA PRINCIPAL
  // ============================================
  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">📊 Relatórios de Votação</h2>
        <p className="text-gray-500 mt-1">Visualize os resultados detalhados das assembleias</p>
        <p className="text-xs text-gray-400 mt-1">
          🔄 Os resultados são atualizados automaticamente a cada 10 segundos
        </p>
      </div>

      {/* Seletor de Assembleia */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione uma Votação</CardTitle>
          <CardDescription>
            Escolha a assembleia que deseja visualizar os resultados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assemblies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma votação cadastrada neste condomínio.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {assemblies.map((assembly) => (
                <Button
                  key={assembly.number}
                  variant={selectedAssembly === assembly.number ? 'default' : 'outline'}
                  onClick={() => handleSelectAssembly(assembly.number)}
                  className="justify-start h-auto py-3"
                >
                  <div className="text-left">
                    <div className="font-medium">{assembly.name}</div>
                    <div className="text-xs opacity-70">{assembly.number}</div>
                    <div className="text-xs opacity-70 mt-1">
                      📅 {formatDate(assembly.date)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading dos resultados */}
      {loadingResults && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Carregando resultados...</span>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && !loadingResults && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultados carregados */}
      {results && !loadingResults && assemblyInfo && (
        <>
          {/* Abas para Gráficos / Tabela */}
          <div className="flex gap-2 border-b mb-4">
            <button
              className={`px-4 py-2 font-medium transition-colors ${
                activeReportTab === 'charts'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveReportTab('charts')}
            >
              📊 Gráficos
            </button>
            <button
              className={`px-4 py-2 font-medium transition-colors ${
                activeReportTab === 'table'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveReportTab('table')}
            >
              📋 Tabela Detalhada
            </button>
          </div>

          {/* ABA DE GRÁFICOS */}
          {activeReportTab === 'charts' && (
            <>
              {/* Cards de Estatísticas */}
              <ResultsCards 
                assemblyInfo={assemblyInfo}
                totalEligible={results.total_eligible_voters}
                totalVotesCast={results.total_votes_cast}
              />

              {/* Resultados por Item - Gráficos */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-700">Resultados por Item</h3>
                {results.items_results && results.items_results.length > 0 ? (
                  results.items_results.map((item, idx) => (
                    <ElectionResultsChart key={item.item_id} item={item} itemNumber={idx + 1} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum resultado encontrado para esta votação.
                  </div>
                )}
              </div>
            </>
          )}

          {/* ABA DE TABELA DETALHADA */}
          {activeReportTab === 'table' && detailedVotes && (
            <ElectionResultsTable votesByItem={detailedVotes} />
          )}
          
          {activeReportTab === 'table' && !detailedVotes && !loadingResults && (
            <div className="text-center py-8 text-gray-500">
              Carregando dados detalhados...
            </div>
          )}
        </>
      )}
      
      {/* Aguardando informações da assembleia */}
      {results && !loadingResults && !assemblyInfo && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Carregando informações da assembleia...</span>
        </div>
      )}
    </div>
  )
}