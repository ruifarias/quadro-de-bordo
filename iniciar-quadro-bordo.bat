@echo off
REM Inicia o Quadro de Bordo
REM Porta: 8003
REM Host: 0.0.0.0 (acessível na rede)

echo.
echo ========================================
echo Quadro de Bordo - Classico Desportivo
echo ========================================
echo Porta: 8003
echo Host: 0.0.0.0 (Rede)
echo.
echo Aplicações incluídas:
echo  - Extracto Fornecedor
echo  - Valores em Divida
echo.
echo Para aceder localmente: http://localhost:8003
echo Para aceder pela rede: http://%COMPUTERNAME%:8003
echo ou substitua %COMPUTERNAME% pelo IP da máquina
echo.
echo Pressione qualquer tecla para iniciar...
pause > nul

cd /d "%~dp0"

REM Verificar se existe venv
if not exist "venv\Scripts\activate.bat" (
    echo Criando ambiente virtual...
    python -m venv venv
)

REM Ativar venv e instalar dependências
call venv\Scripts\activate.bat
pip install -q -r backend\requirements.txt

REM Iniciar a aplicação
echo Iniciando o Quadro de Bordo...
python backend\main.py
