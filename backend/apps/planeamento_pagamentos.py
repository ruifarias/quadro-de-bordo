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
    """Retorna lista completa de pagamentos organizados por semana"""
    data = db.get_resumo_pagamentos()

    # Separar fornecedores por tipo
    codigosDebitoDirecto = ['0243', '0303', '0308', '1009', '1028', '1035', '1114']

    pagamentos = data["pagamentos"]

    fornecedoresTransferenciaComDivida = {}
    fornecedoresTransferenciaComCredito = {}
    fornecedoresDebito = {}

    for codigo, dados in pagamentos.items():
        ulticos4 = codigo.split(".")[-1]
        total_divida = dados.get("total_divida", 0)

        if ulticos4 in codigosDebitoDirecto:
            fornecedoresDebito[codigo] = dados
        elif total_divida >= 0:
            fornecedoresTransferenciaComDivida[codigo] = dados
        else:
            fornecedoresTransferenciaComCredito[codigo] = dados

    return {
        "pagamentos": pagamentos,
        "fornecedoresTransferenciaComDivida": fornecedoresTransferenciaComDivida,
        "fornecedoresDebito": fornecedoresDebito,
        "fornecedoresTransferenciaComCredito": fornecedoresTransferenciaComCredito,
        "totais_semanas": data["totais_semanas"],
        "wednesdays": data["wednesdays"],
        "semanas": data.get("semanas", []),
        "total_vencido": data.get("total_vencido", 0)
    }

@router.get("/resumo")
async def get_pagamentos_resumo():
    """Retorna resumo dos pagamentos com totais"""
    data = db.get_resumo_pagamentos()
    totais = data["totais_semanas"]

    total_geral = sum(totais.values())
    total_vencido = data.get("total_vencido", 0)
    num_fornecedores = len(data["pagamentos"])

    return {
        "total_geral": total_geral,
        "total_vencido": total_vencido,
        "num_fornecedores": num_fornecedores,
        "totais_semanas": totais,
        "wednesdays": data.get("wednesdays", []),
        "semanas": data.get("semanas", [])
    }

@router.get("/cheques-predatados")
async def get_cheques_predatados():
    """Retorna cheques pré-datados para planeamento"""
    cheques, total_geral = db.get_cheques_predatados_por_semana()

    return {
        "cheques": cheques,
        "total_geral": total_geral
    }
