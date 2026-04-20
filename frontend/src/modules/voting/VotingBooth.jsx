/**
 * Passo 3: Urna Eletrônica
 * 
 * Exibe os itens da votação e permite votar individualmente
 * Suporta:
 * - Aprovar/Reprovar (approve_reject)
 * - Múltipla escolha (multiple_choice) - para eleições com chapas/candidatos
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { registerVote } from './votingService'
import { db } from '../../services/firebase'
import { collection, query, onSnapshot, doc } from 'firebase/firestore'

export default function VotingBooth({ voter, assembly, votingWeight, condominiumId, onVotingComplete, onBack }) {
  const [items, setItems] = useState([])
  const [votes, setVotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [allVoted, setAllVoted] = useState(false)
  const [hasVotedBefore, setHasVotedBefore] = useState(false)

  // ============================================
  // LISTENER EM TEMPO REAL PARA OS ITENS
  // ============================================
  useEffect(() => {
    const itemsRef = collection(db, `condominiums/${condominiumId}/assemblies/${assembly.number}/items`)
    const itemsQuery = query(itemsRef)
    
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const itemsData = []
      const initialVotes = {}
      
      snapshot.forEach(doc => {
        const data = doc.data()
        const item = {
          id: doc.id,
          order: data.order,
          description: data.description,
          type: data.type || 'approve_reject',
          is_released: data.is_released || false,
          is_locked: data.is_locked || false
        }
        
        // Adiciona opções para múltipla escolha
        if (data.type === 'multiple_choice') {
          item.options = data.options || []
          item.max_options = data.max_options || 1
        }
        
        itemsData.push(item)
        initialVotes[doc.id] = null
      })
      
      itemsData.sort((a, b) => a.order - b.order)
      setItems(itemsData)
      setVotes(prev => ({ ...prev, ...initialVotes }))
      setLoading(false)
    }, (error) => {
      console.error('Erro no listener de itens:', error)
      setError('Erro ao carregar itens da votação')
      setLoading(false)
    })

    // ============================================
    // VERIFICA SE O VOTANTE JÁ VOTOU
    // ============================================
    const voteRef = doc(db, `condominiums/${condominiumId}/assemblies/${assembly.number}/votes`, voter.email)
    const unsubscribeVote = onSnapshot(voteRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const voteData = docSnapshot.data()
        const savedVotes = voteData.votes || {}
        
        if (Object.keys(savedVotes).length > 0) {
          setVotes(savedVotes)
          setHasVotedBefore(true)
          
          const allVotedFlag = Object.values(savedVotes).every(v => v !== null && v !== undefined)
          if (allVotedFlag) {
            setAllVoted(true)
          }
        }
      }
    })

    return () => {
      unsubscribeItems()
      unsubscribeVote()
    }
  }, [condominiumId, assembly.number, voter.email])

  // Efeito para verificar se todos os itens foram votados
  useEffect(() => {
    if (items.length > 0) {
      const votedCount = Object.values(votes).filter(v => v !== null && v !== undefined).length
      setAllVoted(votedCount === items.length)
    }
  }, [votes, items])

  const handleVote = (itemId, choice) => {
    setVotes(prev => ({
      ...prev,
      [itemId]: choice
    }))
  }

  const handleSubmitAll = async () => {
    if (!allVoted) {
      setError('Você precisa votar em todos os itens antes de finalizar')
      return
    }
    
    if (hasVotedBefore) {
      setError('Você já votou nesta assembleia!')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      const result = await registerVote(
        condominiumId,
        assembly.number,
        voter,
        votes,
        votingWeight
      )
      
      if (result.success) {
        onVotingComplete(votes)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Erro ao registrar votos. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const getItemStatus = (item) => {
    const hasVoted = votes[item.id] !== null && votes[item.id] !== undefined
    
    if (hasVoted) {
      return 'voted'
    }
    
    if (item.is_released && !item.is_locked) {
      return 'active'
    }
    
    return 'locked'
  }

  // ============================================
  // RENDERIZAÇÃO CONDICIONAL POR TIPO DE ITEM
  // ============================================
  const renderItemVoting = (item, isVoted, isActive, currentVote) => {
    // Item já votado - mostrar resultado
    if (isVoted) {
      let voteDisplay = ''
      if (item.type === 'approve_reject') {
        voteDisplay = currentVote === 'approve' ? 'Aprovado' : 'Reprovado'
      } else if (item.type === 'multiple_choice') {
        const selectedOption = item.options?.find(opt => opt.id === currentVote)
        voteDisplay = selectedOption ? `Votou em: ${selectedOption.label}` : 'Voto registrado'
      }
      return (
        <div className="text-sm text-green-600">
          ✓ {voteDisplay}
        </div>
      )
    }
    
    // Item não liberado
    if (!isActive) {
      return (
        <div className="text-sm text-gray-400 italic flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
          ⏳ Aguardando liberação do administrador
        </div>
      )
    }
    
    // Item ativo - renderiza baseado no tipo
    if (item.type === 'approve_reject') {
      return (
        <div className="flex gap-3">
          <Button
            onClick={() => handleVote(item.id, 'approve')}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={submitting || hasVotedBefore}
          >
            ✅ Aprovar
          </Button>
          <Button
            onClick={() => handleVote(item.id, 'reject')}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            disabled={submitting || hasVotedBefore}
          >
            ❌ Reprovar
          </Button>
        </div>
      )
    }
    
    if (item.type === 'multiple_choice') {
      return (
        <div className="space-y-2">
          {item.options?.map((option) => (
            <Button
              key={option.id}
              onClick={() => handleVote(item.id, option.id)}
              variant={currentVote === option.id ? 'default' : 'outline'}
              className={`w-full justify-start ${
                currentVote === option.id 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'border-gray-300 hover:bg-blue-50'
              }`}
              disabled={submitting || hasVotedBefore}
            >
              <div className="text-left flex-1">
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-xs opacity-80 mt-0.5">{option.description}</div>
                )}
              </div>
              {currentVote === option.id && (
                <span className="ml-3">✓</span>
              )}
            </Button>
          ))}
        </div>
      )
    }
    
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando itens da votação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Voltar para login
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>🗳️ Urna Eletrônica</CardTitle>
            <CardDescription>
              {assembly.name} - {assembly.number}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações do Votante */}
            <div className="bg-gray-100 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-gray-700">Dados do Votante</h3>
              <p className="text-sm"><strong>Email:</strong> {voter.email}</p>
              <p className="text-sm"><strong>CPF:</strong> {voter.cpf}</p>
              <p className="text-sm">
                <strong>Peso do Voto:</strong> 
                <span className="ml-2 font-bold text-blue-600">{votingWeight}</span>
                {votingWeight > 1 && (
                  <span className="ml-2 text-xs text-gray-500">
                    (inclui {votingWeight - 1} procuração(ões) em seu nome)
                  </span>
                )}
              </p>
              {hasVotedBefore && (
                <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800 text-sm">
                  ⚠️ Você já votou nesta assembleia. Seus votos estão registrados abaixo.
                </div>
              )}
            </div>

            {/* Informativo da Assembleia */}
            {assembly.informative_text && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">📢 Informativo</h3>
                <p className="text-sm text-blue-700">{assembly.informative_text}</p>
              </div>
            )}

            {/* Itens para Votação */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Itens para Votação</h3>
                <p className="text-xs text-gray-400">
                  {items.filter(i => i.is_released && !i.is_locked).length} de {items.length} itens liberados
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {items.map((item) => {
                const status = getItemStatus(item)
                const isVoted = status === 'voted'
                const isActive = status === 'active'
                const currentVote = votes[item.id]
                
                return (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg p-4 transition-all ${
                      isVoted ? 'opacity-60 bg-gray-50' : ''
                    } ${!isActive && !isVoted ? 'bg-gray-50' : ''}`}
                  >
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-800">
                        {item.description}
                      </h4>
                      {item.type === 'multiple_choice' && (
                        <p className="text-xs text-purple-600 mt-1">
                          🗳️ Eleição - escolha uma opção
                        </p>
                      )}
                    </div>
                    
                    {renderItemVoting(item, isVoted, isActive, currentVote)}
                  </div>
                )
              })}
            </div>
            
            <Button 
              onClick={handleSubmitAll} 
              className="w-full"
              disabled={!allVoted || submitting || hasVotedBefore}
            >
              {submitting ? 'Registrando votos...' : hasVotedBefore ? 'Votação já finalizada' : 'Finalizar Votação'}
            </Button>
            
            {!allVoted && items.length > 0 && !hasVotedBefore && (
              <p className="text-xs text-center text-gray-500">
                Você precisa votar em todos os {items.length} itens para finalizar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}