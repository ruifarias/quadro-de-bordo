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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
