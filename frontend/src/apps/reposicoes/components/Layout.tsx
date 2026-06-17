import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Package, LayoutDashboard, History, BarChart2, Layers, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-slate-600 hover:bg-slate-100'
    }`

  const navLinks = (
    <>
      <NavLink to="/vendas" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        <Package size={16} />
        Vendas
      </NavLink>
      <NavLink to="/lotes" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        <Layers size={16} />
        Lotes por Artigo
      </NavLink>
      {user?.role === 'gestor' && (
        <>
          <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
          <NavLink to="/historico" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <History size={16} />
            Histórico
          </NavLink>
          <NavLink to="/dashboard-historico" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <BarChart2 size={16} />
            Dashboard Histórico
          </NavLink>
        </>
      )}
    </>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-brand-700 shrink-0">
            <Package size={22} />
            <span className="hidden sm:inline">ZAPP Reposições</span>
            <span className="sm:hidden">ZAPP</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks}
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
            {navLinks}
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
