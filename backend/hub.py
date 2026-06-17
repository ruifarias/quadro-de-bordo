"""
Quadro de Bordo - Hub Central
Integra múltiplas aplicações ZAPP
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys

# Adicionar backend ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importar routers das apps com tratamento de erro
try:
    from apps.reposicoes import router as reposicoes_router
    print("[OK] Router reposicoes carregado")
except Exception as e:
    print(f"[ERRO] Router reposicoes: {e}")
    reposicoes_router = None

try:
    from apps.extracto import router as extracto_router
    print("[OK] Router extracto carregado")
except Exception as e:
    print(f"[ERRO] Router extracto: {e}")
    extracto_router = None

try:
    from apps.valores_em_divida import router as valores_router
    print("[OK] Router valores carregado")
except Exception as e:
    print(f"[ERRO] Router valores: {e}")
    valores_router = None

try:
    from apps.planeamento_pagamentos import router as planeamento_router
    print("[OK] Router planeamento carregado")
except Exception as e:
    print(f"[ERRO] Router planeamento: {e}")
    planeamento_router = None

app = FastAPI(title="Quadro de Bordo", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registar routers das apps
if reposicoes_router:
    app.include_router(reposicoes_router, prefix="/api/reposicoes", tags=["reposicoes"])
if extracto_router:
    app.include_router(extracto_router, prefix="/api/extracto", tags=["extracto"])
if valores_router:
    app.include_router(valores_router, prefix="/api/valores", tags=["valores"])
if planeamento_router:
    app.include_router(planeamento_router, prefix="/api/planeamento", tags=["planeamento"])

# ---------------------------------------------------------------------------
# Aplicações Registry
# ---------------------------------------------------------------------------

@app.get("/api/apps")
def get_apps():
    """Retorna a lista de aplicações disponíveis no Quadro de Bordo."""
    return {
        "apps": [
            {
                "id": "extracto-fornecedor",
                "name": "Extracto Fornecedor",
                "description": "Consultar extractos de contas correntes de fornecedores",
                "icon": "FileText",
                "color": "#3b82f6"
            },
            {
                "id": "valores-em-divida",
                "name": "Valores em Dívida",
                "description": "Documentos em aberto de fornecedores",
                "icon": "AlertCircle",
                "color": "#ef4444"
            },
            {
                "id": "planeamento-pagamentos",
                "name": "Planeamento de Pagamentos",
                "description": "Gestão de pagamentos a fornecedores",
                "icon": "Calendar",
                "color": "#8b5cf6"
            },
            {
                "id": "reposicoes",
                "name": "Reposições",
                "description": "Gestão de reposição de artigos",
                "icon": "Package",
                "color": "#10b981"
            }
        ]
    }

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok"}

# ---------------------------------------------------------------------------
# Servir frontend compilado (produção)
# ---------------------------------------------------------------------------

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    _index = os.path.join(FRONTEND_DIST, "index.html")

    @app.get("/", include_in_schema=False)
    def serve_root():
        return FileResponse(_index)

    @app.get("/favicon.ico", include_in_schema=False)
    def favicon():
        f = os.path.join(FRONTEND_DIST, "vite.svg")
        return FileResponse(f, media_type="image/svg+xml") if os.path.exists(f) else FileResponse(_index)

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        return FileResponse(_index)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
