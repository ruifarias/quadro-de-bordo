from fastapi import APIRouter
import sys
import os
import importlib.util

# Import valores_em_divida database module dynamically
valores_db_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'zapp_valores_em_divida', 'backend', 'db.py'))
spec = importlib.util.spec_from_file_location("db_valores", valores_db_path)
db = importlib.util.module_from_spec(spec)
spec.loader.exec_module(db)

router = APIRouter()

@router.get("/lista")
def get_valores_em_divida():
    """Obter totais de documentos em aberto por fornecedor"""
    try:
        valores = db.get_valores_em_divida()
        return {"valores": valores}
    except Exception as e:
        return {"error": str(e)}

@router.get("/resumo")
def get_resumo():
    """Obter totais agregados de todos os fornecedores"""
    try:
        resumo = db.get_resumo_totais()
        return resumo
    except Exception as e:
        return {"error": str(e)}
