import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './pages/LoginPage'
import VendasPage from './pages/VendasPage'
import LotesPage from './pages/LotesPage'
import DashboardPage from './pages/DashboardPage'
import HistoricoPage from './pages/HistoricoPage'
import DashboardHistoricoPage from './pages/DashboardHistoricoPage'
import Layout from './components/Layout'
import './styles/app.css'

const queryClient = new QueryClient()

type PageType = 'vendas' | 'lotes' | 'dashboard' | 'historico' | 'dashboard-historico' | 'login'

function ReposicopesContent() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState<PageType>('login')

  useEffect(() => {
    if (user) {
      setCurrentPage('vendas')
    } else {
      setCurrentPage('login')
    }
  }, [user])

  if (!user) {
    return <LoginPage />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'vendas':
        return <VendasPage />
      case 'lotes':
        return <LotesPage />
      case 'dashboard':
        return <DashboardPage />
      case 'historico':
        return <HistoricoPage />
      case 'dashboard-historico':
        return <DashboardHistoricoPage />
      default:
        return <VendasPage />
    }
  }

  return (
    <Layout onNavigate={(page) => setCurrentPage(page as PageType)} currentPage={currentPage}>
      {renderPage()}
    </Layout>
  )
}

export default function Reposicoes() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ReposicopesContent />
      </AuthProvider>
    </QueryClientProvider>
  )
}
