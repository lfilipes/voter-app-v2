/**
 * Passo 1: Seleção do Condomínio
 * 
 * Exibe a lista de condomínios cadastrados para o votante escolher
 * 
 * Este componente é totalmente independente dos módulos admin
 * Não requer autenticação (público)
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'

const API_URL = process.env.REACT_APP_FLASK_API_URL || 'https://api-dot-voter-app-v2.rj.r.appspot.com/api'
console.log(process.env.REACT_APP_FLASK_API_URL)

export default function CondSel({ onSelect }) {
  const [condominiums, setCondominiums] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCondominiums()
  }, [])

  const loadCondominiums = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_URL}/public/condominiums`)
      const data = await response.json()
      
      if (data.success) {
        setCondominiums(data.condominiums || [])
      } else {
        setError(data.error || 'Não foi possível carregar os condomínios')
      }
    } catch (err) {
      console.error('Erro ao carregar condomínios:', err)
      setError('Erro de conexão com o servidor. Verifique sua rede.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Carregando condomínios...</p>
          <p className="text-xs text-gray-400 mt-1">Aguarde um momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Cabeçalho com logo/título */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🗳️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sistema de Votação Eletrônica
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Sistema seguro para votação em assembleias condominiais
          </p>
        </div>

        {/* Card principal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Escolha seu Condomínio</CardTitle>
            <CardDescription>
              Escolha o condomínio correspondente ao seu endereço para iniciar a votação
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            {/* Mensagem de erro */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {error}
                  <button 
                    onClick={loadCondominiums}
                    className="ml-3 text-sm underline hover:no-underline"
                  >
                    Tentar novamente
                  </button>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Lista de condomínios */}
            {condominiums.length === 0 && !error ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-2">
                  Nenhum condomínio cadastrado no sistema.
                </p>
                <p className="text-sm text-gray-400">
                  Por favor, entre em contato com o administrador.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {condominiums.map((cond) => (
                  <div
                    key={cond.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={() => onSelect(cond.id, cond.name)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🏢</span>
                          <h3 className="font-semibold text-lg text-gray-800">
                            {cond.name}
                          </h3>
                        </div>
                        {cond.address && (
                          <p className="text-sm text-gray-500 mt-1 ml-7">
                            📍 {cond.address}
                          </p>
                        )}
                        {cond.email_admin && (
                          <p className="text-xs text-gray-400 mt-1 ml-7">
                            Administração: {cond.email_admin}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="ml-3">
                        Selecionar →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Rodapé informativo */}
            <div className="mt-6 pt-4 border-t text-center">
              <p className="text-xs text-gray-400">
                Sistema de votação eletrônica - Voto seguro e auditável
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Em caso de dúvidas, contate o síndico do seu condomínio
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}