/**
 * Serviço de API para itens de votação
 */

import { auth } from './firebase'

const API_URL = process.env.REACT_APP_FLASK_API_URL || 'https://api-dot-voter-app-v2.rj.r.appspot.com/api'

async function getIdToken() {
  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado')
  return await user.getIdToken(true)
}

/**
 * Upload de Excel com itens de votação
 */
export async function uploadVotingItemsExcel(file, data) {
  try {
    const token = await getIdToken()
    const formData = new FormData()
    
    formData.append('file', file)
    formData.append('election_number', data.election_number)
    formData.append('election_name', data.election_name)
    
    const response = await fetch(`${API_URL}/voting/upload-excel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao fazer upload')
    }
    
    return { success: true, ...result }
  } catch (error) {
    console.error('Upload de Excel falhou:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Cadastro manual de itens de votação
 */
export async function createVotingItemsManually(data) {
  try {
    const token = await getIdToken()
    
    const response = await fetch(`${API_URL}/voting/create-items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao cadastrar itens')
    }
    
    return { success: true, ...result }
  } catch (error) {
    console.error('Cadastro manual falhou:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Busca itens de votação por número da eleição
 */
export async function getVotingItemsByElection(electionNumber) {
  try {
    const token = await getIdToken()
    
    const response = await fetch(`${API_URL}/voting/items/${encodeURIComponent(electionNumber)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao buscar itens')
    }
    
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Erro ao buscar itens:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Busca todas as votações com itens cadastrados
 */
export async function getAllVotingElections() {
  try {
    const token = await getIdToken()
    
    const response = await fetch(`${API_URL}/voting/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao buscar votações')
    }
    
    return { success: true, elections: result.elections, count: result.count }
  } catch (error) {
    console.error('Erro ao buscar votações:', error)
    return { success: false, error: error.message, elections: [] }
  }
}

/**
 * Deleta todos os itens de uma votação
 */
export async function deleteVotingItems(electionNumber) {
  try {
    const token = await getIdToken()
    
    const response = await fetch(`${API_URL}/voting/items/${encodeURIComponent(electionNumber)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao deletar itens')
    }
    
    return { success: true, ...result }
  } catch (error) {
    console.error('Erro ao deletar itens:', error)
    return { success: false, error: error.message }
  }
}