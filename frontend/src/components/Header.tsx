interface HeaderProps {
  appName: string
}

function Header({ appName }: HeaderProps) {
  return (
    <header className="header">
      <h2>{appName}</h2>
      <div className="header-info">
        <span className="date">{new Date().toLocaleDateString('pt-PT')}</span>
      </div>
    </header>
  )
}

export default Header
