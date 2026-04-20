/**
 * Firebase Storage service for file uploads
 */

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth } from './firebase'

const storage = getStorage()

export async function uploadProxyFile(condId, file, grantorCpf) {
  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado')
  
  // Create unique filename
  const timestamp = Date.now()
  const filename = `proxy_${grantorCpf}_${timestamp}.pdf`
  const path = `condominiums/${condId}/proxies/${filename}`
  
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  
  const downloadUrl = await getDownloadURL(storageRef)
  return downloadUrl
}

export async function uploadAssemblyExcel(condId, file, assemblyNumber) {
  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado')
  
  const filename = `assembly_${assemblyNumber}_${Date.now()}.xlsx`
  const path = `condominiums/${condId}/assemblies/${filename}`
  
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  
  return await getDownloadURL(storageRef)
}