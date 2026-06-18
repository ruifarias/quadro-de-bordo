"""
ZAPP Reposições — Backend FastAPI
Empresa: 0001 | Base de dados: DBClassico | Servidor: TSERVER\SQLSERVER
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError
from typing import Optional
import pyodbc
import base64
import os
import sys
import jwt
import datetime
from dateutil import parser as dateutil_parser
import logging
import importlib.util

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Dynamic import for apps to work with both 'python main.py' and 'python -m backend.main'
_backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _backend_dir)
spec = importlib.util.spec_from_file_location("apps.extracto", os.path.join(_backend_dir, "apps", "extracto.py"))
extracto_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extracto_module)
extracto_router = extracto_module.router

spec = importlib.util.spec_from_file_location("apps.valores_em_divida", os.path.join(_backend_dir, "apps", "valores_em_divida.py"))
valores_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(valores_module)
valores_router = valores_module.router

spec = importlib.util.spec_from_file_location("apps.planeamento_pagamentos", os.path.join(_backend_dir, "apps", "planeamento_pagamentos.py"))
planeamento_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(planeamento_module)
planeamento_router = planeamento_module.router

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

DB_SERVER   = "TSERVER\SQLSERVER"
DB_NAME     = "DBClassico"
DB_DRIVER   = "ODBC Driver 18 for SQL Server"
DB_USER     = "GIWINDOWS"                  # alterar conforme necessário
DB_PASSWORD = "GIWINDOWS"      # alterar conforme necessário

JWT_SECRET  = "rsfrsfrsf"
JWT_EXPIRY_HOURS = 8

CONN_STR = (
    f"DRIVER={{{DB_DRIVER}}};"
    f"SERVER={DB_SERVER};"
    f"DATABASE={DB_NAME};"
    f"UID={DB_USER};"
    f"PWD={DB_PASSWORD};"
    f"TrustServerCertificate=yes;"
)

# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------

app = FastAPI(title="ZAPP Reposições", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # em produção, limitar ao domínio do frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registar routers das apps
app.include_router(extracto_router, prefix="/api/extracto")
app.include_router(valores_router, prefix="/api/valores-em-divida")
app.include_router(planeamento_router, prefix="/api/planeamento")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

security = HTTPBearer()

# ---------------------------------------------------------------------------
# Utilizadores (em produção, guardar na base de dados com hash bcrypt)
# ---------------------------------------------------------------------------

USERS = {
    "gestor":   {"password": "cd",   "role": "gestor",   "nome": "Rui Farias"},
       "Judite":{"password": "cd",      "role": "vendedor", "nome": "Judite Sousa",  "codigo": "0"},  
       "Sónia":{"password": "cd",      "role": "vendedor", "nome": "Sónia Rodrigues",  "codigo": "1"},
       "Alexandra":{"password": "cd",      "role": "vendedor", "nome": "Alexandra Silva",   "codigo": "2"},
       "Rui":{"password": "cd",      "role": "vendedor", "nome": "Rui Farias",   "codigo": "4"},
}

# ---------------------------------------------------------------------------
# Modelos Pydantic
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str

class ReposicaoUpdate(BaseModel):
    observacoes: Optional[str] = None

class ReposicaoCreate(BaseModel):
    codigo_artigo:       str
    codigo_lote:         str
    codigo_entidade:     str
    data_venda:          str
    numero_doc:          int
    codigo_serie:        str
    codigo_documento:    str
    qtd_vendida:         float
    artigo:              Optional[str]   = None
    pr_unit_doc:         Optional[float] = None
    desconto:            Optional[float] = None
    valor_liquido_s_iva: Optional[float] = None
    valor_custo:         Optional[float] = None
    lucro:               Optional[float] = None
    descricao_lote:      Optional[str]   = None
    observacoes:         Optional[str]   = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_conn():
    try:
        return pyodbc.connect(CONN_STR)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro de ligação à base de dados: {str(e)}")


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


def blob_to_base64(blob) -> Optional[str]:
    """Converte BLOB JPEG para string Base64 para enviar ao frontend."""
    if blob is None:
        return None
    try:
        if isinstance(blob, (bytes, bytearray)):
            return base64.b64encode(blob).decode("utf-8")
        return None
    except Exception:
        return None


def ensure_reposicoes_table():
    """Cria a tabela ZAPP_Reposicoes se ainda não existir e adiciona colunas ausentes."""
    create_sql = """
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'ZAPP_Reposicoes'
    )
    BEGIN
        CREATE TABLE DBClassico.dbo.ZAPP_Reposicoes (
            Id                  INT IDENTITY(1,1) PRIMARY KEY,
            Data_Venda          DATETIME       NOT NULL,
            Codigo_Entidade     VARCHAR(50)    NOT NULL,
            Codigo_Artigo       VARCHAR(50)    NOT NULL,
            Artigo              NVARCHAR(255)  NULL,
            Codigo_Lote         VARCHAR(50)    NOT NULL,
            Descricao_Lote      NVARCHAR(255)  NULL,
            Qtd_Vendida         DECIMAL(18,4)  NOT NULL,
            Pr_Unit_Doc         DECIMAL(18,4)  NULL,
            Desconto            DECIMAL(18,4)  NULL,
            Valor_Liquido_S_Iva DECIMAL(18,4)  NULL,
            Valor_Custo         DECIMAL(18,4)  NULL,
            Lucro               DECIMAL(18,4)  NULL,
            Codigo_Serie        VARCHAR(20)    NOT NULL,
            Numero_Doc          INT            NOT NULL,
            Reposto             BIT            NOT NULL DEFAULT 0,
            Data_Reposicao      DATETIME       NULL,
            Observacoes         NVARCHAR(255)  NULL
        )
    END
    """
    new_columns = [
        ("Descricao_Lote",      "NVARCHAR(255) NULL"),
        ("Artigo",              "NVARCHAR(255) NULL"),
        ("Pr_Unit_Doc",         "DECIMAL(18,4) NULL"),
        ("Desconto",            "DECIMAL(18,4) NULL"),
        ("Valor_Liquido_S_Iva", "DECIMAL(18,4) NULL"),
        ("Valor_Custo",         "DECIMAL(18,4) NULL"),
        ("Lucro",               "DECIMAL(18,4) NULL"),
        ("nome_vendedor",       "NVARCHAR(100) NULL"),
        ("preco_liquido",       "DECIMAL(18,4) NULL"),
    ]
    conn = get_conn()
    conn.execute(create_sql)
    for col, definition in new_columns:
        conn.execute(f"""
            IF NOT EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='ZAPP_Reposicoes' AND COLUMN_NAME='{col}'
            )
            BEGIN
                ALTER TABLE DBClassico.dbo.ZAPP_Reposicoes ADD {col} {definition}
            END
        """)
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
def startup():
    ensure_reposicoes_table()

# ---------------------------------------------------------------------------
# Aplicações (Registry)
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
                "id": "lotes-por-artigo",
                "name": "Lotes por Artigo",
                "description": "Consulta de lotes e quantidades disponíveis por artigo",
                "icon": "Package",
                "color": "#06b6d4"
            }
        ]
    }

# ---------------------------------------------------------------------------
# Autenticação
# ---------------------------------------------------------------------------

@app.post("/auth/login")
def login(body: LoginRequest):
    user = USERS.get(body.username)
    if not user or user["password"] != body.password:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    payload = {
        "sub":      body.username,
        "role":     user["role"],
        "nome":     user["nome"],
        "codigo":   user.get("codigo", ""),
        "exp":      datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return {"token": token, "role": user["role"], "nome": user["nome"]}

# ---------------------------------------------------------------------------
# Vendas
# ---------------------------------------------------------------------------

QUERY_VENDAS = """
SELECT
    l.Artigo,
    CASE WHEN CAST(l.Codigo_Documento AS INT) = 4501 THEN l.Qtd * -1 ELSE l.Qtd END AS Qtd_Vendida,
    l.Pr_Unit_Doc,
    l.Desconto,
    l.Valor_Liquido_S_Iva,
    l.Valor_Custo,
    CASE WHEN CAST(l.Codigo_Documento AS INT) = 4501 THEN l.Qtd * (l.Valor_Liquido_S_Iva - l.Valor_Custo) ELSE (l.Valor_Liquido_S_Iva - l.Valor_Custo) END AS Lucro,
    l.Data_hora,
    lm.Codigo_Artigo,
    lm.Codigo_Lote,
    lm.Codigo_Serie,
    lm.Numero_Doc,
    lm.Codigo_Documento,
    lo.Descricao_Lote                                  AS Descricao_Lote,
    la.Qtd_Disponivel                                  AS Qtd_Stock_Lote,
    aq.Existencia                                      AS Qtd_Stock_Artigo,
    c.Codigo_Entidade,
    a.Imagem_Art,
    r.Id                                               AS Reposicao_Id,
    r.Reposto,
    r.Data_Reposicao,
    r.Observacoes,
    CAST(ISNULL(r.preco_liquido, 0) AS FLOAT)         AS Preco_Liquido,
    ISNULL(r.nome_vendedor, '')                       AS nome_vendedor
