from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import requests
import os

router = APIRouter()

# URL base do zapp-reposicoes (porta 8001)
ZAPP_REPOSICOES_URL = os.getenv("ZAPP_REPOSICOES_URL", "http://localhost:8001")

class ReposicaoUpdateRequest(BaseModel):
    observacoes: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

def get_auth_token() -> str:
    """Obter token JWT para autenticar com zapp-reposicoes"""
    try:
        response = requests.post(
            f"{ZAPP_REPOSICOES_URL}/auth/login",
            json={"username": "gestor", "password": "cd"},
            timeout=5
        )
        if response.status_code == 200:
            return response.json().get("token", "")
        return ""
    except Exception as e:
        print(f"Erro ao obter token: {e}")
        return ""

@router.post("/auth/login")
def login_reposicoes(request: LoginRequest):
    """Fazer login no zapp-reposicoes"""
    try:
        response = requests.post(
            f"{ZAPP_REPOSICOES_URL}/auth/login",
            json={"username": request.username, "password": request.password},
            timeout=5
        )
        if response.status_code == 200:
            return response.json()
        else:
            return {"detail": response.json().get("detail", "Erro ao fazer login")}
    except Exception as e:
        return {"detail": f"Erro de conexão: {str(e)}"}

def proxy_request(method: str, endpoint: str, data: Optional[dict] = None, params: Optional[dict] = None):
    """Proxy uma requisição para o zapp-reposicoes"""
    try:
        token = get_auth_token()
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        url = f"{ZAPP_REPOSICOES_URL}{endpoint}"

        if method == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data, timeout=10)
        else:
            return {"error": "Método não suportado"}

        if response.status_code in [200, 201]:
            return response.json()
        else:
            return {"error": f"Erro {response.status_code}: {response.text}"}
    except requests.exceptions.ConnectionError:
        return {"error": f"Não conseguiu conectar ao servidor de reposições ({ZAPP_REPOSICOES_URL})"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/vendas")
def get_vendas_reposicoes(data: Optional[str] = None):
    """Obter vendas para reposição"""
    params = {"data": data} if data else {}
    return proxy_request("GET", "/vendas", params=params)

@router.get("/dashboard")
def get_dashboard_reposicoes(data: Optional[str] = None):
    """Obter dashboard de reposições"""
    params = {"data": data} if data else {}
    return proxy_request("GET", "/dashboard", params=params)

@router.get("/dashboard/historico")
def get_dashboard_historico_reposicoes(
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None
):
    """Obter histórico de reposições"""
    params = {}
    if data_inicio:
        params["data_inicio"] = data_inicio
    if data_fim:
        params["data_fim"] = data_fim
    return proxy_request("GET", "/dashboard/historico", params=params)

@router.patch("/reposicoes/{id}/repor")
def mark_as_reposto(id: int, request: ReposicaoUpdateRequest):
    """Marcar reposição como completa"""
    return proxy_request("PATCH", f"/reposicoes/{id}/repor", data=request.dict())

@router.patch("/reposicoes/{id}/cancelar")
def cancel_reposicao(id: int):
    """Cancelar uma reposição"""
    return proxy_request("PATCH", f"/reposicoes/{id}/cancelar")

@router.get("/lotes")
def get_lotes_endpoint(codigo_artigo: str):
    """Obter lotes disponíveis"""
    params = {"codigo_artigo": codigo_artigo}
    return proxy_request("GET", "/lotes", params=params)

@router.get("/historico")
def get_reposicoes_historico(
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    vendedor: Optional[str] = None
):
    """Obter histórico de reposições completas"""
    params = {}
    if data_inicio:
        params["data_inicio"] = data_inicio
    if data_fim:
        params["data_fim"] = data_fim
    if vendedor:
        params["vendedor"] = vendedor
    return proxy_request("GET", "/reposicoes/historico", params=params)
