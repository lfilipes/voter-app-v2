/**
 * Módulo 2 - Gerenciador de Itens de Votação
 * Combina o formulário de criação e a lista de itens
 */

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import UploadVotingItemsExcel from './UploadVotingItemsExcel'
import VotingItemsList from './VotingItemsList'

export default function VotingItemsManager() {
  const [refreshList, setRefreshList] = useState(0)

  const handleSuccess = () => {
    setRefreshList(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">➕ Criar Itens</TabsTrigger>
          <TabsTrigger value="list">📋 Listar Itens</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <UploadVotingItemsExcel onSuccess={handleSuccess} />
        </TabsContent>
        
        <TabsContent value="list">
          <VotingItemsList key={refreshList} />
        </TabsContent>
      </Tabs>
    </div>
  )
}