FROM
    DBClassico.dbo.tb0001StkDocLinhas        l
    JOIN DBClassico.dbo.tb0001StkLotesMov    lm ON  lm.Ano             = l.Ano
                                                AND lm.Codigo_Documento = l.Codigo_Documento
                                                AND lm.Codigo_Serie     = l.Codigo_Serie
                                                AND lm.Numero_Doc       = l.Numero_Doc
                                                AND lm.Codigo_Armazem   = l.Codigo_Armazem
                                                AND lm.Codigo_Artigo    = l.Codigo_Artigo
                                                AND lm.Qtd_Movimentada  = l.Qtd
                                                AND lm.Num_LinhaNoDoc   = l.lock
    JOIN DBClassico.dbo.tb0001StkLotes       lo ON  lo.Codigo_Lote      = lm.Codigo_Lote
                                                AND lo.Codigo_Artigo    = lm.Codigo_Artigo
    JOIN DBClassico.dbo.tb0001StkDocCabecalho c ON  c.Ano               = l.Ano
                                                AND c.Codigo_Documento  = l.Codigo_Documento
                                                AND c.Codigo_Serie      = l.Codigo_Serie
                                                AND c.Numero_Doc        = l.Numero_Doc
    JOIN DBClassico.dbo.tb0001StkArtigos     a  ON  a.Codigo_Artigo     = lm.Codigo_Artigo
    JOIN DBClassico.dbo.tb0001StkLotesAcumul la ON  la.Codigo_Artigo    = a.Codigo_Artigo
                                                AND la.Codigo_Lote      = lo.Codigo_Lote
    JOIN DBClassico.dbo.tb0001StkAcumulQtd   aq ON  aq.Codigo_Artigo    = a.Codigo_Artigo
                                                AND aq.ANO              = YEAR(GETDATE())
    OUTER APPLY (
        SELECT TOP 1 r.Id, r.Reposto, r.Data_Reposicao, r.Observacoes, r.preco_liquido, r.nome_vendedor
        FROM DBClassico.dbo.ZAPP_Reposicoes r
        WHERE r.Codigo_Artigo = lm.Codigo_Artigo
          AND r.Codigo_Lote   = lm.Codigo_Lote
          AND r.Numero_Doc    = lm.Numero_Doc
          AND r.Codigo_Serie  = lm.Codigo_Serie
        ORDER BY r.Id DESC
    ) r
