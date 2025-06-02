@echo off
echo 🚀 Fazendo push da correção...
git add .
git commit -m "fix: remove timestamp from package.json to fix JSON parsing error"
git push origin main
echo ✅ Push da correção concluído!
pause 