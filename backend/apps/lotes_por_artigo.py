from fastapi import APIRouter, HTTPException
import pyodbc
import os

router = APIRouter()

DB_SERVER   = "TSERVER\SQLSERVER"
DB_NAME     = "DBClassico"
DB_DRIVER   = "ODBC Driver 18 for SQL Server"
DB_USER     = "GIWINDOWS"
DB_PASSWORD = "GIWINDOWS"

CONN_STR = (
    f"DRIVER={{{DB_DRIVER}}};"
    f"SERVER={DB_SERVER};"
    f"DATABASE={DB_NAME};"
    f"UID={DB_USER};"
    f"PWD={DB_PASSWORD};"
    f"TrustServerCertificate=yes;"
)

def get_conn():
    try:
        return pyodbc.connect(CONN_STR)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro de ligação à base de dados: {str(e)}")

def blob_to_base64(blob):
    import base64
    if blob:
        return base64.b64encode(blob).decode('utf-8')
    return None

@router.get("/lista")
def get_lotes(codigo_artigo: str):
    """Devolve os lotes e quantidade disponível de um artigo."""
    try:
        conn = get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                lo.Codigo_Artigo,
                a.Descritivo_Artigo,
                a.Imagem_Art,
                lo.Codigo_Lote,
                lo.Descricao_Lote,
                la.Qtd_Disponivel,
                pv.Preco,
                pv.Desconto
            FROM DBClassico.dbo.TB0001StkLotes       lo
            JOIN DBClassico.dbo.TB0001StkLotesAcumul la
                ON  la.Codigo_Artigo   = lo.Codigo_Artigo
                AND la.Codigo_Lote     = lo.Codigo_Lote
                AND la.Codigo_Armazem  = '001'
            JOIN DBClassico.dbo.tb0001StkArtigos a
                ON a.Codigo_Artigo = lo.Codigo_Artigo
            OUTER APPLY (
                SELECT TOP 1
                    pvx.Preco,
                    CASE WHEN d.Tipo_Desconto = 'P' THEN d.Desc1_Escal1 ELSE 0 END AS Desconto
                FROM DBClassico.dbo.TB0001StkPrecosVenda pvx
                LEFT JOIN DBClassico.dbo.TB0001StkDescontosArt d
                    ON d.Codigo_Desconto_Artigo = pvx.Codigo_Desconto_Art
                WHERE pvx.Codigo_Artigo = lo.Codigo_Artigo
                  AND pvx.Tipo_Preco    = 'PV1'
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
                "Desconto":          float(r[7]) if r[7] is not None else 0.0,
                "Preco_Liquido":     _preco_liquido(
                                         float(r[6]) if r[6] is not None else None,
                                         float(r[7]) if r[7] is not None else 0.0,
                                     ),
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _preco_liquido(preco, desconto):
    """Preço líquido = PVP x (1 - desconto%/100), arredondado a 1 casa."""
    return round(preco * (1 - desconto / 100), 1) if preco is not None else None


@router.get("/por-nome")
def get_lotes_por_nome(q: str, marca: str = "", cor: str = "", tamanho: str = ""):
    """Procura artigos por código OU descrição (LIKE) e devolve os lotes de
    cada artigo correspondente, agrupados por artigo (só artigos com stock>0)."""
    termo = q.strip()
    if not termo:
        return {"query": termo, "total_artigos": 0, "truncado": False, "artigos": []}

    MAX_ARTIGOS = 40
    padrao = f"%{termo}%"

    try:
        conn = get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                lo.Codigo_Artigo,
                a.Descritivo_Artigo,
                a.Imagem_Art,
                lo.Codigo_Lote,
                lo.Descricao_Lote,
                la.Qtd_Disponivel,
                pv.Preco,
                pv.Desconto
            FROM DBClassico.dbo.TB0001StkLotes       lo
            JOIN DBClassico.dbo.TB0001StkLotesAcumul la
                ON  la.Codigo_Artigo   = lo.Codigo_Artigo
                AND la.Codigo_Lote     = lo.Codigo_Lote
                AND la.Codigo_Armazem  = '001'
            JOIN DBClassico.dbo.tb0001StkArtigos a
                ON a.Codigo_Artigo = lo.Codigo_Artigo
            OUTER APPLY (
                SELECT TOP 1
                    pvx.Preco,
                    CASE WHEN d.Tipo_Desconto = 'P' THEN d.Desc1_Escal1 ELSE 0 END AS Desconto
                FROM DBClassico.dbo.TB0001StkPrecosVenda pvx
                LEFT JOIN DBClassico.dbo.TB0001StkDescontosArt d
                    ON d.Codigo_Desconto_Artigo = pvx.Codigo_Desconto_Art
                WHERE pvx.Codigo_Artigo = lo.Codigo_Artigo
                  AND pvx.Tipo_Preco    = 'PV1'
            ) pv
            WHERE lo.Codigo_Artigo LIKE ? OR a.Descritivo_Artigo LIKE ?
            ORDER BY a.Descritivo_Artigo, lo.Codigo_Artigo, lo.Codigo_Lote
        """, [padrao.upper(), padrao])

        # Agrupa todos os lotes por artigo (inclui lotes negativos / a 0)
        artigos = {}
        for r in cursor.fetchall():
            cod = r[0]
            if cod not in artigos:
                preco = float(r[6]) if r[6] is not None else None
                desconto = float(r[7]) if r[7] is not None else 0.0
                artigos[cod] = {
                    "Codigo_Artigo":     cod,
                    "Descritivo_Artigo": r[1],
                    "Preco":             preco,
                    "Desconto":          desconto,
                    "Preco_Liquido":     _preco_liquido(preco, desconto),
                    "_imagem_raw":       r[2],
                    "lotes":             [],
                }
            artigos[cod]["lotes"].append({
                "Codigo_Lote":    r[3],
                "Descricao_Lote": r[4],
                "Qtd_Disponivel": float(r[5]) if r[5] is not None else 0.0,
            })

        conn.close()

        # Filtro por Marca em Descritivo_Artigo
        marca_f = marca.strip().lower()
        if marca_f:
            artigos = {cod: a for cod, a in artigos.items() if marca_f in a["Descritivo_Artigo"].lower()}

        # Filtro por Cor/Tamanho em Descricao_Lote: artigo qualifica se tiver
        # pelo menos um lote com stock>0 que satisfaça ambos; mostra todos os lotes
        cor_f = cor.strip().lower()
        tam_f = tamanho.strip().lower()
        if cor_f or tam_f:
            def lote_qualifica(lote):
                if lote["Qtd_Disponivel"] <= 0:
                    return False
                desc = (lote["Descricao_Lote"] or "").lower()
                return (not cor_f or cor_f in desc) and (not tam_f or tam_f in desc)
            artigos = {cod: a for cod, a in artigos.items() if any(lote_qualifica(l) for l in a["lotes"])}

        # Só artigos com stock total > 0 (mantém todos os lotes, incluindo negativos)
        validos = [
            a for a in artigos.values()
            if sum(l["Qtd_Disponivel"] for l in a["lotes"]) > 0
        ]
        # Ordena do PVP mais caro para o mais barato (sem preço fica no fim)
        validos.sort(
            key=lambda a: a["Preco"] if a["Preco"] is not None else float("-inf"),
            reverse=True,
        )

        truncado = len(validos) > MAX_ARTIGOS
        lista = validos[:MAX_ARTIGOS]
        for a in lista:
            a["imagem_base64"] = blob_to_base64(a.pop("_imagem_raw"))
            a["total_lotes"]   = len(a["lotes"])

        return {
            "query":          termo,
            "total_artigos":  len(lista),
            "truncado":       truncado,
            "artigos":        lista,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