WHERE
    l.Ano               = YEAR(GETDATE())
    AND l.Codigo_Armazem    = '001'
    AND CAST(l.Codigo_Documento AS INT)  IN (4401, 4501)
    AND c.Documento_Terminado = 'S'
    AND CAST(lm.Data AS DATE) = ?
"""


def row_to_dict(row, columns):
    from decimal import Decimal
    d = {}
    for i, col in enumerate(columns):
        val = row[i]
        if col == "Imagem_Art":
            d["imagem_base64"] = blob_to_base64(val)
        elif isinstance(val, datetime.datetime):
            d[col] = val.isoformat()
        elif isinstance(val, bool):
            d[col] = val
        elif isinstance(val, Decimal):
            d[col] = float(val)
        else:
            d[col] = val
    return d


@app.get("/vendas")
def get_vendas(data: Optional[str] = None, user=Depends(verify_token)):
    """
    Retorna vendas de um dia.
    - data: formato YYYY-MM-DD (omitir = hoje)
    - Vendedor só vê as suas próprias vendas.
    """
    if data is None:
        data = datetime.date.today().isoformat()

    conn   = get_conn()
    cursor = conn.cursor()

    query = QUERY_VENDAS
    params = [data]

    if user["role"] == "vendedor":
        query += " AND c.Codigo_Entidade = ?"
        params.append(user["codigo"])

    query += " ORDER BY l.Data_hora DESC"

    cursor.execute(query, params)
    columns = [col[0] for col in cursor.description]

    seen = set()
    rows = []
    for r in cursor.fetchall():
        key = (r[columns.index('Codigo_Artigo')], r[columns.index('Codigo_Lote')],
               r[columns.index('Numero_Doc')],    r[columns.index('Codigo_Serie')])
        if key not in seen:
            seen.add(key)
            row = row_to_dict(r, columns)
            codigo_doc_raw = r[columns.index('Codigo_Documento')]
            codigo_doc = int(codigo_doc_raw) if codigo_doc_raw else 0

            rows.append(row)

    codigo_to_nome = {u["codigo"]: u["nome"] for u in USERS.values() if "codigo" in u}
    conn.close()

    for row in rows:
        valor_liq = float(row.get('Valor_Liquido_S_Iva') or 0)
        valor_custo = float(row.get('Valor_Custo') or 0)
        codigo_doc = row.get('Codigo_Documento')

        if codigo_doc == '4501':
            qtd = float(row.get('Qtd_Vendida') or 0)
            row['Lucro'] = qtd * (valor_liq - valor_custo)
        else:
            row['Lucro'] = valor_liq - valor_custo

        # Marcar documentos 4501 como TROCA
        if codigo_doc == '4501':
            row['Observacoes'] = 'TROCA'

        # Preencher preco_liquido dinamicamente se estiver vazio
        if not row.get('Preco_Liquido') or row.get('Preco_Liquido') == 0:
            row['Preco_Liquido'] = valor_liq * 1.23

        # Preencher nome_vendedor dinamicamente se estiver vazio
        if not row.get('nome_vendedor'):
            codigo_entidade = str(row.get('Codigo_Entidade', ''))
            row['nome_vendedor'] = codigo_to_nome.get(codigo_entidade, '')

    return {"data": data, "total": len(rows), "vendas": rows}


# ---------------------------------------------------------------------------
# Dashboard (gestor)
# ---------------------------------------------------------------------------

@app.get("/dashboard")
def get_dashboard(data: Optional[str] = None, user=Depends(verify_token)):
    """Métricas resumo para o gestor."""
    if user["role"] != "gestor":
        raise HTTPException(status_code=403, detail="Acesso reservado ao gestor")

    if data is None:
        data = datetime.date.today().isoformat()

    conn   = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            COUNT(*)                                        AS Total_Vendas,
            SUM(CASE WHEN r.Reposto = 1 THEN 1 ELSE 0 END) AS Repostos,
            SUM(CASE WHEN r.Reposto = 0 OR r.Id IS NULL THEN 1 ELSE 0 END) AS Pendentes,
            SUM(CASE WHEN CAST(l.Codigo_Documento AS INT) = 4401 THEN l.Valor_Liquido_S_Iva ELSE -l.Valor_Liquido_S_Iva END) AS Valor_Total,
            SUM(CASE WHEN CAST(l.Codigo_Documento AS INT) = 4401 THEN (l.Valor_Liquido_S_Iva - l.Valor_Custo) ELSE -(l.Valor_Liquido_S_Iva - l.Valor_Custo) END) AS Lucro_Total
        FROM DBClassico.dbo.tb0001StkDocLinhas l
        JOIN DBClassico.dbo.tb0001StkLotesMov  lm ON lm.Ano=l.Ano
            AND lm.Codigo_Documento=l.Codigo_Documento
            AND lm.Codigo_Serie=l.Codigo_Serie
            AND lm.Numero_Doc=l.Numero_Doc
            AND lm.Codigo_Armazem=l.Codigo_Armazem
            AND lm.Codigo_Artigo=l.Codigo_Artigo
            AND lm.Qtd_Movimentada=l.Qtd
            AND lm.Num_LinhaNoDoc=l.lock
        JOIN DBClassico.dbo.tb0001StkDocCabecalho c ON c.Ano=l.Ano
            AND c.Codigo_Documento=l.Codigo_Documento
            AND c.Codigo_Serie=l.Codigo_Serie
            AND c.Numero_Doc=l.Numero_Doc
        LEFT JOIN DBClassico.dbo.ZAPP_Reposicoes r ON r.Codigo_Artigo=lm.Codigo_Artigo
            AND r.Codigo_Lote=lm.Codigo_Lote
            AND r.Numero_Doc=lm.Numero_Doc
            AND r.Codigo_Serie=lm.Codigo_Serie
        WHERE l.Ano=YEAR(GETDATE())
            AND l.Codigo_Armazem='001'
            AND CAST(l.Codigo_Documento AS INT) IN (4401, 4501)
            AND CAST(lm.Data AS DATE) = ?
    """, [data])

    row = cursor.fetchone()

    JOINS = """
        FROM DBClassico.dbo.tb0001StkDocLinhas l
        JOIN DBClassico.dbo.tb0001StkLotesMov  lm ON lm.Ano=l.Ano
            AND lm.Codigo_Documento=l.Codigo_Documento
            AND lm.Codigo_Serie=l.Codigo_Serie
            AND lm.Numero_Doc=l.Numero_Doc
            AND lm.Codigo_Armazem=l.Codigo_Armazem
            AND lm.Codigo_Artigo=l.Codigo_Artigo
            AND lm.Qtd_Movimentada=l.Qtd
            AND lm.Num_LinhaNoDoc=l.lock
        JOIN DBClassico.dbo.tb0001StkDocCabecalho c ON c.Ano=l.Ano
            AND c.Codigo_Documento=l.Codigo_Documento
            AND c.Codigo_Serie=l.Codigo_Serie
            AND c.Numero_Doc=l.Numero_Doc
        LEFT JOIN DBClassico.dbo.ZAPP_Reposicoes r ON r.Codigo_Artigo=lm.Codigo_Artigo
            AND r.Codigo_Lote=lm.Codigo_Lote
            AND r.Numero_Doc=lm.Numero_Doc
            AND r.Codigo_Serie=lm.Codigo_Serie
        WHERE l.Ano=YEAR(GETDATE())
            AND l.Codigo_Armazem='001'
            AND CAST(l.Codigo_Documento AS INT) IN (4401, 4501)
            AND CAST(lm.Data AS DATE) = ?
    """

    cursor.execute(f"""
        SELECT
            c.Codigo_Entidade,
            COUNT(*)                                        AS Total_Vendas,
            SUM(CASE WHEN r.Reposto = 1 THEN 1 ELSE 0 END) AS Repostos,
            SUM(CASE WHEN r.Reposto = 0 OR r.Id IS NULL THEN 1 ELSE 0 END) AS Pendentes,
            SUM(CASE WHEN CAST(l.Codigo_Documento AS INT) = 4401 THEN l.Valor_Liquido_S_Iva ELSE -l.Valor_Liquido_S_Iva END) AS Valor_Total,
            SUM(CASE WHEN CAST(l.Codigo_Documento AS INT) = 4401 THEN (l.Valor_Liquido_S_Iva - l.Valor_Custo) ELSE -(l.Valor_Liquido_S_Iva - l.Valor_Custo) END) AS Lucro_Total
        {JOINS}
        GROUP BY c.Codigo_Entidade
        ORDER BY c.Codigo_Entidade ASC
    """, [data])

    codigo_to_nome = {u["codigo"]: u["nome"] for u in USERS.values() if "codigo" in u}
    por_vendedor = [
        {
            "codigo":       r[0],
            "nome":         codigo_to_nome.get(str(r[0]), f"Vendedor {r[0]}"),
            "total_vendas": r[1] or 0,
            "repostos":     r[2] or 0,
            "pendentes":    r[3] or 0,
            "valor_total":  float(r[4] or 0),
            "lucro_total":  float(r[5] or 0),
        }
        for r in cursor.fetchall()
    ]

    conn.close()

    return {
        "data":          data,
        "total_vendas":  row[0] or 0,
        "repostos":      row[1] or 0,
        "pendentes":     row[2] or 0,
        "valor_total":   float(row[3] or 0),
        "lucro_total":   float(row[4] or 0),
        "por_vendedor":  por_vendedor,
    }


