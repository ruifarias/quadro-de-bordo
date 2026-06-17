import { useState, type ReactNode } from 'react'
import { Package, LayoutDashboard, History, BarChart2, Layers, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../AuthContext'

interface NavLink {
  id: string
  label: string
  icon: React.ReactNode
  requiresGestor?: boolean
}

interface LayoutProps {
  children: ReactNode
  onNavigate: (page: string) => void
  currentPage: string
}

export default function Layout({ children, onNavigate, currentPage }: LayoutProps) {
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    signOut()
  }

  const navLinks: NavLink[] = [
    { id: 'vendas', label: 'Vendas', icon: <Package size={16} /> },
    { id: 'lotes', label: 'Lotes por Artigo', icon: <Layers size={16} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, requiresGestor: true },
    { id: 'historico', label: 'Histórico', icon: <History size={16} />, requiresGestor: true },
    { id: 'dashboard-historico', label: 'Dashboard Histórico', icon: <BarChart2 size={16} />, requiresGestor: true },
  ]

  const navLinkClass = (id: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      currentPage === id
        ? 'bg-brand-600 text-white'
        : 'text-slate-600 hover:bg-slate-100'
    }`

  const filteredLinks = navLinks.filter(link => !link.requiresGestor || user?.role === 'gestor')

  const renderNavLinks = () => (
    <>
      {filteredLinks.map(link => (
        <button
          key={link.id}
          onClick={() => {
            onNavigate(link.id)
            setMobileOpen(false)
          }}
          className={navLinkClass(link.id)}
        >
          {link.icon}
          {link.label}
        </button>
      ))}
    </>
  )

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-brand-700 shrink-0">
            <Package size={22} />
            <span className="hidden sm:inline">ZAPP Reposições</span>
            <span className="sm:hidden">ZAPP</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {renderNavLinks()}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium text-slate-800">{user?.nome}</span>
              <span className="text-xs text-slate-400 capitalize">{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="btn-secondary px-2 py-1.5 text-xs hidden md:flex">
              <LogOut size={14} />
              Sair
            </button>
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
            {renderNavLinks()}
            <hr className="my-2 border-slate-100" />
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-600">
                {user?.nome} <span className="text-slate-400 text-xs">({user?.role})</span>
              </span>
              <button onClick={handleLogout} className="btn-secondary px-3 py-1.5 text-xs">
                <LogOut size={14} />
                Sair
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 mt-14 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
