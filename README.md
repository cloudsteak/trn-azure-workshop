# Azure Tips of the Day - 1 napos Workshop

Egy egyszerű, de valódi alkalmazás architektúra Azure szolgáltatásokkal.

## 🏗️ Architektúra

```
[Felhasználó] → [Windows VM + IIS] → [App Service API] → [Azure SQL]
                    (frontend)           (backend)         (adatbázis)
```

## 📁 Repo struktúra

```
/ (gyökér = backend)
├── app.py                  ← App Service INNEN deployol (GitHub integration)
├── requirements.txt
├── frontend/               ← Windows VM-re manuálisan (RDP)
│   ├── index.html
│   ├── style.css
│   ├── config.js           ← BACKEND URL BEÁLLÍTÁSA ITT!
│   └── web.config          ← IIS konfiguráció
└── database/
    └── init.sql
```

---

## 1️⃣ Resource Group

```
Név: tippek
Régió: Sweden Central
```

---

## 2️⃣ Windows VM (Frontend + IIS)

### VM létrehozása
- **Név**: `vm-workshop-frontend`
- **Image**: Windows Server 2022 Datacenter
- **Size**: Standard_B2s
- **Admin**: `azureuser` + jelszó

### NSG szabályok
- ✅ RDP (3389) - alapból engedélyezett
- ➕ HTTP (80) - hozzáadni!

### RDP csatlakozás
1. VM Overview → **Connect** → **RDP**
2. Töltsd le az RDP fájlt
3. Csatlakozz az admin credentiallel

### IIS telepítése (VM-en)

**PowerShell (Administrator):**
```powershell
# IIS telepítése
Install-WindowsFeature -Name Web-Server -IncludeManagementTools

# Ellenőrzés
Get-Service W3SVC
```

### Frontend fájlok másolása

1. A `frontend/` mappa teljes tartalmát másold a VM-re:
   - `C:\inetpub\wwwroot\`
   
2. Töröld az alapértelmezett fájlokat:
   - `iisstart.htm`
   - `iisstart.png`

**Végső struktúra:**
```
C:\inetpub\wwwroot\
├── index.html
├── style.css
├── config.js        ← EZT SZERKESZD!
└── web.config
```

### ⚙️ Backend URL beállítása

Szerkeszd a `C:\inetpub\wwwroot\config.js` fájlt:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://azuretips-api-XXXX.azurewebsites.net'
};
```

### Teszt
```
http://<VM_PUBLIC_IP>
```

---

## 3️⃣ App Service (Backend)

### Web App létrehozása
- **Név**: `azuretips-api-XXXX`
- **Runtime**: Python 3.11
- **Plan**: Basic B1

### 🔗 GitHub Deployment

1. App Service → **Deployment Center**
2. **Source**: GitHub
3. Authorize → válaszd ki ezt a repót
4. **Branch**: `main`
5. **Save**

Minden `git push` után automatikusam deployol!

### Environment Variables

| Név | Érték |
|-----|-------|
| `SQL_SERVER` | `sql-workshop-tips-XXXX.database.windows.net` |
| `SQL_PORT` | `1433` |
| `SQL_DATABASE` | `azuretips` |
| `SQL_USERNAME` | `sqladmin` |
| `SQL_PASSWORD` | `<jelszó>` |

### Startup Command
```
gunicorn -w 4 -b 0.0.0.0:8000 --timeout 600 app:app
```

### Teszt
```
https://azuretips-api-XXXX.azurewebsites.net/api/tip/random
```

---

## 4️⃣ Azure SQL Database

### SQL Server
- **Név**: `sql-workshop-tips-XXXX`
- **Admin**: `sqladmin` + erős jelszó
- **Régió**: Sweden Central

### Database
- **Név**: `azuretips`
- **Tier**: Basic (5 DTU)

### Firewall
- ✅ Allow Azure services
- ✅ Add client IP

### Tábla létrehozása
Query Editor-ban futtasd a `database/init.sql` tartalmát.

---

## 📁 Frontend fájlok

| Fájl | Leírás |
|------|--------|
| `index.html` | Fő weboldal |
| `style.css` | Stílusok |
| `config.js` | **Backend URL konfigurációja** |
| `web.config` | IIS beállítások (MIME types, default document) |

---

## 🧹 Takarítás

```bash
az group delete --name tippek --yes --no-wait
```

---

## 🔧 Hibaelhárítás

| Probléma | Megoldás |
|----------|----------|
| IIS nem fut | `Start-Service W3SVC` PowerShell-ben |
| Frontend nem tölt be | NSG 80-as port engedélyezve? |
| API 500 hiba | App Service environment variables OK? |
| CORS hiba | App Service → CORS → Add `*` |
| config.js not found | Ellenőrizd a fájl elérési útját |