@app.get("/dashboard/historico")
def get_dashboard_historico(
    data_inicio: Optional[str] = None,
    data_fim:    Optional[str] = None,
    user=Depends(verify_token)
):
    """Totais de reposições por vendedor num intervalo de datas."""
    if user["role"] != "gestor":
        raise HTTPException(status_code=403, detail="Acesso reservado ao gestor")

    if data_inicio is None:
        data_inicio = (datetime.date.today() - datetime.timedelta(days=30)).isoformat()
    if data_fim is None:
        data_fim = datetime.date.today().isoformat()

    conn   = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            Codigo_Entidade,
            COUNT(*)                                            AS Total,
            SUM(CASE WHEN Reposto = 1 THEN 1 ELSE 0 END)       AS Repostos,
            SUM(CASE WHEN Reposto = 0 THEN 1 ELSE 0 END)       AS Pendentes,
            SUM(ISNULL(Valor_Liquido_S_Iva, 0))                AS Valor_Total,
            SUM(ISNULL(Valor_Custo, 0))                        AS Valor_Custo_Total,
            SUM(ISNULL(Lucro, 0))                              AS Lucro_Total
        FROM DBClassico.dbo.ZAPP_Reposicoes
        WHERE CAST(Data_Venda AS DATE) BETWEEN ? AND ? AND CAST(ISNULL(Codigo_Documento, 0) AS INT) IN (4401, 4501)
        GROUP BY Codigo_Entidade
        ORDER BY Codigo_Entidade ASC
    """, [data_inicio, data_fim])

    codigo_to_nome = {u["codigo"]: u["nome"] for u in USERS.values() if "codigo" in u}
    por_vendedor = [
        {
            "codigo":      str(r[0]),
            "nome":        codigo_to_nome.get(str(r[0]), f"Vendedor {r[0]}"),
            "total":       r[1] or 0,
            "repostos":    r[2] or 0,
            "pendentes":   r[3] or 0,
            "valor_total": float(r[4] or 0),
            "lucro_total": float(r[6] or 0),
        }
        for r in cursor.fetchall()
    ]

    total       = sum(v["total"]       for v in por_vendedor)
    repostos    = sum(v["repostos"]    for v in por_vendedor)
    pendentes   = sum(v["pendentes"]   for v in por_vendedor)
    valor_total = sum(v["valor_total"] for v in por_vendedor)
    lucro_total = sum(v["lucro_total"] for v in por_vendedor)

    conn.close()
    return {
        "data_inicio":  data_inicio,
        "data_fim":     data_fim,
        "total":        total,
        "repostos":     repostos,
        "pendentes":    pendentes,
        "valor_total":  valor_total,
        "lucro_total":  lucro_total,
        "por_vendedor": por_vendedor,
    }


# ---------------------------------------------------------------------------
# Reposições
# ---------------------------------------------------------------------------

@app.post("/reposicoes", status_code=201)
def criar_reposicao(body: ReposicaoCreate, user=Depends(verify_token)):
    """Cria um registo de reposição. Idempotente: devolve ID existente se já houver registo."""
    logger.debug(f"criar_reposicao recebeu: {body}")
    conn   = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT TOP 1 Id FROM DBClassico.dbo.ZAPP_Reposicoes
        WHERE Codigo_Artigo=? AND Codigo_Lote=? AND Numero_Doc=? AND Codigo_Serie=?
        ORDER BY Id DESC
    """, [body.codigo_artigo, body.codigo_lote, body.numero_doc, body.codigo_serie])
    existing = cursor.fetchone()
    if existing:
        existing_id = int(existing[0])
        # Actualizar Data_Venda para o valor correcto
        if isinstance(body.data_venda, str):
            data_venda_dt = dateutil_parser.isoparse(body.data_venda)
        else:
            data_venda_dt = body.data_venda
        cursor.execute("""
            UPDATE DBClassico.dbo.ZAPP_Reposicoes
            SET Data_Venda = ?
            WHERE Id = ?
        """, [data_venda_dt, existing_id])
        conn.commit()
        conn.close()
        return {"id": existing_id, "message": "Reposição já existia - Data_Venda actualizada"}

    observacoes = body.observacoes
    if body.qtd_vendida < 0:
        observacoes = "TROCA"

    # Calcular preco_liquido com IVA
    preco_liquido = float(body.valor_liquido_s_iva * 1.23) if body.valor_liquido_s_iva else 0.0

    # Obter nome_vendedor do USERS
    codigo_to_nome = {u["codigo"]: u["nome"] for u in USERS.values() if "codigo" in u}
    nome_vendedor = codigo_to_nome.get(body.codigo_entidade, '')

    # Converter data_venda para datetime se for string
    if isinstance(body.data_venda, str):
        data_venda_dt = dateutil_parser.isoparse(body.data_venda)
    else:
        data_venda_dt = body.data_venda

    cursor.execute("""
        INSERT INTO DBClassico.dbo.ZAPP_Reposicoes
            (Codigo_Artigo, Codigo_Lote, Codigo_Entidade, Data_Venda,
             Numero_Doc, Codigo_Serie, Qtd_Vendida, Reposto, Observacoes,
             Artigo, Pr_Unit_Doc, Desconto, Valor_Liquido_S_Iva, Valor_Custo, Lucro, Descricao_Lote, Codigo_Documento, nome_vendedor, preco_liquido)
        OUTPUT INSERTED.Id
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        body.codigo_artigo, body.codigo_lote, body.codigo_entidade,
        data_venda_dt, body.numero_doc, body.codigo_serie, body.qtd_vendida, observacoes,
        body.artigo, body.pr_unit_doc, body.desconto,
        body.valor_liquido_s_iva, body.valor_custo, body.lucro, body.descricao_lote, body.codigo_documento,
        nome_vendedor, preco_liquido
    ])
    new_id = int(cursor.fetchone()[0])
    conn.commit()
    conn.close()
    return {"id": new_id, "message": "Reposição criada"}


@app.patch("/reposicoes/{id}/repor")
def marcar_reposto(id: int, body: ReposicaoUpdate, user=Depends(verify_token)):
    """Marca um artigo como reposto."""
    conn   = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE DBClassico.dbo.ZAPP_Reposicoes
        SET Reposto = 1,
            Data_Reposicao = GETDATE(),
            Observacoes = ?
        WHERE Id = ?
    """, [body.observacoes, id])

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Reposição não encontrada")

    conn.commit()
    conn.close()
    return {"message": "Marcado como reposto", "id": id}


