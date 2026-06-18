import { useState, useEffect, lazy, Suspense } from 'react'
import axios from 'axios'
import './styles/App.css'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

// Lazy load das apps para evitar erros de importação
const ExtractoFornecedor = lazy(() => import('./apps/extracto-fornecedor/App'))
const ValoresEmDivida = lazy(() => import('./apps/valores-em-divida/App'))
const PlaneamentoPagamentos = lazy(() => import('./apps/planeamento-pagamentos/App'))

interface App {
  id: string
  name: string
  description: string
  icon: string
  color: string
  disabled?: boolean
  coming_soon?: boolean
}

function App() {
  const [apps, setApps] = useState<App[]>([])
  const [currentApp, setCurrentApp] = useState<string>('extracto-fornecedor')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    try {
      const response = await axios.get('/api/apps')
      console.log('Response:', response.data)
      const appsArray = Array.isArray(response.data) ? response.data : (response.data.apps || [])
      console.log('Apps:', appsArray)
      setApps(appsArray)
      setLoading(false)
    } catch (err: any) {
      console.error('Erro ao carregar aplicações:', err)
      const errorMsg = err.message || 'Erro ao carregar aplicações'
      setError(errorMsg)
      setLoading(false)
    }
  }

  const renderApp = () => {
    try {
      switch (currentApp) {
        case 'extracto-fornecedor':
          return <ExtractoFornecedor />
        case 'valores-em-divida':
          return <ValoresEmDivida />
        case 'planeamento-pagamentos':
          return <PlaneamentoPagamentos />
        default:
          return <div className="app-placeholder">Aplicação não encontrada</div>
      }
    } catch (e) {
      return <div style={{color: 'red', padding: '20px'}}>Erro ao renderizar app: {String(e)}</div>
    }
  }

  if (error) {
    return <div className="error" style={{color: 'red', padding: '20px'}}><strong>Erro:</strong> {error}</div>
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  const safeApps = Array.isArray(apps) ? apps : []

  return (
    <div className="quadro-de-bordo">
      <Sidebar apps={safeApps} currentApp={currentApp} onAppChange={setCurrentApp} />
      <div className="main-content">
        <Header appName={safeApps.find(a => a.id === currentApp)?.name || 'Quadro de Bordo'} />
        <div className="app-container">
          <Suspense fallback={<div>Carregando app...</div>}>
            {renderApp()}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default App
