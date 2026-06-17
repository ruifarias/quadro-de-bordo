import { useAuth } from '../AuthContext'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  requiredRole?: 'gestor' | 'vendedor'
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user } = useAuth()

  if (!user) return <div>Não autenticado</div>
  if (requiredRole && user.role !== requiredRole) return <div>Acesso negado</div>

  return <>{children}</>
}
