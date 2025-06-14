@echo off
echo 🚀 Iniciando deploy...

REM Adiciona todos os arquivos ao staging
git add .

REM Define a mensagem de commit. Usa o primeiro argumento se fornecido, senao, uma mensagem padrao.
set COMMIT_MESSAGE=%1
if "%COMMIT_MESSAGE%"=="" set COMMIT_MESSAGE="feat: Alteracoes gerais e deploy"

echo 💾 Fazendo commit com a mensagem: %COMMIT_MESSAGE%
git commit -m %COMMIT_MESSAGE%

echo 🛰️  Enviando para o repositorio...
git push origin main

echo ✅ Deploy enviado com sucesso! O EasyPanel ira iniciar o build automaticamente.
pause 