/**
 * Passo 2: Login do Votante
 * 
 * NÃO USA FIREBASE AUTH
 * Autenticação própria via backend (email + CPF)
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { authenticateVoter, getActiveAssemblyForVoter, getVotingWeight } from './votingService'

export default function VoterLogin({ condominiumId, condominiumName, onLoginSuccess, onBack }) {
  const [email, setEmail] = useState('')
  const [cpfPassword, setCpfPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCpfPasswordChange = (value) => {
    const digits = value.replace(/\D/g, '')
    setCpfPassword(digits.slice(0, 6))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Digite seu email')
      return
    }
    
    if (cpfPassword.length === 0) {
      setError('Digite os 6 primeiros dígitos do seu CPF como senha')
      return
    }
    
    if (cpfPassword.length < 6) {
      setError('A senha deve ter 6 dígitos (os 6 primeiros do seu CPF)')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // 1. Autentica o votante (backend, sem Firebase Auth)
      const authResult = await authenticateVoter(condominiumId, email, cpfPassword)
      
      if (!authResult.success) {
        setError(authResult.error)
        setLoading(false)
        return
      }
      
      // 2. Armazena dados do votante em sessionStorage (não no Firebase Auth)
      sessionStorage.setItem('userType', 'voter')
      sessionStorage.setItem('voterEmail', email)
      sessionStorage.setItem('voterName', authResult.voter.name)
      sessionStorage.setItem('voterCpf', authResult.voter.cpf)
      sessionStorage.setItem('voterApartment', authResult.voter.apartment)
      
      // 3. Busca a assembleia ativa
      const assemblyResult = await getActiveAssemblyForVoter(condominiumId, email)
      
      if (!assemblyResult.success) {
        setError(assemblyResult.error)
        setLoading(false)
        return
      }
      
      // 4. Calcula o peso do voto
      const weightResult = await getVotingWeight(condominiumId, email)
      
      // Verificar o status da assembleia
      console.log('Assembly status:', assemblyResult.assembly.status)
      console.log('Has voted:', assemblyResult.assembly.has_voted)

      // 5. Login bem-sucedido (sem Firebase Auth)
      onLoginSuccess(
        authResult.voter,
        assemblyResult.assembly,
        weightResult.weight
      )
      
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Voltar para condomínios
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Login do Votante</CardTitle>
            <CardDescription>
              Condomínio: <strong>{condominiumName}</strong>
            </CardDescription>
          </CardHeader>
          <CardHeader className="pt-0">
            <CardDescription className="text-sm text-gray-500">
              Digite seu email e os <strong>6 primeiros dígitos</strong> do seu CPF como senha.
            </CardDescription>
            <CardDescription className="text-xs text-gray-400 mt-1">
              Exemplo: CPF 123.456.789-00 → senha: 123456
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@exemplo.com"
                  autoComplete="off"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cpf_password">
                  Senha (6 primeiros dígitos do CPF)
                </Label>
                <Input
                  id="cpf_password"
                  type="password"
                  value={cpfPassword}
                  onChange={(e) => handleCpfPasswordChange(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono"
                  autoComplete="off"
                  required
                />
                <p className="text-xs text-gray-500">
                  Use apenas os <strong>6 primeiros números</strong> do seu CPF, sem pontos ou traços.
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verificando...' : 'Entrar e Votar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}