/**
 * Serviços específicos para o módulo de votação
 * 
 * IMPORTANTE: REACT_APP_FLASK_API_URL já inclui /api
 * Portanto as rotas NÃO devem começar com /api
 */

const API_URL = process.env.REACT_APP_FLASK_API_URL || 'https://api-dot-voter-app-v2.rj.r.appspot.com/api'

/**
 * Lista todos os condomínios (público)
 */
export async function getPublicCondominiums() {
  try {
    const response = await fetch(`${API_URL}/public/condominiums`)
    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, error: error.message, condominiums: [] }
  }
}

/**
 * Autentica um votante usando email e CPF (6 primeiros dígitos)
 */
export async function authenticateVoter(condominiumId, email, cpfPassword) {
  try {
    const response = await fetch(`${API_URL}/public/voter/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        condominiumId,
        email,
        cpfPassword: cpfPassword.slice(0, 6)
      })
    })
    
    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Busca a assembleia ativa para um votante específico
 */
export async function getActiveAssemblyForVoter(condominiumId, voterEmail) {
  try {
    const response = await fetch(
      `${API_URL}/public/voter/active-assembly?condominiumId=${condominiumId}&email=${encodeURIComponent(voterEmail)}`
    )
    return await response.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Calcula o peso do voto (1 + número de procurações recebidas)
 */
export async function getVotingWeight(condominiumId, voterEmail) {
  try {
    const response = await fetch(
      `${API_URL}/public/voter/voting-weight?condominiumId=${condominiumId}&email=${encodeURIComponent(voterEmail)}`
    )
    return await response.json()
  } catch (error) {
    return { success: false, weight: 1, error: error.message }
  }
}

/**
 * Registra um voto
 */
export async function registerVote(condominiumId, assemblyNumber, voter, votes, votingWeight) {
  try {
    const response = await fetch(`${API_URL}/public/voter/register-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        condominiumId,
        assemblyNumber,
        voter,
        votes,
        votingWeight
      })
    })
    
    return await response.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function getAssemblyStatus(condominiumId, assemblyNumber) {
  try {
    const response = await fetch(
      `${API_URL}/public/voter/assembly-status?condominiumId=${condominiumId}&assemblyNumber=${assemblyNumber}`
    )
    return await response.json()
  } catch (error) {
    return { success: false, error: error.message, status: 'unknown' }
  }
}