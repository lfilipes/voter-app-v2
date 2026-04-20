/**
 * Módulo 1 - Upload de Procuração
 * Formulário com upload de PDF e dados da procuração
 */

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { createProxy } from '../../services/adminApi'
import { uploadProxyFile } from '../../services/storageService'  // New service

export default function UploadProxy({ onSuccess }) {
  const { condId } = useParams()
  const [grantorCpf, setGrantorCpf] = useState('')
  const [granteeEmail, setGranteeEmail] = useState('')
  const [granteeName, setGranteeName] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const formatCpf = (value) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
    } else {
      setFile(null)
      setError('Por favor, selecione um arquivo PDF válido')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const cpfDigits = grantorCpf.replace(/\D/g, '')
    
    if (cpfDigits.length !== 11) {
      setError('CPF do outorgante deve ter 11 dígitos')
      return
    }
    
    if (!granteeEmail.trim()) {
      setError('Email do outorgado é obrigatório')
      return
    }
    
    if (!granteeName.trim()) {
      setError('Nome do outorgado é obrigatório')
      return
    }
    
    if (!file) {
      setError('Selecione o arquivo PDF da procuração')
      return
    }
    
    setUploading(true)
    setError('')
    setSuccess('')
    
    try {
      // 1. Upload PDF to Firebase Storage
      const pdfUrl = await uploadProxyFile(condId, file, grantorCpf)
      
      // 2. Create proxy record in Firestore
      const result = await createProxy(condId, {
        grantor_cpf: cpfDigits,
        grantee_email: granteeEmail,
        grantee_name: granteeName,
        pdf_url: pdfUrl
      })
      
      if (result.success) {
        setSuccess(`Procuração cadastrada com sucesso!`)
        setGrantorCpf('')
        setGranteeEmail('')
        setGranteeName('')
        setFile(null)
        document.getElementById('pdf-file').value = ''
        if (onSuccess) onSuccess()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Procuração</CardTitle>
        <CardDescription>
          Preencha os dados e faça upload do PDF da procuração.
          O outorgante (quem dá a procuração) não poderá votar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-50 border-green-500">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="grantor_cpf">CPF do Outorgante (quem dá a procuração) *</Label>
            <Input
              id="grantor_cpf"
              value={grantorCpf}
              onChange={(e) => setGrantorCpf(formatCpf(e.target.value))}
              placeholder="123.456.789-00"
              maxLength={14}
              required
            />
            <p className="text-sm text-gray-500">Esta pessoa não poderá votar</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="grantee_email">Email do Outorgado (quem recebe) *</Label>
            <Input
              id="grantee_email"
              type="email"
              value={granteeEmail}
              onChange={(e) => setGranteeEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="grantee_name">Nome do Outorgado *</Label>
            <Input
              id="grantee_name"
              value={granteeName}
              onChange={(e) => setGranteeName(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pdf-file">Arquivo PDF da Procuração *</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
            />
            <p className="text-sm text-gray-500">Envie o PDF da procuração</p>
          </div>
          
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? 'Enviando...' : 'Cadastrar Procuração'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}