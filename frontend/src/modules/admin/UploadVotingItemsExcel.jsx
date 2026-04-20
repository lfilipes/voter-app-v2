/**
 * Módulo 2 - Upload de Excel para Itens de Votação
 * 
 * O Excel deve ter:
 * - Linha 1: Cabeçalho (ex: Informativo, Item1, Item2, ..., Item10)
 * - Linha 2: Dados (coluna 1 = informativo, colunas 2-11 = itens)
 */

import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'

// Funções da API (serão adicionadas)
import { uploadVotingItemsExcel, createVotingItemsManually } from '../../services/votingApi'

export default function UploadVotingItemsExcel({ onSuccess }) {
  const [file, setFile] = useState(null)
  const [electionNumber, setElectionNumber] = useState('')
  const [electionName, setElectionName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Estado para cadastro manual
  const [informativeText, setInformativeText] = useState('')
  const [items, setItems] = useState([{ item_number: 1, description: '' }])
  const [activeTab, setActiveTab] = useState('excel')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      setFile(selectedFile)
      setError('')
    } else {
      setFile(null)
      setError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)')
    }
  }

  const handleExcelSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      setError('Selecione um arquivo Excel')
      return
    }
    
    if (!electionNumber.trim()) {
      setError('Digite o número da votação')
      return
    }
    
    if (!electionName.trim()) {
      setError('Digite o nome da votação')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    const result = await uploadVotingItemsExcel(file, {
      election_number: electionNumber,
      election_name: electionName
    })
    
    if (result.success) {
      setSuccess(`Itens de votação cadastrados com sucesso! ${result.total_items} itens processados.`)
      setFile(null)
      setElectionNumber('')
      setElectionName('')
      document.getElementById('excel-file').value = ''
      if (onSuccess) onSuccess()
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const addItem = () => {
    if (items.length < 10) {
      setItems([...items, { item_number: items.length + 1, description: '' }])
    }
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index)
      // Reorganiza os números dos itens
      newItems.forEach((item, idx) => {
        item.item_number = idx + 1
      })
      setItems(newItems)
    }
  }

  const updateItem = (index, value) => {
    const newItems = [...items]
    newItems[index].description = value
    setItems(newItems)
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    
    if (!electionNumber.trim()) {
      setError('Digite o número da votação')
      return
    }
    
    if (!electionName.trim()) {
      setError('Digite o nome da votação')
      return
    }
    
    if (!informativeText.trim()) {
      setError('Digite o texto informativo')
      return
    }
    
    const validItems = items.filter(item => item.description.trim())
    if (validItems.length === 0) {
      setError('Adicione pelo menos um item para votação')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    const result = await createVotingItemsManually({
      election_number: electionNumber,
      election_name: electionName,
      informative_text: informativeText,
      items: validItems
    })
    
    if (result.success) {
      setSuccess(`Itens de votação cadastrados com sucesso! ${validItems.length} itens.`)
      setElectionNumber('')
      setElectionName('')
      setInformativeText('')
      setItems([{ item_number: 1, description: '' }])
      if (onSuccess) onSuccess()
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Itens de Votação</CardTitle>
        <CardDescription>
          Cadastre os itens que serão votados na assembleia.
          Os itens devem estar vinculados a um número de votação já cadastrado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="excel">Upload Excel</TabsTrigger>
            <TabsTrigger value="manual">Cadastro Manual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel">
            <form onSubmit={handleExcelSubmit} className="space-y-4">
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
                <Label htmlFor="election_number_excel">Número da Votação *</Label>
                <Input
                  id="election_number_excel"
                  value={electionNumber}
                  onChange={(e) => setElectionNumber(e.target.value)}
                  placeholder="Ex: 001/2024"
                  required
                />
                <p className="text-sm text-gray-500">
                  Deve coincidir com o número usado no cadastro de votantes
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="election_name_excel">Nome da Votação *</Label>
                <Input
                  id="election_name_excel"
                  value={electionName}
                  onChange={(e) => setElectionName(e.target.value)}
                  placeholder="Ex: Eleição do Condomínio 2024"
                  required
                />
              </div>
              
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
                  O Excel deve ter na primeira linha os cabeçalhos e na segunda linha:
                  Coluna 1 = Informativo, Colunas 2 a 11 = Itens (até 10 itens)
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Upload e Cadastrar Itens'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit} className="space-y-4">
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
                <Label htmlFor="election_number_manual">Número da Votação *</Label>
                <Input
                  id="election_number_manual"
                  value={electionNumber}
                  onChange={(e) => setElectionNumber(e.target.value)}
                  placeholder="Ex: 001/2024"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="election_name_manual">Nome da Votação *</Label>
                <Input
                  id="election_name_manual"
                  value={electionName}
                  onChange={(e) => setElectionName(e.target.value)}
                  placeholder="Ex: Eleição do Condomínio 2024"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="informative_text">Informativo da Assembleia *</Label>
                <textarea
                  id="informative_text"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                  value={informativeText}
                  onChange={(e) => setInformativeText(e.target.value)}
                  placeholder="Descreva o objetivo da assembleia, instruções para votação, etc."
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label>Itens para Votação (máximo 10)</Label>
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="w-8 text-sm font-medium">{item.item_number}.</span>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, e.target.value)}
                      placeholder={`Digite o item ${item.item_number}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                
                {items.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="w-full"
                  >
                    + Adicionar Item
                  </Button>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Cadastrando...' : 'Cadastrar Itens'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}