/**
 * Cards de estatísticas do relatório
 * Versão com fundo branco e bordas/acentos em azul
 */

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export default function ResultsCards({ assemblyInfo, totalEligible, totalVotesCast }) {
  
  const turnout = totalEligible > 0 ? (totalVotesCast / totalEligible * 100).toFixed(1) : 0
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Informações da Assembleia */}
      <Card className="border-t-4 border-t-blue-700 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-800">📋 Assembleia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">
            {assemblyInfo?.name || 'Carregando...'}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {assemblyInfo?.number || '-'}
          </div>
          <div className="text-xs text-blue-500 mt-2">
            📅 {assemblyInfo?.date ? new Date(assemblyInfo.date).toLocaleDateString('pt-BR') : 'Data não informada'}
          </div>
          {assemblyInfo?.status && (
            <div className="text-xs text-blue-500 mt-1">
              Status: {assemblyInfo.status === 'active' ? '✅ Ativa' : '🔒 Finalizada'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Total de Votantes */}
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-800">👥 Votantes Elegíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900">{totalEligible || 0}</div>
          <div className="text-sm text-blue-600 mt-1">moradores aptos a votar</div>
          <div className="text-xs text-blue-500 mt-2">
            🏢 Total de unidades elegíveis
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Participação */}
      <Card className="border-t-4 border-t-blue-500 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-800">🗳️ Total de Votos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900">{totalVotesCast || 0}</div>
          <div className="text-sm text-blue-600 mt-1">
            Incluindo proucurações
          </div>
          <div className="text-xl font-bold text-blue-700 mt-2">
            {turnout}%
          </div>
          <div className="text-xs text-blue-500">
            de participação total
          </div>
        </CardContent>
      </Card>
    </div>
  )
}