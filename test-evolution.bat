@echo off
echo 🧪 TESTANDO EVOLUTION API DIRETAMENTE...
echo.

echo 📋 TESTE 1: Verificando instâncias...
curl -X GET "https://kmiza27-evolution.h4xd66.easypanel.host/instance/fetchInstances" ^
     -H "apikey: DEEFCBB25D74-4E46-BE91-CA7852798094" ^
     -v

echo.
echo.
echo 📱 TESTE 2: Enviando mensagem de teste...
curl -X POST "https://kmiza27-evolution.h4xd66.easypanel.host/message/sendText/Kmiza27" ^
     -H "Content-Type: application/json" ^
     -H "apikey: DEEFCBB25D74-4E46-BE91-CA7852798094" ^
     -d "{\"number\":\"5554896652575\",\"text\":\"🧪 TESTE DIRETO - Mensagem de teste da Evolution API\"}" ^
     -v

echo.
echo ✅ Teste concluído!
pause 