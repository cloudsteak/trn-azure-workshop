# ==============================================================
# Azure Workshop - IIS telepites + Frontend letoltes
# Futtasd PowerShell-ben (Run as Administrator) a Windows VM-en
# ==============================================================

# 1. IIS telepitese
Write-Host "`n[1/3] IIS telepitese..." -ForegroundColor Cyan
Install-WindowsFeature -Name Web-Server -IncludeManagementTools | Out-Null
Write-Host "      Kesz." -ForegroundColor Green

# 2. Default fajlok torlese
Write-Host "[2/3] Default fajlok torlese..." -ForegroundColor Cyan
Remove-Item C:\inetpub\wwwroot\iisstart* -Force -ErrorAction SilentlyContinue
Write-Host "      Kesz." -ForegroundColor Green

# 3. Frontend letoltese GitHub-rol
Write-Host "[3/3] Frontend letoltese GitHub-rol..." -ForegroundColor Cyan

$repo = "https://raw.githubusercontent.com/cloudsteak/trn-azure-workshop/main/01-Frontend"
$root = "C:\inetpub\wwwroot"

New-Item -ItemType Directory -Force -Path "$root\css", "$root\js" | Out-Null

Invoke-WebRequest "$repo/index.html"    -OutFile "$root\index.html"
Invoke-WebRequest "$repo/css/style.css" -OutFile "$root\css\style.css"
Invoke-WebRequest "$repo/js/config.js"  -OutFile "$root\js\config.js"
Invoke-WebRequest "$repo/js/app.js"     -OutFile "$root\js\app.js"

Write-Host "      Fajlok letoltve." -ForegroundColor Green

# Eredmeny
$ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host " Kesz! Nyisd meg a bongeszoben:" -ForegroundColor Yellow
Write-Host " http://$ip" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor Yellow

Write-Host "Kovetkezo lepes - szerkeszd a config.js-t:" -ForegroundColor Cyan
Write-Host " $root\js\config.js" -ForegroundColor White
Write-Host "Notepad megnyitasa..." -ForegroundColor Gray
notepad "$root\js\config.js"
