/**
 * Tela de opções para o votante após o login
 * Exibe duas opções sempre visíveis:
 * 1 - Votar (habilitado apenas se assembleia estiver ATIVA e votante não votou)
 * 2 - Ver Resultados (habilitado apenas se assembleia estiver ENCERRADA)
 * 
 * Quando desabilitadas, mostra explicação do motivo
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

export default function VoterAssemblyOptions({ 
  voter, 
  assembly, 
  votingWeight, 
  condominiumId, 
  onVote, 
  onViewResults, 
  onBack 
}) {
  
  // Logs para debug
  console.log('=== VoterAssemblyOptions ===')
  console.log('Assembly recebido:', assembly)
  console.log('Status da assembleia:', assembly?.status)
  console.log('Votante já votou?', assembly?.has_voted)
  
  // Verifica se os dados da assembleia existem
  if (!assembly) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-red-500">Erro: Dados da assembleia não carregados.</p>
            <Button onClick={onBack} className="mt-4">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Determina quais opções estão disponíveis
  const isActive = assembly.status === 'active'
  const isClosed = assembly.status === 'closed'
  const hasVoted = assembly.has_voted === true
  
  // Botões: habilitados apenas nas condições corretas
  const voteEnabled = isActive && !hasVoted
  const resultsEnabled = isClosed
  
  // Mensagens explicativas para botões desabilitados
  const getVoteDisabledReason = () => {
    if (hasVoted) return '❌ Você já votou nesta assembleia'
    if (!isActive && !isClosed) return '⏳ Assembleia ainda não foi iniciada'
    if (!isActive) return '🔒 Votação encerrada - apenas visualização de resultados disponível'
    return ''
  }
  
  const getResultsDisabledReason = () => {
    if (!isClosed && isActive) return '📊 Resultados serão publicados após o encerramento da votação'
    if (!isClosed && !isActive) return '⏳ Aguarde o início e encerramento da votação para ver os resultados'
    return ''
  }
  
  // Formata a data
  const formatDate = (dateStr) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }
  
  const assemblyDate = formatDate(assembly.date)
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        
        {/* Botão voltar */}
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Voltar para login
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="text-5xl mb-3">🗳️</div>
            <CardTitle className="text-2xl">Sistema de Votação</CardTitle>
            <CardDescription>
              Olá, <strong>{voter?.name || 'Votante'}</strong>!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            
            {/* Informações da Assembleia */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <span>📋</span> Assembleia
              </h3>
              <div className="space-y-1 text-sm">
                <p><strong>Nome:</strong> {assembly.name}</p>
                <p><strong>Número:</strong> {assembly.number}</p>
                {assemblyDate && <p><strong>Data:</strong> {assemblyDate}</p>}
                <p>
                  <strong>Status:</strong> 
                  {isActive && <span className="ml-2 text-green-600 font-medium">🟢 VOTAÇÃO ABERTA</span>}
                  {isClosed && <span className="ml-2 text-gray-600 font-medium">🔴 VOTAÇÃO ENCERRADA</span>}
                  {!isActive && !isClosed && <span className="ml-2 text-yellow-600">🟡 AGUARDANDO INÍCIO</span>}
                </p>
                {hasVoted && (
                  <p className="text-yellow-600 text-sm mt-2">
                    ✅ Você já votou nesta assembleia
                  </p>
                )}
                <p className="pt-2">
                  <strong>Peso do Voto:</strong> 
                  <span className="ml-2 font-bold text-blue-600">{votingWeight}</span>
                  {votingWeight > 1 && (
                    <span className="ml-2 text-xs text-gray-500">
                      (você representa {votingWeight} votos, incluindo {votingWeight - 1} procuração(ões))
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Informativo da Assembleia */}
            {assembly.informative_text && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <span>📢</span> Informativo
                </h3>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">{assembly.informative_text}</p>
              </div>
            )}

            {/* OPÇÕES - Título */}
            <div className="text-center">
              <h3 className="font-semibold text-gray-700">O que você deseja fazer?</h3>
              <p className="text-xs text-gray-400 mt-1">
                Escolha uma das opções abaixo
              </p>
            </div>

            {/* Botão 1: Votar */}
            <div className="space-y-1">
              <Button 
                onClick={onVote} 
                className={`w-full py-6 text-lg font-semibold transition-all ${
                  voteEnabled 
                    ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!voteEnabled}
                size="lg"
              >
                🗳️ VOTAR NESTA ASSEMBLEIA
              </Button>
              {!voteEnabled && (
                <p className="text-xs text-center text-gray-400">
                  {getVoteDisabledReason()}
                </p>
              )}
              {voteEnabled && (
                <p className="text-xs text-center text-green-600">
                  ✅ Você pode votar agora! A votação está aberta.
                </p>
              )}
            </div>

            {/* Botão 2: Ver Resultados */}
            <div className="space-y-1">
              <Button 
                onClick={onViewResults} 
                variant="outline"
                className={`w-full py-6 text-lg font-semibold transition-all ${
                  resultsEnabled 
                    ? 'border-blue-500 text-blue-600 hover:bg-blue-50 cursor-pointer' 
                    : 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                }`}
                disabled={!resultsEnabled}
                size="lg"
              >
                📊 VER RESULTADOS DA VOTAÇÃO
              </Button>
              {!resultsEnabled && (
                <p className="text-xs text-center text-gray-400">
                  {getResultsDisabledReason()}
                </p>
              )}
              {resultsEnabled && (
                <p className="text-xs text-center text-blue-600">
                  📈 Os resultados já estão disponíveis para consulta!
                </p>
              )}
            </div>
            
            {/* Explicação adicional sobre o comportamento */}
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-xs text-gray-500 text-center">
                ℹ️ <strong>Como funciona:</strong> Durante a votação, apenas o botão "VOTAR" está disponível.
                Após o encerramento da assembleia pelo administrador, os resultados são publicados
                e o botão "VER RESULTADOS" é liberado.
              </p>
            </div>
            
            {/* Rodapé */}
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-gray-400">
                Sistema de Votação Eletrônica - Voto seguro e auditável
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}