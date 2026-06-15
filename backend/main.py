from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import datetime, date
from pydantic import BaseModel
from typing import Optional, List
import sys
import os

# Add parent directory to path for app imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="Quadro de Bordo - Clássico Desportivo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/api/health")
def health():
    return {"status": "ok"}

# App registry endpoint
@app.get("/api/apps")
def get_apps():
    """Return list of available applications"""
    return {
        "apps": [
            {
                "id": "extracto-fornecedor",
                "name": "Extracto Fornecedor",
                "description": "Consultar extractos de conta corrente de fornecedores",
                "icon": "receipt",
                "color": "#646cff"
            },
            {
                "id": "valores-em-divida",
                "name": "Valores em Divida",
                "description": "Visualizar documentos em aberto de fornecedores",
                "icon": "trending_up",
                "color": "#f57c00"
            },
            {
                "id": "reposicoes",
                "name": "Reposições",
                "description": "Gestão de reposições",
                "icon": "inventory",
                "color": "#4caf50",
                "disabled": True,
                "coming_soon": True
            }
        ]
    }

# Import app-specific routers
from apps.extracto import router as extracto_router
from apps.valores_em_divida import router as valores_router

# Include app routers
app.include_router(extracto_router, prefix="/api/extracto", tags=["Extracto Fornecedor"])
app.include_router(valores_router, prefix="/api/valores", tags=["Valores em Divida"])

# Serve static files from frontend build
frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
if os.path.exists(frontend_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, 'assets')), name="assets")

@app.get("/")
async def serve_root():
    """Serve index.html for SPA"""
    index_file = os.path.join(frontend_dir, 'index.html')
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"error": "Frontend not built"}

@app.get("/{path_name:path}")
async def serve_spa(path_name: str):
    """Serve index.html for all non-API routes (SPA routing)"""
    if path_name.startswith('api/'):
        return {"error": "Not found"}

    index_file = os.path.join(frontend_dir, 'index.html')
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"error": "Frontend not built"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
