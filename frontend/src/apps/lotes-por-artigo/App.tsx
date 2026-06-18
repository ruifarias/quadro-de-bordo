import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import LotesPage from './pages/LotesPage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function LotesPorArtigo() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LotesPage />
      </AuthProvider>
    </QueryClientProvider>
  )
}
