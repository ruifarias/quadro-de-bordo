# Deployment - Quadro de Bordo

## Accesso em Rede

A aplicação está pronta para funcionar em rede. Aceda a partir de qualquer computador:

```
http://<IP_DO_SERVIDOR>:8003
```

Substituir `<IP_DO_SERVIDOR>` pelo IP ou hostname do computador onde o backend está a correr.

**Exemplo**: `http://192.168.1.100:8003` ou `http://servidor-classico:8003`

---

## Iniciar em Produção

### Opção 1: Script PowerShell (Recomendado para Windows)

Criar ficheiro `iniciar-quadro-de-bordo.ps1`:

```powershell
cd "c:\Users\ruifarias\Documents\Projectos Visual Studio\quadro-de-bordo"
python -m backend.main
```

Executar:
```powershell
powershell -ExecutionPolicy Bypass -File iniciar-quadro-de-bordo.ps1
```

### Opção 2: Command Prompt

```cmd
cd "c:\Users\ruifarias\Documents\Projectos Visual Studio\quadro-de-bordo"
python -m backend.main
```

### Opção 3: Task Scheduler (Para iniciar automaticamente)

1. Abrir Task Scheduler
2. Create Basic Task
3. **Trigger**: At startup
4. **Action**: 
   - Program: `C:\path\to\python.exe`
   - Arguments: `-m backend.main`
   - Start in: `C:\Users\ruifarias\Documents\Projectos Visual Studio\quadro-de-bordo`

---

## Portas Utilizadas

- **Quadro de Bordo**: `8003` (frontend + APIs) — **porta fixa**
- **zapp-reposições**: `8001`
- **zapp-extracto-fornecedor** (standalone): `8002`
- **zapp-valores-em-divida**: `8004`
- **zapp-planeamento-pagamentos**: `8005`

Registo central de portas: ver `PORTAS.md` na raiz dos Projectos Visual Studio.

---

## Estrutura de Build

Pré-compilado e pronto:

```
quadro-de-bordo/
├── backend/
│   ├── main.py          ← Inicia na porta 8003
│   ├── apps/
│   │   └── extracto.py  ← Roteia para zapp-extracto-fornecedor
│   └── requirements.txt
└── frontend/
    └── dist/            ← Build otimizado, servido automaticamente
        ├── index.html
        ├── assets/
        │   ├── *.css
        │   └── *.js
```

---

## Funcionalidades Incluídas

✅ **Quadro de Bordo (Dashboard)**
- Navegação lateral para múltiplas aplicações
- Sistema de registry dinâmico

✅ **Extracto Fornecedor**
- Consultar extractos de conta corrente
- Exportação para PDF com:
  - Margens de 2cm entre páginas
  - Numeração de páginas ("X/Y")
  - Documentos por regularizar destacados
  - Sem repetição de linhas entre páginas

---

## Troubleshooting

### Porta 8003 já em uso

Matar o processo:

```powershell
Get-NetTCPConnection -LocalPort 8003 -ErrorAction SilentlyContinue | 
ForEach-Object { Get-Process -Id $_.OwningProcess } | 
Stop-Process -Force
```

### Frontend não carrega

Verificar se `frontend/dist/` existe:
```powershell
ls frontend/dist
```

Se não existir, compilar:
```powershell
cd frontend
npm run build
```

### Erro de conexão à base de dados

Verificar:
1. Servidor SQL Server está online
2. Credenciais Windows Authentication corretas
3. ODBC Driver 18 for SQL Server instalado

---

## Performance em Rede

A aplicação está otimizada para rede:
- Frontend compilado e minificado (gzip)
- Assets servidos com cache headers
- APIs sem CORS restritivo (desenvolvimento)

**Para produção** (adicionar em `main.py`):
```python
# Remover ou restringir CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seu-dominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Logs

O backend output em console mostra:
- Solicitações HTTP
- Erros de API
- Conexão à BD

Para logs persistentes, executar com redirecionamento:

```powershell
python -m backend.main > logs.txt 2>&1
```

---

## Próximos Passos

1. **SSL/HTTPS**: Configurar certificado se acesso via internet
2. **Autenticação**: Adicionar login de utilizadores
3. **Monitoring**: Prometheus/Grafana para métricas
4. **Backup**: Automatizar backup da BD
