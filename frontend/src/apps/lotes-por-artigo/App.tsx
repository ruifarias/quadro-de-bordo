import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layers, Tags } from 'lucide-react'
import { AuthProvider } from './contexts/AuthContext'
import LotesPage from './pages/LotesPage'
import LotesNomePage from './pages/LotesNomePage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

type Tab = 'artigo' | 'nome'

export default function LotesPorArtigo() {
  const [tab, setTab] = useState<Tab>('artigo')

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="lotes-por-artigo-app">
          <div className="lpa-tabs">
            <button
              className={`lpa-tab ${tab === 'artigo' ? 'active' : ''}`}
              onClick={() => setTab('artigo')}
            >
              <Layers size={16} />
              Lotes por Artigo
            </button>
            <button
              className={`lpa-tab ${tab === 'nome' ? 'active' : ''}`}
              onClick={() => setTab('nome')}
            >
              <Tags size={16} />
              Lotes por Nome
            </button>
          </div>

          {tab === 'artigo' ? <LotesPage /> : <LotesNomePage />}
        </div>
      </AuthProvider>
    </QueryClientProvider>
  )
}
