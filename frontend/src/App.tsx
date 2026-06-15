import { useState, useEffect } from 'react'
import axios from 'axios'
import './styles/App.css'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ExtractoFornecedor from './apps/extracto-fornecedor/App'
import ValoresEmDivida from './apps/valores-em-divida/App'
import PlaneamentoPagamentos from './apps/planeamento-pagamentos/App'

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

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    try {
      const response = await axios.get('/api/apps')
      setApps(response.data.apps)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar aplicações:', error)
      setLoading(false)
    }
  }

  const renderApp = () => {
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
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="quadro-de-bordo">
      <Sidebar apps={apps} currentApp={currentApp} onAppChange={setCurrentApp} />
      <div className="main-content">
        <Header appName={apps.find(a => a.id === currentApp)?.name || 'Quadro de Bordo'} />
        <div className="app-container">
          {renderApp()}
        </div>
      </div>
    </div>
  )
}

export default App
