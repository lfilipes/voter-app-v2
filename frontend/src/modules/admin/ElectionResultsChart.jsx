/**
 * Gráfico de resultados para um item de votação
 * Suporta dois tipos: approve_reject e multiple_choice
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
export default function ElectionResultsChart({ item, itemNumber }) {
  
  // Renderiza gráfico para tipo Aprovar/Reprovar
  const renderApproveRejectChart = () => {
    const { approve, approve_percentage, reject, reject_percentage, total_votes } = item
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-medium">✅ Aprovar</span>
            <span className="font-mono">{approve} votos ({approve_percentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${approve_percentage}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-red-600 font-medium">❌ Reprovar</span>
            <span className="font-mono">{reject} votos ({reject_percentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-red-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${reject_percentage}%` }}
            />
          </div>
        </div>
        
        {item.abstain > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">⚪ Abstenção</span>
              <span className="font-mono">{item.abstain} votos ({item.abstain_percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gray-400 h-4 rounded-full transition-all duration-500"
                style={{ width: `${item.abstain_percentage}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="pt-2 text-sm text-gray-500 border-t">
          Total de votos neste item: {total_votes}
        </div>
      </div>
    )
  }
  
  // Renderiza gráfico para tipo Múltipla Escolha
  const renderMultipleChoiceChart = () => {
    const { options, total_votes } = item
    
    // Cores para as opções
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ]
    
    // Encontra o vencedor (maior número de votos)
    const winner = options.length > 0 ? options.reduce((max, opt) => 
      opt.count > max.count ? opt : max, options[0]) : null
    
    return (
      <div className="space-y-4">
        {options.map((option, idx) => (
          <div key={option.id} className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`}></span>
                <span className="font-medium">{option.label}</span>
                {winner && winner.id === option.id && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                    🏆 Vencedor
                  </span>
                )}
              </div>
              <span className="font-mono">{option.count} votos ({option.percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className={`${colors[idx % colors.length]} h-4 rounded-full transition-all duration-500`}
                style={{ width: `${option.percentage}%` }}
              />
            </div>
            {option.description && (
              <div className="text-xs text-gray-500 ml-4">{option.description}</div>
            )}
          </div>
        ))}
        
        <div className="pt-2 text-sm text-gray-500 border-t">
          Total de votos neste item: {total_votes}
        </div>
      </div>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {itemNumber}. {item.title || item.description}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {item.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {item.type === 'approve_reject' 
          ? renderApproveRejectChart() 
          : renderMultipleChoiceChart()
        }
      </CardContent>
    </Card>
  )
}