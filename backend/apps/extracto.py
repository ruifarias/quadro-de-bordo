from fastapi import APIRouter
from datetime import date, datetime as dt
from pydantic import BaseModel
from typing import Optional, List
import sys
import os
import importlib.util

# Import extracto-fornecedor database module dynamically
extracto_db_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'zapp-extracto-fornecedor', 'backend', 'db.py'))
spec = importlib.util.spec_from_file_location("db", extracto_db_path)
db = importlib.util.module_from_spec(spec)
spec.loader.exec_module(db)

router = APIRouter()

class ExtractoRequest(BaseModel):
    ano: int
    codigo_conta: str
    data_inicio: date
    data_fim: date

@router.get("/contas")
def get_contas(ano: Optional[int] = None):
    """Obter lista de contas disponíveis"""
    try:
        contas = db.get_contas_disponiveis(ano)
        return {"contas": contas}
    except Exception as e:
        return {"error": str(e)}

@router.post("/extracto")
def get_extracto(request: ExtractoRequest):
    """Gerar extracto de conta corrente"""
    try:
        # Obter saldo inicial
        saldo_inicial = db.get_saldo_inicial(request.ano, request.codigo_conta)

        # Obter movimentos de contabilidade
        movimentos = db.get_movimentos_contabilidade(
            request.ano,
            request.codigo_conta,
            request.data_inicio,
            request.data_fim
        )

        # Filtrar movimentos por data
        data_inicio_dt = dt.fromisoformat(str(request.data_inicio))
        data_fim_dt = dt.fromisoformat(str(request.data_fim))

        movimentos_filtrados = []
        for movimento in movimentos:
            data_movimento = movimento.get("data_hora")
            if isinstance(data_movimento, str):
                data_movimento = dt.fromisoformat(data_movimento[:10])
            if data_inicio_dt <= data_movimento <= data_fim_dt:
                movimentos_filtrados.append(movimento)

        movimentos = movimentos_filtrados

        # Inicializar saldo acumulado
        saldo_acum = saldo_inicial["abertura_debito"] - saldo_inicial["abertura_credito"] if saldo_inicial else 0.0

        # Extrair código de entidade (fornecedor) dos últimos 4 dígitos da conta
        codigo_entidade = request.codigo_conta.split(".")[-1] if "." in request.codigo_conta else request.codigo_conta[-4:]

        # Step 1: Build base list (saldo_inicial + movements only, no docs)
        extracto_base = []
        if saldo_inicial:
            data_saldo = f"{request.ano}-01-01"
            extracto_base.append({
                "tipo": "saldo_inicial",
                "data_hora": data_saldo,
                "descricao": "Saldo Inicial",
                "abertura_debito": saldo_inicial["abertura_debito"],
                "abertura_credito": saldo_inicial["abertura_credito"],
                "saldo_acumulado": saldo_acum
            })

        for movimento in movimentos:
            extracto_base.append(movimento)

        # Step 2: Convert datetime objects and sort
        for item in extracto_base:
            if isinstance(item.get("data_hora"), dt):
                item["data_hora"] = item["data_hora"].isoformat()

        extracto_base.sort(key=lambda x: x["data_hora"])

        # Step 3: Final pass — calculate balance + insert docs after each payment
        extracto_completo = []
        for item in extracto_base:
            if item["tipo"] == "saldo_inicial":
                extracto_completo.append(item)
                continue

            # Update running balance (movements only)
            if item["tipo_movimento"] == "D":
                saldo_acum += item["valor"]
            else:
                saldo_acum -= item["valor"]
            item["saldo_acumulado"] = saldo_acum
            extracto_completo.append(item)

            # If payment (diário 05, código 5701), append sub-document lines
            if str(item.get("codigo_diario")) == "05" and int(item.get("codigo_documento") or 0) == 5701:
                numero_pagamento = item.get("numero_documento", "")
                if numero_pagamento:
                    try:
                        # Extract numeric part from payment number (e.g. 'PG4706' -> 4706)
                        numero_pagamento_num = int(''.join(filter(str.isdigit, numero_pagamento)))
                        documentos = db.get_documentos_pagamento(
                            request.ano,
                            numero_pagamento_num,
                            codigo_entidade
                        )
                        for doc in documentos:
                            numero_doc = doc.get("numero_documento", "")
                            descricao = doc.get('descricao_doc_regul', '')
                            codigo_doc = doc.get("codigo_documento", "")
                            valor = doc.get("valor_abatido", 0.0)
                            liquidacao = doc.get("liquidacao", "")
                            # Credit notes (3502) are shown as negative
                            if str(codigo_doc) == "3502":
                                valor = -valor
                            extracto_completo.append({
                                "tipo": "documento_pagamento",
                                "data_hora": item["data_hora"],
                                "descricao": f"  └─ {descricao} {numero_doc}" if numero_doc else f"  └─ {descricao}",
                                "numero_documento": numero_doc,
                                "valor": valor,
                                "tipo_movimento": "D",
                                "codigo_documento": codigo_doc,
                                "liquidacao": liquidacao,
                                "saldo_acumulado": 0.0
                            })
                    except Exception as e:
                        print(f"Erro ao buscar documentos de pagamento: {e}")

        # Add final balance line
        extracto_completo.append({
            "tipo": "saldo_final",
            "data_hora": "",
            "descricao": "Saldo Final",
            "saldo_acumulado": saldo_acum,
            "saldo_actual_db": saldo_inicial.get("saldo_actual", 0.0) if saldo_inicial else 0.0
        })

        # Get pending documents to be regularized
        documentos_por_regularizar = db.get_documentos_por_regularizar(
            request.ano,
            request.codigo_conta
        )

        # Marcar documentos por regularizar no extracto
        numeros_por_regularizar = set(str(doc.get("numero_documento", "")).strip() for doc in documentos_por_regularizar if doc.get("numero_documento"))

        for item in extracto_completo:
            if item.get("tipo") == "movimento":
                numero_doc = str(item.get("numero_documento", "")).strip() if item.get("numero_documento") else ""
                if numero_doc in numeros_por_regularizar:
                    item["por_regularizar"] = True

        return {
            "saldo_inicial": saldo_inicial,
            "extracto_completo": extracto_completo,
            "documentos_por_regularizar": documentos_por_regularizar
        }
    except Exception as e:
        return {"error": str(e)}
