# ==============================================================
# Azure Workshop – IIS telepítés + Frontend letöltés
# Futtasd PowerShell-ben (Run as Administrator) a Windows VM-en
# ==============================================================

# 1. IIS telepítése
Write-Host "`n[1/3] IIS telepítése..." -ForegroundColor Cyan
Install-WindowsFeature -Name Web-Server -IncludeManagementTools | Out-Null
Write-Host "     IIS telepítve." -ForegroundColor Green

# 2. Régi default fájlok törlése
Write-Host "[2/3] Default fájlok törlése..." -ForegroundColor Cyan
Remove-Item C:\inetpub\wwwroot\iisstart* -Force -ErrorAction SilentlyContinue
Write-Host "     Kész." -ForegroundColor Green

# 3. Frontend letöltése GitHub-ról
Write-Host "[3/3] Frontend letöltése GitHub-ról..." -ForegroundColor Cyan

$repo = "https://raw.githubusercontent.com/cloudsteak/trn-azure-workshop/main/01-Frontend"
$root = "C:\inetpub\wwwroot"

New-Item -ItemType Directory -Force -Path "$root\css", "$root\js" | Out-Null

Invoke-WebRequest "$repo/index.html"    -OutFile "$root\index.html"
Invoke-WebRequest "$repo/css/style.css" -OutFile "$root\css\style.css"
Invoke-WebRequest "$repo/js/config.js"  -OutFile "$root\js\config.js"
Invoke-WebRequest "$repo/js/app.js"     -OutFile "$root\js\app.js"

Write-Host "     Frontend fájlok letöltve." -ForegroundColor Green

# Eredmény
$ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host " Kész! Nyisd meg a böngészőben:" -ForegroundColor Yellow
Write-Host " http://$ip" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor Yellow

Write-Host "Következő lépés: szerkeszd a config.js-t:" -ForegroundColor Cyan
Write-Host " $root\js\config.js" -ForegroundColor White
