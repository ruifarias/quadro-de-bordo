# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral

**Quadro de Bordo - Clássico Desportivo** é um dashboard centralizador que integra múltiplas aplicações especializadas sob uma interface unificada. O objetivo é fornecer um hub de navegação onde diferentes ferramentas e sistemas podem coexistir como módulos plugáveis.

**Arquitetura:**
- Backend centralizado (FastAPI) que roteia requisições para diferentes módulos de aplicação
- Frontend unificado (React + Vite) com sistema de navegação lateral para alternar entre apps
- Cada aplicação é uma sub-aplicação modular (`frontend/src/apps/<app-name>/`)
- Compartilhamento de backend de aplicações existentes via import direto dos módulos Python

## Stack Tecnológico

- **Backend**: Python + FastAPI
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: SQL Server (ODBC, herdado das aplicações integradas)
- **Servidor**: Uvicorn (backend), Vite Dev Server (frontend)

## Estrutura do Projecto

```
quadro-de-bordo/
├── backend/
│   ├── main.py                    # FastAPI app central com routing
│   ├── apps/
│   │   ├── __init__.py
│   │   ├── extracto.py            # Router para Extracto Fornecedor
│   │   └── reposicoes.py          # (Futuro) Router para Reposições
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Componente principal (Dashboard Hub)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx        # Navegação de aplicações
│   │   │   └── Header.tsx         # Cabeçalho com app atual
│   │   ├── apps/                  # Sub-aplicações embebidas
│   │   │   └── extracto-fornecedor/
│   │   │       └── App.tsx        # Componente Extracto (modularizado)
│   │   ├── styles/
│   │   │   ├── index.css          # Estilos globais
│   │   │   └── App.css            # Estilos do dashboard
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tsconfig.node.json
├── CLAUDE.md                       # Este ficheiro
└── README.md
```

## Desenvolvimento

### Setup Inicial

```bash
# Backend
python -m venv venv
venv\Scripts\activate
cd backend && pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Executar em Desenvolvimento

```bash
# Terminal 1 - Backend
python -m quadro_de_bordo.backend.main
# Ou simplesmente: python backend/main.py
# Porta: 8003

# Terminal 2 - Frontend
cd frontend && npm run dev
# Porta: 5173
```

Acede em `http://localhost:5173`

### Build Produção

```bash
cd frontend
npm run build
# Outputs para frontend/dist
```

## Arquitetura de Aplicações

### Como Adicionar Uma Nova Aplicação

1. **Backend Router** (`backend/apps/<app-name>.py`):
   - Criar um router FastAPI com os endpoints específicos
   - Importar no `backend/main.py` e registar com `app.include_router()`
   - Exemplo:
     ```python
     from fastapi import APIRouter
     router = APIRouter()
     
     @router.get("/status")
     def get_status():
         return {"status": "ok"}
     ```

2. **Frontend Module** (`frontend/src/apps/<app-name>/App.tsx`):
   - Criar componente React auto-contido
   - Pode chamar endpoints via `/api/<app-name>/...`
   - Exemplo:
     ```tsx
     function MyApp() {
       const [data, setData] = useState(null)
       useEffect(() => {
         axios.get('/api/myapp/data').then(r => setData(r.data))
       }, [])
       return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>
     }
     ```

3. **Registar em `App.tsx`**:
   - Adicionar ao switch statement de `renderApp()`
   - Exemplo:
     ```tsx
     case 'myapp':
       return <MyApp />
     ```

4. **Registar no Registry (`backend/main.py`)**:
   - Adicionar à resposta de `/api/apps`
   ```python
   {
     "id": "myapp",
     "name": "Minha App",
     "description": "...",
     "icon": "...",
     "color": "#..."
   }
   ```

### Aplicação Atual: Extracto Fornecedor

- **Backend**: Proxies para `../zapp-extracto-fornecedor/backend/db.py`
- **Frontend**: `frontend/src/apps/extracto-fornecedor/App.tsx` (versão simplificada em transição)
- **Objetivo futuro**: Modularizar completamente o zapp-extracto-fornecedor para reutilização sem caminhos absolutos

## Portas

- Backend: 8003 (Quadro de Bordo hub) — **porta fixa**
- Frontend (dev): 5173

Nota: O registo central de portas de todos os projectos está em `PORTAS.md` (na raiz dos Projectos Visual Studio).

## Integração com Aplicações Existentes

### zapp-extracto-fornecedor

A aplicação legada é integrada através de:
1. Import direto do módulo `db.py` desde o path relativo
2. Router `backend/apps/extracto.py` que expõe os endpoints
3. Componente React simplificado que chama estes endpoints

**Caminho de migração:**
- Modularizar componentes React do zapp-extracto-fornecedor
- Remover dependências de caminhos absolutos
- Converter em standalone npm package ou módulo reutilizável
- Importar no Quadro de Bordo como dependency clara

## Convenções

- **Routers de App**: Cada `apps/<name>.py` exporta um `router` FastAPI
- **Componentes de App**: Cada `apps/<name>/App.tsx` é um componente React auto-contido
- **API Paths**: `/api/<app-name>/...` para endpoints da aplicação
- **Styling**: CSS global em `styles/index.css`, layout do hub em `styles/App.css`, apps com CSS local se necessário

## Notas Importantes

- O dashboard usa um sistema de registry dinâmico (`/api/apps`) para descobrir aplicações disponíveis
- Aplicações podem ser marcadas como `"disabled": true` ou `"coming_soon": true` sem remover o código
- CORS está habilitado para facilitar desenvolvimento local
- Vite faz proxy de `/api/*` para o backend automaticamente em dev
