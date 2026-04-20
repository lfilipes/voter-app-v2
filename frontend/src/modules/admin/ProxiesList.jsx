/**
 * Módulo 1 - Lista de Procurações
 * Exibe todas as procurações cadastradas com visualização de PDF
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog'
import { getProxies } from '../../services/adminApi'

export default function ProxiesList() {
  const { condId } = useParams()
  const [proxies, setProxies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPdf, setSelectedPdf] = useState(null)
  const [selectedProxy, setSelectedProxy] = useState(null)

  const loadProxies = async () => {
    if (!condId) return
    
    setLoading(true)
    const result = await getProxies(condId)
    
    if (result.success) {
      setProxies(result.proxies)
      setError('')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadProxies()
  }, [condId])

  const formatCpf = (cpf) => {
    if (!cpf) return '-'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const openPdfViewer = (pdfUrl, proxy) => {
    setSelectedPdf(pdfUrl)
    setSelectedProxy(proxy)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Carregando procurações...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Procurações Cadastradas</CardTitle>
          <CardDescription>
            Lista de todas as procurações registradas neste condomínio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {proxies.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhuma procuração cadastrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apartamento</TableHead>
                    <TableHead>CPF Outorgante</TableHead>
                    <TableHead>Outorgado</TableHead>
                    <TableHead>Email Outorgado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Procuração</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proxies.map((proxy) => (
                    <TableRow key={proxy.id}>
                      <TableCell className="font-medium">{proxy.apartment || '-'}</TableCell>
                      <TableCell className="font-mono">{formatCpf(proxy.grantor_cpf)}</TableCell>
                      <TableCell>{proxy.grantee_name || '-'}</TableCell>
                      <TableCell>{proxy.grantee_email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          proxy.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {proxy.status === 'active' ? 'Ativa' : 'Inativa'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {proxy.pdf_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPdfViewer(proxy.pdf_url, proxy)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            📄 Ver PDF
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">Não disponível</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de visualização de PDF */}
      <Dialog open={!!selectedPdf} onOpenChange={() => setSelectedPdf(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Procuração</DialogTitle>
            <DialogDescription>
              {selectedProxy && (
                <>
                  Outorgante CPF: {formatCpf(selectedProxy.grantor_cpf)} | 
                  Outorgado: {selectedProxy.grantee_name} ({selectedProxy.grantee_email})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 h-[70vh] overflow-y-auto border rounded-lg">
            {selectedPdf && (
              <iframe
                src={selectedPdf}
                className="w-full h-full min-h-[500px]"
                title="Visualizador de PDF"
              />
            )}
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedPdf(null)}>
              Fechar
            </Button>
            {selectedPdf && (
              <Button onClick={() => window.open(selectedPdf, '_blank')}>
                Abrir em nova aba
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}