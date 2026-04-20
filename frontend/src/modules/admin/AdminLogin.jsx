/**
 * Módulo 1 - Admin Login
 * Tela de login específica para administradores
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../services/firebase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  useEffect(() => {
    setEmail('')
    setPassword('')
    
    if (emailInputRef.current) {
      emailInputRef.current.value = ''
    }
    if (passwordInputRef.current) {
      passwordInputRef.current.value = ''
    }
    
    const form = document.getElementById('admin-login-form')
    if (form) {
      form.setAttribute('autocomplete', 'off')
      form.setAttribute('novalidate', 'true')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.target.setAttribute('autocomplete', 'off')
    
    setLoading(true)
    setError('')
    
    try {
      await signInWithEmailAndPassword(auth, email, password)
      
      // ============================================
      // ARMAZENA O TIPO DE USUÁRIO NO sessionStorage
      // ============================================
      sessionStorage.setItem('userType', 'admin')
      sessionStorage.setItem('userEmail', email)
      
      navigate('/admin/condominios')
    } catch (err) {
      console.error('Erro no login:', err)
      if (err.code === 'auth/user-not-found') {
        setError('Usuário não encontrado')
      } else if (err.code === 'auth/wrong-password') {
        setError('Senha incorreta')
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido')
      } else {
        setError('Erro ao fazer login. Verifique suas credenciais.')
      }
      
      setPassword('')
      if (passwordInputRef.current) {
        passwordInputRef.current.value = ''
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordFocus = () => {
    if (passwordInputRef.current) {
      passwordInputRef.current.value = ''
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Área Administrativa</CardTitle>
          <CardDescription>
            Faça login com sua conta de administrador para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            id="admin-login-form"
            onSubmit={handleSubmit} 
            className="space-y-4"
            autoComplete="off"
            noValidate
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailInputRef}
                id="email"
                type="email"
                name="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemplo.com"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                ref={passwordInputRef}
                id="password"
                type="password"
                name="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handlePasswordFocus}
                placeholder="••••••••"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              onClick={() => {
                setTimeout(() => {
                  if (passwordInputRef.current) {
                    passwordInputRef.current.value = ''
                  }
                }, 100)
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Este é um sistema seguro. Nunca compartilhe suas credenciais.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}