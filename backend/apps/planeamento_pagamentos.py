from fastapi import APIRouter
import sys
import os

zapp_path = os.path.join(os.path.dirname(__file__), '..', '..', 'zapp_planeamento_pagamentos', 'backend')
sys.path.insert(0, zapp_path)

import db

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
