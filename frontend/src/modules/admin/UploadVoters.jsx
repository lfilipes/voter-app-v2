/**
 * Módulo 1 - Upload de Votantes
 * Duas formas de cadastro:
 * 1. Upload de Excel (múltiplos votantes)
 * 2. Cadastro manual (um votante por vez)
 * 
 * O Excel deve conter as colunas:
 * - nome (obrigatório)
 * - email (obrigatório)
 * - apartamento (obrigatório)
 * - cpf (obrigatório)
 */

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { uploadResidentsExcel, createResident } from '../../services/adminApi'

export default function UploadVoters({ onSuccess }) {
  const { condId } = useParams()
  
  // ============================================
  // ESTADO PARA UPLOAD DE EXCEL
  // ============================================
  const [file, setFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [importSummary, setImportSummary] = useState(null)
  const [activeTab, setActiveTab] = useState('excel')

  // ============================================
  // ESTADO PARA CADASTRO MANUAL
  // ============================================
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    apartment: '',
    cpf: '',
    password: ''
  })
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError, setManualError] = useState('')
  const [manualSuccess, setManualSuccess] = useState('')

  // ============================================
  // FUNÇÕES PARA UPLOAD DE EXCEL
  // ============================================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      setFile(selectedFile)
      setUploadError('')
      setImportSummary(null)
    } else {
      setFile(null)
      setUploadError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)')
    }
  }

  const handleExcelSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      setUploadError('Selecione um arquivo Excel')
      return
    }
    
    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')
    setImportSummary(null)
    
    const result = await uploadResidentsExcel(condId, file)
    
    if (result.success) {
      setUploadSuccess(`${result.created} votantes importados com sucesso!`)
      setImportSummary({
        created: result.created,
        total: result.total,
        errors: result.errors,
        warnings: result.warnings
      })
      setFile(null)
      document.getElementById('excel-file').value = ''
      if (onSuccess) onSuccess()
    } else {
      setUploadError(result.error)
    }
    
    setUploadLoading(false)
  }

  // ============================================
  // FUNÇÕES PARA CADASTRO MANUAL
  // ============================================
  const formatCpf = (value) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  const handleManualChange = (field, value) => {
    setManualForm(prev => ({ ...prev, [field]: value }))
    setManualError('')
    setManualSuccess('')
  }

  const handleCpfChange = (value) => {
    const formatted = formatCpf(value)
    setManualForm(prev => ({ ...prev, cpf: formatted }))
  }

  const validateManualForm = () => {
    if (!manualForm.name.trim()) {
      setManualError('Nome é obrigatório')
      return false
    }
    
    if (!manualForm.email.trim()) {
      setManualError('Email é obrigatório')
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(manualForm.email)) {
      setManualError('Email inválido')
      return false
    }
    
    if (!manualForm.apartment.trim()) {
      setManualError('Apartamento é obrigatório')
      return false
    }
    
    const cpfDigits = manualForm.cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setManualError('CPF deve ter 11 dígitos')
      return false
    }
    
    // Se senha não foi fornecida, usa os 6 primeiros dígitos do CPF
    if (!manualForm.password) {
      setManualForm(prev => ({ ...prev, password: cpfDigits.slice(0, 6) }))
    } else if (manualForm.password.length < 6) {
      setManualError('Senha deve ter pelo menos 6 caracteres')
      return false
    }
    
    return true
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateManualForm()) {
      return
    }
    
    setManualLoading(true)
    setManualError('')
    setManualSuccess('')
    
    const cpfDigits = manualForm.cpf.replace(/\D/g, '')
    const password = manualForm.password || cpfDigits.slice(0, 6)
    
    const result = await createResident(condId, {
      name: manualForm.name,
      email: manualForm.email.toLowerCase().trim(),
      apartment: manualForm.apartment,
      cpf: cpfDigits,
      password: password,
      phone: manualForm.phone || ''
    })
    
    if (result.success) {
      setManualSuccess(`Votante ${manualForm.name} cadastrado com sucesso!`)
      setManualForm({
        name: '',
        email: '',
        apartment: '',
        cpf: '',
        password: '',
        phone: ''
      })
      if (onSuccess) onSuccess()
    } else {
      setManualError(result.error)
    }
    
    setManualLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Votantes</CardTitle>
        <CardDescription>
          Cadastre os moradores que poderão votar nas assembleias.
          Você pode importar múltiplos via Excel ou cadastrar um por vez manualmente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="excel">📊 Upload via Excel</TabsTrigger>
            <TabsTrigger value="manual">✏️ Cadastro Manual</TabsTrigger>
          </TabsList>
          
          {/* ============================================ */}
          {/* ABA 1: UPLOAD VIA EXCEL */}
          {/* ============================================ */}
          <TabsContent value="excel">
            <form onSubmit={handleExcelSubmit} className="space-y-4">
              {uploadError && (
                <Alert variant="destructive">
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}
              
              {uploadSuccess && (
                <Alert className="bg-green-50 border-green-500">
                  <AlertDescription className="text-green-700">{uploadSuccess}</AlertDescription>
                </Alert>
              )}
              
              {importSummary && importSummary.warnings && importSummary.warnings.length > 0 && (
                <Alert className="bg-yellow-50 border-yellow-500">
                  <AlertDescription className="text-yellow-700">
                    <p className="font-bold">Avisos:</p>
                    <ul className="list-disc list-inside text-sm mt-1">
                      {importSummary.warnings.slice(0, 5).map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="excel-file">Arquivo Excel</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-sm text-gray-500">
                  O Excel deve ter as colunas: <strong>nome, email, apartamento, cpf</strong>
                </p>
                <p className="text-xs text-gray-400">
                  A senha padrão será os 6 primeiros dígitos do CPF.
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={uploadLoading}>
                {uploadLoading ? 'Importando...' : 'Importar Votantes'}
              </Button>
            </form>
          </TabsContent>
          
          {/* ============================================ */}
          {/* ABA 2: CADASTRO MANUAL */}
          {/* ============================================ */}
          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {manualError && (
                <Alert variant="destructive">
                  <AlertDescription>{manualError}</AlertDescription>
                </Alert>
              )}
              
              {manualSuccess && (
                <Alert className="bg-green-50 border-green-500">
                  <AlertDescription className="text-green-700">{manualSuccess}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual_name">Nome Completo *</Label>
                  <Input
                    id="manual_name"
                    value={manualForm.name}
                    onChange={(e) => handleManualChange('name', e.target.value)}
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manual_email">Email *</Label>
                  <Input
                    id="manual_email"
                    type="email"
                    value={manualForm.email}
                    onChange={(e) => handleManualChange('email', e.target.value)}
                    placeholder="joao@email.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manual_apartment">Apartamento *</Label>
                  <Input
                    id="manual_apartment"
                    value={manualForm.apartment}
                    onChange={(e) => handleManualChange('apartment', e.target.value)}
                    placeholder="Ex: 101, 202-B"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manual_cpf">CPF *</Label>
                  <Input
                    id="manual_cpf"
                    value={manualForm.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    placeholder="123.456.789-00"
                    maxLength={14}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manual_password">
                    Senha (opcional)
                  </Label>
                  <Input
                    id="manual_password"
                    type="password"
                    value={manualForm.password}
                    onChange={(e) => handleManualChange('password', e.target.value)}
                    placeholder="Deixe em branco para usar os 6 primeiros dígitos do CPF"
                  />
                  <p className="text-xs text-gray-400">
                    Se não informada, a senha será os 6 primeiros dígitos do CPF
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manual_phone">Telefone (opcional)</Label>
                  <Input
                    id="manual_phone"
                    value={manualForm.phone || ''}
                    onChange={(e) => handleManualChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={manualLoading}>
                {manualLoading ? 'Cadastrando...' : 'Cadastrar Votante'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}