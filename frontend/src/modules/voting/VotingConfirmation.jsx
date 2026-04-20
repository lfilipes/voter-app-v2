/**
 * Passo 4: Confirmação e Encerramento
 * 
 * Exibe mensagem de agradecimento e limpa a sessão do votante
 * NÃO afeta o Firebase Auth (admin continua logado)
 */

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

export default function VotingConfirmation({ voter, assembly, onFinish }) {
  
  useEffect(() => {
    // ============================================
    // REMOVE APENAS OS DADOS DO VOTANTE DO sessionStorage
    // NÃO mexe no Firebase Auth (admin continua logado)
    // ============================================
    sessionStorage.removeItem('userType')
    sessionStorage.removeItem('voterEmail')
    sessionStorage.removeItem('voterName')
    sessionStorage.removeItem('voterCpf')
    sessionStorage.removeItem('voterApartment')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              🎉 Voto Registrado! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-700">
                Seu voto foi registrado com sucesso na assembleia:
              </p>
              <p className="font-bold text-green-800 mt-1">
                {assembly.name} ({assembly.number})
              </p>
            </div>
            
            <div className="text-gray-600 text-sm space-y-1">
              <p><strong>Votante:</strong> {voter.name}</p>
              <p><strong>Email:</strong> {voter.email}</p>
              <p><strong>Data/Hora:</strong> {new Date().toLocaleString()}</p>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <p className="text-gray-500 text-sm">
                Obrigado por participar da votação!
                Sua opinião é muito importante.
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Você será redirecionado para a tela inicial.
              </p>
            </div>
            
            <Button onClick={onFinish} className="w-full mt-4">
              Voltar para a Tela Inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}