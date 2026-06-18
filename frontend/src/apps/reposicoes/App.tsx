import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import VendasPage from './pages/VendasPage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function Reposicoes() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VendasPage />
      </AuthProvider>
    </QueryClientProvider>
  )
}
