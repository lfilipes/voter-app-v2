/**
 * Admin API service - Complete redesigned
 */

import { auth } from './firebase'

const API_URL = process.env.REACT_APP_FLASK_API_URL || 'https://api-dot-voter-app-v2.rj.r.appspot.com/api'

async function getIdToken() {
  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado')
  return await user.getIdToken(true)
}

// ============ CONDOMINIUMS ============

export async function getCondominiums() {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    return data
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function createCondominium(condData) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(condData)
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============ RESIDENTS ============

export async function getResidents(condId) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/residents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function uploadResidentsExcel(condId, file) {
  try {
    const token = await getIdToken()
    const formData = new FormData()
    formData.append('file', file)
    
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/residents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============ PROXIES ============

export async function getProxies(condId) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/proxies`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function createProxy(condId, proxyData) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/proxies`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(proxyData)
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Cria um novo residente (votante) manualmente
 */
export async function createResident(condId, residentData) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/residents`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(residentData)
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============ ASSEMBLIES ============

export async function getAssemblies(condId) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function createAssembly(condId, assemblyData) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(assemblyData)
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function getAssemblyItems(condId, assemblyNumber) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/items`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function addAssemblyItem(condId, assemblyNumber, itemData) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/items`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function updateItemRelease(condId, assemblyNumber, itemId, isReleased) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/items/${itemId}/release`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_released: isReleased })
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function getAssemblyDetails(condId, assemblyNumber) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function uploadAssemblyExcel(condId, file, assemblyName, assemblyNumber, assemblyDate) {
  try {
    const token = await getIdToken()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('assembly_name', assemblyName)
    formData.append('assembly_number', assemblyNumber)
    formData.append('assembly_date', assemblyDate)
    
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/upload-excel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============ REPORT FUNCTIONS ============

export async function getAssemblyInfo(condId, assemblyNumber) {
  try {
    const token = await getIdToken()
    // Usa a rota de detalhes existente
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    
    // Ajusta o formato da resposta se necessário
    if (data.success && data.data) {
      return {
        success: true,
        info: {
          name: data.data.name,
          number: data.data.number,
          date: data.data.date,
          status: data.data.status,
          informative_text: data.data.informative_text
        }
      }
    }
    return data
  } catch (error) {
    console.error('Erro em getAssemblyInfo:', error)
    return { success: false, error: error.message }
  }
}

export async function getElectionResults(condId, assemblyNumber) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function getDetailedVotes(condId, assemblyNumber) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/votes/detailed`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function deleteAssemblyItem(condId, assemblyNumber, itemId) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function activateAssembly(condId, assemblyNumber) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/activate`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function getAssemblyStatus(condId, assemblyNumber) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function deactivateAssembly(condId, assemblyNumber) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/deactivate`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function startAssembly(condId, assemblyNumber) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/start`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function closeAssembly(condId, assemblyNumber) {
  try {
    const token = await getIdToken()
    const res = await fetch(`${API_URL}/admin/condominiums/${condId}/assemblies/${assemblyNumber}/close`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}