@echo off
echo 🚀 Fazendo push das mudanças...
git add .
git commit -m "feat: implement cache busting system - eliminates Force Rebuild need"
git push origin main
echo ✅ Push concluído!
pause 