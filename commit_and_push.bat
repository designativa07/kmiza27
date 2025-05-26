@echo off
echo Adicionando Dockerfile.frontend...
git add Dockerfile.frontend

echo Fazendo commit...
git commit -m "Fix: Dockerfile v8.7 - Debug extremo com multiplas camadas de logging"

echo Fazendo push para GitHub...
git push origin main

echo Concluido!
pause 