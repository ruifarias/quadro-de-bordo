from fastapi import APIRouter
import sys
import os
from pathlib import Path

script_dir = Path(__file__).parent.parent.parent.parent
zapp_path = str(script_dir / 'zapp_planeamento_pagamentos' / 'backend')

if zapp_path not in sys.path:
    sys.path.insert(0, zapp_path)

try:
    import db
except ImportError as e:
    print(f"Erro ao importar db. Tentando de {zapp_path}")
    raise

router = APIRouter()

@router.get("/lista")
async def get_pagamentos_lista():
    data = db.get_resumo_pagamentos()
    return data

@router.get("/resumo")
async def get_pagamentos_resumo():
    data = db.get_resumo_pagamentos()
    totais = data["totais_semanas"]
    wednesdays = data["wednesdays"]

    total_geral = sum(totais.values())
    num_fornecedores = len(data["pagamentos"])

    return {
        "total_geral": total_geral,
        "num_fornecedores": num_fornecedores,
        "totais_semanas": totais,
        "wednesdays": wednesdays
    }
