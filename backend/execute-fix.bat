@echo off
echo ========================================
echo Corrigindo banco de dados...
echo ========================================

REM Tentar via psql local primeiro
psql -h localhost -U admin -d kmiza27_db -p 5432 -f "database\migrations\fix-pools-conflict.sql"

if %errorlevel% neq 0 (
    echo.
    echo ❌ psql nao encontrado ou falhou. 
    echo 💡 Execute manualmente no seu cliente PostgreSQL:
    echo.
    echo Configuracao:
    echo   Host: localhost
    echo   Porta: 5432  
    echo   Usuario: admin
    echo   Senha: password
    echo   Banco: kmiza27_db
    echo.
    echo Arquivo: backend\database\migrations\fix-pools-conflict.sql
    echo.
    pause
) else (
    echo.
    echo ✅ Banco corrigido com sucesso!
    echo.
    pause
)