/**
 * Gerenciador de Assembleias / Votações
 * Suporte a itens de múltipla escolha (eleições com chapas)
 * Permite ativar/desativar assembleias (apenas uma ativa por vez)
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { 
  createAssembly, 
  addAssemblyItem, 
  updateItemRelease, 
  getAssemblies,
  getAssemblyItems,
  getAssemblyDetails,
  deleteAssemblyItem,
  activateAssembly,
  deactivateAssembly,
  startAssembly,    
  closeAssembly 
} from '../../services/adminApi'

export default function AssemblyManager() {
  const { condId } = useParams()
  
  // Estado para lista de votações
  const [assemblies, setAssemblies] = useState([])
  const [loadingAssemblies, setLoadingAssemblies] = useState(true)
  
  // Estado para criação da assembleia
  const [assemblyNumber, setAssemblyNumber] = useState('')
  const [assemblyName, setAssemblyName] = useState('')
  const [assemblyDate, setAssemblyDate] = useState('')
  const [informativeText, setInformativeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Estado para itens
  const [currentAssembly, setCurrentAssembly] = useState(null)
  const [items, setItems] = useState([])
  const [newItemDescription, setNewItemDescription] = useState('')
  const [itemType, setItemType] = useState('approve_reject')
  const [itemOptions, setItemOptions] = useState([
    { id: 'opt_1', label: '', description: '' }
  ])
  const [maxOptions, setMaxOptions] = useState(1)
  const [itemLoading, setItemLoading] = useState(false)
  const [itemError, setItemError] = useState('')
  const [itemSuccess, setItemSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('list')
  const [showItemForm, setShowItemForm] = useState(false)

  // Carregar lista de votações
  const loadAssemblies = async () => {
    if (!condId) return
    setLoadingAssemblies(true)
    const result = await getAssemblies(condId)
    if (result.success) {
      setAssemblies(result.assemblies || [])
    }
    setLoadingAssemblies(false)
  }

  // Carregar itens de uma votação específica
  const loadAssemblyItems = async (assemblyNumber) => {
    const result = await getAssemblyItems(condId, assemblyNumber)
    if (result.success) {
      setItems(result.items || [])
    }
    return result
  }

  useEffect(() => {
    loadAssemblies()
  }, [condId])

  const handleCreateAssembly = async (e) => {
    e.preventDefault()
    
    if (!assemblyNumber.trim()) {
      setError('Número da votação é obrigatório')
      return
    }
    
    if (!assemblyName.trim()) {
      setError('Nome da votação é obrigatório')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    const result = await createAssembly(condId, {
      number: assemblyNumber,
      name: assemblyName,
      date: assemblyDate,
      informative_text: informativeText,
      description: informativeText.substring(0, 200)
    })
    
    if (result.success) {
      setSuccess(`Votação "${assemblyName}" criada com sucesso!`)
      await loadAssemblies()
      setAssemblyNumber('')
      setAssemblyName('')
      setAssemblyDate('')
      setInformativeText('')
      
      setTimeout(() => setSuccess(''), 3000)
      setActiveTab('list')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleSelectAssembly = async (assembly) => {
    const detailsResult = await getAssemblyDetails(condId, assembly.number)
    
    setCurrentAssembly({
      number: assembly.number,
      name: assembly.name,
      date: assembly.date,
      informative_text: detailsResult.success ? detailsResult.informative_text : assembly.informative_text || ''
    })
    
    const result = await loadAssemblyItems(assembly.number)
    if (result.success) {
      setItems(result.items || [])
      setActiveTab('items')
      setShowItemForm(false)
      resetItemForm()
    } else {
      setItemError(result.error)
    }
  }

const handleDeactivateAssembly = async (assemblyNumber, assemblyName) => {
  if (!window.confirm(`Tem certeza que deseja desativar a assembleia "${assemblyName}"?`)) {
    return
  }
  
  setItemLoading(true)
  setItemError('')
  setItemSuccess('')
  
  try {
    const result = await deactivateAssembly(condId, assemblyNumber)
    
    if (result.success) {
      setItemSuccess(`Assembleia "${assemblyName}" desativada com sucesso!`)
      await loadAssemblies()
      setTimeout(() => setItemSuccess(''), 3000)
    } else {
      setItemError(result.error || 'Erro ao desativar assembleia')
      setTimeout(() => setItemError(''), 3000)
    }
  } catch (err) {
    setItemError('Erro ao conectar com o servidor')
    setTimeout(() => setItemError(''), 3000)
  } finally {
    setItemLoading(false)
  }
}

  const handleActivateAssembly = async (assemblyNumber, assemblyName) => {
    if (!window.confirm(`Tem certeza que deseja ativar a assembleia "${assemblyName}"? Isso desativará qualquer outra assembleia ativa.`)) {
      return
    }
    
    setItemLoading(true)
    setItemError('')
    setItemSuccess('')
    
    try {
      const result = await activateAssembly(condId, assemblyNumber)
      
      if (result.success) {
        setItemSuccess(`Assembleia "${assemblyName}" ativada com sucesso!`)
        await loadAssemblies()
        setTimeout(() => setItemSuccess(''), 3000)
      } else {
        setItemError(result.error || 'Erro ao ativar assembleia')
        setTimeout(() => setItemError(''), 3000)
      }
    } catch (err) {
      setItemError('Erro ao conectar com o servidor')
      setTimeout(() => setItemError(''), 3000)
    } finally {
      setItemLoading(false)
    }
  }

  const resetItemForm = () => {
    setNewItemDescription('')
    setItemType('approve_reject')
    setItemOptions([{ id: 'opt_1', label: '', description: '' }])
    setMaxOptions(1)
    setItemError('')
    setItemSuccess('')
  }

  const addOption = () => {
    if (itemOptions.length < 5) {
      setItemOptions([...itemOptions, { id: `opt_${itemOptions.length + 1}`, label: '', description: '' }])
    }
  }

  const removeOption = (index) => {
    if (itemOptions.length > 1) {
      const newOptions = itemOptions.filter((_, i) => i !== index)
      const reorderedOptions = newOptions.map((opt, idx) => ({
        ...opt,
        id: `opt_${idx + 1}`
      }))
      setItemOptions(reorderedOptions)
    }
  }

  const updateOption = (index, field, value) => {
    const newOptions = [...itemOptions]
    newOptions[index][field] = value
    setItemOptions(newOptions)
  }

  const handleAddItem = async () => {
    if (!newItemDescription.trim()) {
      setItemError('Digite a descrição do item')
      return
    }
    
    if (itemType === 'multiple_choice') {
      const validOptions = itemOptions.filter(opt => opt.label.trim())
      if (validOptions.length < 2) {
        setItemError('Múltipla escolha requer pelo menos 2 opções')
        return
      }
    }
    
    setItemLoading(true)
    setItemError('')
    setItemSuccess('')
    
    const itemData = {
      order: items.length + 1,
      title: `Item ${items.length + 1}`,
      description: newItemDescription,
      type: itemType,
      is_released: false,
      is_locked: false
    }
    
    if (itemType === 'multiple_choice') {
      itemData.options = itemOptions.filter(opt => opt.label.trim())
      itemData.max_options = maxOptions
    }
    
    const result = await addAssemblyItem(condId, currentAssembly.number, itemData)
    
    if (result.success) {
      await loadAssemblyItems(currentAssembly.number)
      setNewItemDescription('')
      setItemType('approve_reject')
      setItemOptions([{ id: 'opt_1', label: '', description: '' }])
      setMaxOptions(1)
      setItemSuccess(`Item adicionado com sucesso!`)
      setShowItemForm(false)
      setTimeout(() => setItemSuccess(''), 2000)
    } else {
      setItemError(result.error)
      setTimeout(() => setItemError(''), 3000)
    }
    
    setItemLoading(false)
  }

  const handleRemoveItem = async (itemId, index) => {
    if (!currentAssembly) return
    
    if (!window.confirm('Tem certeza que deseja remover este item permanentemente?')) {
      return
    }
    
    setItemLoading(true)
    setItemError('')
    setItemSuccess('')
    
    try {
      const result = await deleteAssemblyItem(condId, currentAssembly.number, itemId)
      
      if (result.success) {
        const newItems = items.filter((_, i) => i !== index)
        const reorderedItems = newItems.map((item, idx) => ({
          ...item,
          order: idx + 1,
          title: `Item ${idx + 1}`
        }))
        setItems(reorderedItems)
        setItemSuccess(`Item removido permanentemente!`)
        setTimeout(() => setItemSuccess(''), 2000)
      } else {
        setItemError(result.error || 'Erro ao remover item')
        setTimeout(() => setItemError(''), 3000)
      }
    } catch (err) {
      setItemError('Erro ao conectar com o servidor')
      setTimeout(() => setItemError(''), 3000)
    } finally {
      setItemLoading(false)
    }
  }

  const handleToggleRelease = async (itemId, currentStatus) => {
    const result = await updateItemRelease(condId, currentAssembly.number, itemId, !currentStatus)
    if (result.success) {
      setItems(items.map(item => 
        item.id === itemId ? { ...item, is_released: !currentStatus } : item
      ))
      setItemSuccess(`Item ${!currentStatus ? 'liberado' : 'bloqueado'} para votação`)
      setTimeout(() => setItemSuccess(''), 2000)
    }
  }

  const handleBackToList = () => {
    setCurrentAssembly(null)
    setItems([])
    setActiveTab('list')
    setShowItemForm(false)
    resetItemForm()
  }

  const handleStartAssembly = async (assemblyNumber, assemblyName) => {
  if (!window.confirm(`Iniciar a assembleia "${assemblyName}"? Os votantes poderão votar.`)) {
    return
  }
  
  setItemLoading(true)
  const result = await startAssembly(condId, assemblyNumber)
  if (result.success) {
    setItemSuccess(`Assembleia "${assemblyName}" iniciada!`)
    await loadAssemblies()
  } else {
    setItemError(result.error)
  }
  setItemLoading(false)
}

const handleCloseAssembly = async (assemblyNumber, assemblyName) => {
  if (!window.confirm(`Encerrar a assembleia "${assemblyName}"? Os votantes não poderão mais votar, mas poderão ver os resultados.`)) {
    return
  }
  
  setItemLoading(true)
  const result = await closeAssembly(condId, assemblyNumber)
  if (result.success) {
    setItemSuccess(`Assembleia "${assemblyName}" encerrada!`)
    await loadAssemblies()
  } else {
    setItemError(result.error)
  }
  setItemLoading(false)
}

  const renderAdminItem = (item, index) => {
    return (
      <div key={item.id} className="border rounded-lg p-4 bg-white">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-blue-600">Item {item.order}:</span>
              <span className="text-gray-700">{item.description}</span>
              {item.type === 'multiple_choice' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Múltipla escolha ({item.options?.length} opções)
                </span>
              )}
            </div>
            {item.type === 'multiple_choice' && item.options && (
              <div className="mt-2 ml-6 text-sm text-gray-500">
                Opções: {item.options.map(opt => opt.label).join(' | ')}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              item.is_released 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {item.is_released ? '✓ Liberado' : '⏳ Não liberado'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleRelease(item.id, item.is_released)}
              className={item.is_released ? 'text-yellow-600' : 'text-green-600'}
            >
              {item.is_released ? 'Bloquear' : 'Liberar'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(item.id, index)}
              className="text-red-500 hover:text-red-700"
              disabled={itemLoading}
            >
              ✕ Remover
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">📋 Listar Votações</TabsTrigger>
          <TabsTrigger value="create">➕ Criar Nova</TabsTrigger>
          <TabsTrigger value="items" disabled={!currentAssembly}>
            📝 Gerenciar Itens {currentAssembly && `(${items.length}/10)`}
          </TabsTrigger>
        </TabsList>
        
        {/* Aba: Listar Votações */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Votações Cadastradas</CardTitle>
              <CardDescription>
                Selecione uma votação para gerenciar seus itens. 
                Apenas uma votação pode estar ativa por vez.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssemblies ? (
                <div className="text-center py-8 text-gray-500">Carregando votações...</div>
              ) : assemblies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma votação cadastrada. Clique em "Criar Nova" para começar.
                </div>
              ) : (
                <div className="space-y-3">
              {assemblies.map((assembly) => (
                <div key={assembly.number} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {assembly.number}
                      </span>
                      <span className="font-medium">{assembly.name}</span>
                      {assembly.status === 'inactive' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStartAssembly(assembly.number, assembly.name)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          disabled={itemLoading}
                        >
                          🟢 Iniciar
                        </Button>
                      )}
                      {assembly.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCloseAssembly(assembly.number, assembly.name)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          disabled={itemLoading}
                        >
                          🔴 Encerrar
                        </Button>
                      )}
                      {assembly.status === 'closed' && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                          ✅ Finalizada
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {assembly.date && <span>Data: {new Date(assembly.date).toLocaleDateString()} | </span>}
                      <span>Itens: {assembly.items_count || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {assembly.status === 'inactive' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleActivateAssembly(assembly.number, assembly.name)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        disabled={itemLoading}
                      >
                        🔓 Ativar
                      </Button>
                    )}
                    {assembly.status === 'active' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeactivateAssembly(assembly.number, assembly.name)}
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                        disabled={itemLoading}
                      >
                        ⏸ Desativar
                      </Button>
                    )}
                    <Button size="sm" onClick={() => handleSelectAssembly(assembly)}>
                      📝 Gerenciar Itens
                    </Button>
                  </div>
                </div>
              ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba: Criar Nova Votação */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Votação</CardTitle>
              <CardDescription>
                Cadastre uma nova assembleia/votação para este condomínio.
                Após criar, você precisará ativá-la na lista de votações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAssembly} className="space-y-4">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número da Votação *</Label>
                    <Input
                      value={assemblyNumber}
                      onChange={(e) => setAssemblyNumber(e.target.value)}
                      placeholder="Ex: 001/2024"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nome da Votação *</Label>
                    <Input
                      value={assemblyName}
                      onChange={(e) => setAssemblyName(e.target.value)}
                      placeholder="Ex: Assembleia Geral 2024"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Data da Votação</Label>
                  <Input
                    type="datetime-local"
                    value={assemblyDate}
                    onChange={(e) => setAssemblyDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Informativo da Assembleia</Label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                    value={informativeText}
                    onChange={(e) => setInformativeText(e.target.value)}
                    placeholder="Descreva o objetivo da assembleia, instruções para votação, etc."
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Votação'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba: Gerenciar Itens */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Gerenciar Itens da Votação</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    <div className="space-y-1 mt-2">
                      <p><strong>Votação:</strong> {currentAssembly?.name}</p>
                      <p><strong>Número:</strong> {currentAssembly?.number}</p>
                      {currentAssembly?.date && (
                        <p><strong>Data:</strong> {new Date(currentAssembly.date).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" onClick={handleBackToList}>
                  ← Voltar para lista
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informativo da Assembleia */}
              {currentAssembly?.informative_text && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-semibold text-blue-800 mb-2">📢 Informativo da Assembleia:</p>
                  <p className="text-sm text-blue-700 whitespace-pre-wrap">{currentAssembly.informative_text}</p>
                </div>
              )}
              
              {itemError && (
                <Alert variant="destructive">
                  <AlertDescription>{itemError}</AlertDescription>
                </Alert>
              )}
              
              {itemSuccess && (
                <Alert className="bg-green-50 border-green-500">
                  <AlertDescription className="text-green-700">{itemSuccess}</AlertDescription>
                </Alert>
              )}
              
              {/* Lista de itens existentes */}
              {items.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-lg font-semibold">Itens cadastrados ({items.length}/10)</Label>
                    {!showItemForm && (
                      <Button size="sm" onClick={() => setShowItemForm(true)}>
                        + Adicionar Item
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {items.map((item, index) => renderAdminItem(item, index))}
                  </div>
                </div>
              )}
              
              {/* Formulário para adicionar novo item */}
              {(showItemForm || items.length === 0) && (
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-lg font-semibold">
                    {items.length === 0 ? 'Adicionar primeiro item' : 'Adicionar novo item'}
                  </Label>
                  
                  <div className="space-y-2">
                    <Label>Descrição do Item *</Label>
                    <Input
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      placeholder="Ex: Aprovação do orçamento 2025"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Votação</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="approve_reject"
                          checked={itemType === 'approve_reject'}
                          onChange={(e) => setItemType(e.target.value)}
                        />
                        Aprovar / Reprovar
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="multiple_choice"
                          checked={itemType === 'multiple_choice'}
                          onChange={(e) => setItemType(e.target.value)}
                        />
                        Múltipla Escolha (Chapas/Candidatos)
                      </label>
                    </div>
                  </div>
                  
                  {itemType === 'multiple_choice' && (
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      <Label>Opções (mínimo 2, máximo 5)</Label>
                      {itemOptions.map((option, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            <Input
                              placeholder={`Opção ${idx + 1} (ex: Chapa A)`}
                              value={option.label}
                              onChange={(e) => updateOption(idx, 'label', e.target.value)}
                            />
                            <Input
                              placeholder="Descrição (opcional)"
                              value={option.description}
                              onChange={(e) => updateOption(idx, 'description', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(idx)}
                            disabled={itemOptions.length <= 1}
                            className="text-red-500"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                      {itemOptions.length < 5 && (
                        <Button type="button" variant="outline" size="sm" onClick={addOption}>
                          + Adicionar opção
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleAddItem} disabled={itemLoading}>
                      {itemLoading ? 'Adicionando...' : 'Adicionar Item'}
                    </Button>
                    {items.length > 0 && (
                      <Button variant="ghost" onClick={() => setShowItemForm(false)}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {items.length === 0 && !showItemForm && (
                <div className="text-center py-6 text-gray-500">
                  Nenhum item cadastrado. Clique em "Adicionar Item" para começar.
                </div>
              )}
              
              {/* Resumo */}
              {items.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Resumo:</strong> {items.length} itens, 
                    {items.filter(i => i.is_released).length} liberado(s) para votação.
                    {items.filter(i => i.type === 'multiple_choice').length} item(ns) de múltipla escolha.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}