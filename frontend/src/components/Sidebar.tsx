interface App {
  id: string
  name: string
  description: string
  icon: string
  color: string
  disabled?: boolean
  coming_soon?: boolean
}

interface SidebarProps {
  apps: App[]
  currentApp: string
  onAppChange: (appId: string) => void
}

function Sidebar({ apps, currentApp, onAppChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Quadro de Bordo</h1>
        <p>Clássico Desportivo</p>
      </div>

      <nav className="sidebar-nav">
        <h2>Aplicações</h2>
        <ul>
          {apps.map(app => (
            <li key={app.id}>
              <button
                className={`app-button ${currentApp === app.id ? 'active' : ''} ${app.disabled ? 'disabled' : ''}`}
                onClick={() => !app.disabled && onAppChange(app.id)}
                disabled={app.disabled}
                title={app.description}
              >
                <span className="app-icon" style={{ color: app.color }}>📱</span>
                <span className="app-name">{app.name}</span>
                {app.coming_soon && <span className="coming-soon">Em breve</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