@app.patch("/reposicoes/{id}/cancelar")
def cancelar_reposicao(id: int, user=Depends(verify_token)):
    """Cancela uma reposição (volta a pendente)."""
    conn   = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE DBClassico.dbo.ZAPP_Reposicoes
        SET Reposto = 0, Data_Reposicao = NULL, Observacoes = NULL
        WHERE Id = ?
    """, [id])
    conn.commit()
    conn.close()
    return {"message": "Reposição revertida para pendente", "id": id}


@app.get("/reposicoes/historico")
def historico(
    data_inicio: Optional[str] = None,
    data_fim:    Optional[str] = None,
    vendedor:    Optional[str] = None,
    user=Depends(verify_token)
):
    """Histórico de reposições com filtros de data e vendedor."""
    if user["role"] != "gestor":
        raise HTTPException(status_code=403, detail="Acesso reservado ao gestor")

    if data_inicio is None:
        data_inicio = (datetime.date.today() - datetime.timedelta(days=30)).isoformat()
    if data_fim is None:
        data_fim = datetime.date.today().isoformat()

    conn   = get_conn()
    cursor = conn.cursor()

    query = """
        SELECT r.*, a.Descritivo_Artigo
        FROM DBClassico.dbo.ZAPP_Reposicoes r
        JOIN DBClassico.dbo.tb0001StkArtigos a ON a.Codigo_Artigo = r.Codigo_Artigo
        WHERE CAST(r.Data_Venda AS DATE) BETWEEN ? AND ?
    """
    params = [data_inicio, data_fim]

    if vendedor:
        query  += " AND r.Codigo_Entidade = ?"
        params.append(vendedor)

    query += " ORDER BY r.Data_Venda DESC"

    cursor.execute(query, params)
    columns = [col[0] for col in cursor.description]
    rows = []
    for r in cursor.fetchall():
        row = {}
        for i, col in enumerate(columns):
            val = r[i]
            row[col] = val.isoformat() if isinstance(val, datetime.datetime) else val
        rows.append(row)

    conn.close()
    return {"total": len(rows), "registos": rows}


# ---------------------------------------------------------------------------
# Lotes por Artigo
# ---------------------------------------------------------------------------

@app.get("/lotes")
def get_lotes(codigo_artigo: str, user=Depends(verify_token)):
    """Devolve os lotes e quantidade disponível de um artigo."""
    conn   = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            lo.Codigo_Artigo,
            a.Descritivo_Artigo,
            a.Imagem_Art,
            lo.Codigo_Lote,
            lo.Descricao_Lote,
            la.Qtd_Disponivel,
            pv.Preco
        FROM DBClassico.dbo.TB0001StkLotes       lo
        JOIN DBClassico.dbo.TB0001StkLotesAcumul la
            ON  la.Codigo_Artigo   = lo.Codigo_Artigo
            AND la.Codigo_Lote     = lo.Codigo_Lote
            AND la.Codigo_Armazem  = '001'
        JOIN DBClassico.dbo.tb0001StkArtigos a
            ON a.Codigo_Artigo = lo.Codigo_Artigo
        OUTER APPLY (
            SELECT TOP 1 Preco
            FROM DBClassico.dbo.TB0001StkPrecosVenda
            WHERE Codigo_Artigo = lo.Codigo_Artigo
              AND Tipo_Preco    = 'PV1'
        ) pv
        WHERE lo.Codigo_Artigo = ?
        ORDER BY lo.Codigo_Lote
    """, [codigo_artigo.upper()])

    raw = cursor.fetchall()
    imagem_base64 = blob_to_base64(raw[0][2]) if raw else None

    rows = [
        {
            "Codigo_Artigo":     r[0],
            "Descritivo_Artigo": r[1],
            "Codigo_Lote":       r[3],
            "Descricao_Lote":    r[4],
            "Qtd_Disponivel":    float(r[5]) if r[5] is not None else 0.0,
            "Preco":             float(r[6]) if r[6] is not None else None,
        }
        for r in raw
    ]
    conn.close()
    return {
        "codigo_artigo":  codigo_artigo.upper(),
        "total":          len(rows),
        "imagem_base64":  imagem_base64,
        "lotes":          rows,
    }


# ---------------------------------------------------------------------------
# Servir frontend compilado (produção)
# ---------------------------------------------------------------------------

_backend_dir = os.path.dirname(os.path.abspath(__file__))
_project_dir = os.path.dirname(_backend_dir)
FRONTEND_DIST = os.path.join(_project_dir, "frontend", "dist")

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
