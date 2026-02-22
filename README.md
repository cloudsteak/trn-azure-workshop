# ☁️ Azure Képzés – Cloud Idézetek + AI Chatbot

Egy napos, gyakorlati Azure képzés. A nap végére egy **működő webalkalmazást** hozunk létre közösen.

---

## 🏗️ Architektúra

```
Böngésző
    │
    ▼
Azure VM  (Ubuntu + Apache)        ← Frontend: statikus HTML/CSS/JS
    │
    ▼ (HTTPS API hívások)
Azure App Service  (Python Flask)  ← Backend: /quotes  /chat  /health
    ├──► Azure Database for MySQL  ← Idézetek tárolása
    └──► Azure OpenAI Service      ← AI chatbot (GPT-4o-mini)
```

### Érintett Azure szolgáltatások

| Szolgáltatás | Szerepe |
|---|---|
| **Azure Virtual Machine** | Frontend hosting (Apache) |
| **Azure App Service** | Backend API (Python Flask) |
| **Azure Database for MySQL** | Relational DB – idézetek |
| **Azure OpenAI / AI Foundry** | GPT-4o-mini chatbot |

---

## 📁 Struktúra

```
.
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── config.js      ← ⚠️ BACKEND_URL ide kerül
│       └── app.js
├── backend/
│   ├── app.py             ← Flask API
│   └── requirements.txt
├── database/
│   └── init.sql           ← Tábla + 15 idézet
├── .github/workflows/
│   └── deploy-backend.yml ← GitHub Actions auto-deploy
└── README.md
```

---

## 🎯 Haladási terv

| # | Lépés | Működik utána? |
|---|---|---|
| 1 | Resource Group létrehozása | – |
| 2 | Azure VM + Apache + frontend | ❌ (nincs backend URL) |
| 3 | App Service + GitHub auto-deploy | ❌ (nincs DB, nincs OpenAI) |
| 4 | config.js frissítése | ❌ (nincs DB) |
| 5 | Azure MySQL + init.sql + App Service env vars | ✅ Idézetek működnek! |
| 6 | Azure OpenAI deployment + env vars | ✅ AI chatbot is működik! |

---

## Előfeltételek

- Azure előfizetés (ingyenes trial is elég)
- GitHub fiók (a backend auto-deployhoz)
- [DBeaver Community](https://dbeaver.io/download/) – adatbázis kezeléshez
- Régió mindenhova: **West Europe**

> 💡 Az összes erőforrást egy **Resource Group**-ba rakjuk (`workshop-rg`), így a végén egyetlen törlésssel mindent eltávolítunk.

---

## 1. lépés – Resource Group

Azure Portal → **Resource groups** → **Create**

| Beállítás | Érték |
|---|---|
| Name | `workshop-rg` |
| Region | `West Europe` |

---

## 2. lépés – Azure VM + Apache (Frontend)

### VM létrehozása

Azure Portal → **Virtual machines** → **Create** → **Azure virtual machine**

| Beállítás | Érték |
|---|---|
| Resource group | `workshop-rg` |
| Name | `frontend-vm` |
| Region | `West Europe` |
| Image | **Ubuntu Server 24.04 LTS** |
| Size | **Standard_B1s** |
| Authentication | Password |
| Username | `azureuser` |
| Inbound ports | **HTTP (80), SSH (22)** |

### Csatlakozás

Azure Portal → VM → **Connect** → **Native SSH**

```bash
ssh azureuser@<VM_PUBLIC_IP>
```

### Apache telepítése

```bash
sudo apt update && sudo apt install -y apache2
```

Teszt: `http://<VM_PUBLIC_IP>` → Apache alapoldal jelenik meg. ✅

### Frontend feltöltése

```bash
REPO="https://raw.githubusercontent.com/cloudsteak/trn-azure-workshop/main/frontend"
W="/var/www/html"

sudo mkdir -p $W/css $W/js
sudo curl -so $W/index.html     $REPO/index.html
sudo curl -so $W/css/style.css  $REPO/css/style.css
sudo curl -so $W/js/config.js   $REPO/js/config.js
sudo curl -so $W/js/app.js      $REPO/js/app.js

# Régi Apache alapoldal törlése
sudo rm -f $W/index.html.bak
```

Teszt: `http://<VM_PUBLIC_IP>` → Az alkalmazás betölt (health piros – ez normális, nincs még backend).

---

## 3. lépés – Azure App Service (Backend)

### App Service létrehozása

Azure Portal → **App Services** → **Create** → **Web App**

| Beállítás | Érték |
|---|---|
| Resource group | `workshop-rg` |
| Name | `azure-quotes-api` *(egyedi névnek kell lennie!)* |
| Publish | **Code** |
| Runtime | **Python 3.12** |
| OS | **Linux** |
| Region | `West Europe` |
| Plan | **Free F1** |

### Startup parancs beállítása

App Service → **Configuration** → **General settings** → **Startup Command**:

```
gunicorn --bind 0.0.0.0:8000 --timeout 60 app:app
```

→ **Save**

### GitHub auto-deploy bekötése

App Service → **Deployment Center**

| Beállítás | Érték |
|---|---|
| Source | **GitHub** |
| Organization | a te GitHub felhasználóneved |
| Repository | `trn-azure-workshop` |
| Branch | `main` |

→ **Save**

Ez automatikusan:
- létrehozza a `.github/workflows/` alatt a deploy workflow fájlt
- minden `main` branchre pusholt változtatás után újra deployol

> ✅ A repo már tartalmaz egy előre elkészített workflow fájlt (`.github/workflows/deploy-backend.yml`). Ha az Azure Portal saját fájlt hoz létre, törölheted a miénket – mindkettő működik.

### GitHub Secrets beállítása (ha a saját workflow-t használjuk)

GitHub → Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Érték |
|---|---|
| `AZURE_WEBAPP_NAME` | `azure-quotes-api` |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | letöltve az App Service-ből (lásd lent) |

A publish profile letöltése: App Service → **Overview** → **Get publish profile** → letölt egy `.PublishSettings` fájlt → annak teljes tartalmát illeszd be a Secretbe.

### config.js frissítése a VM-en

```bash
sudo nano /var/www/html/js/config.js
```

Cseréld ki `XXXXXXXXXX`-et:
```javascript
const CONFIG = {
  BACKEND_URL: 'https://azure-quotes-api.azurewebsites.net'
};
```

---

## 4. lépés – Azure Database for MySQL

### MySQL Flexible Server létrehozása

Azure Portal → **Azure Database for MySQL Flexible Servers** → **Create**

| Beállítás | Érték |
|---|---|
| Resource group | `workshop-rg` |
| Server name | `quotes-db` *(egyedi!)* |
| Region | `West Europe` |
| MySQL version | `8.0` |
| Workload type | **Development** |
| Admin username | `adminuser` |
| Password | válassz és jegyezd meg! |

**Networking tab:**
- Connectivity method: **Public access**
- ✅ Add current client IP address

→ **Review + create** → Várj ~3 percet.

### Adatbázis létrehozása

MySQL Flexible Server → **Databases** → **Add**

| Beállítás | Érték |
|---|---|
| Name | `cloudquotes` |
| Charset | `utf8mb4` |

### Firewall – App Service hozzáférés

MySQL Flexible Server → **Networking** → **Firewall rules** → **Add**:

| Name | Start IP | End IP |
|---|---|---|
| `allow-all` | `0.0.0.0` | `255.255.255.255` |

> ⚠️ Workshop után szűkítsd le!

### Csatlakozás DBeaver-rel

**New Database Connection → MySQL**

| Mező | Érték |
|---|---|
| Host | `quotes-db.mysql.database.azure.com` |
| Port | `3306` |
| Database | `cloudquotes` |
| Username | `adminuser` |
| Password | a te jelszavad |

SSL tab: **Use SSL** ✅

→ **Test Connection** → **Finish**

### SQL futtatása

DBeaver → `cloudquotes` → jobb klikk → **SQL Editor** → másold be a `database/init.sql` tartalmát → **Execute** (▶️)

### App Service – Application Settings

App Service → **Configuration** → **Application settings** → add each:

| Név | Érték |
|---|---|
| `DB_HOST` | `quotes-db.mysql.database.azure.com` |
| `DB_USER` | `adminuser` |
| `DB_PASSWORD` | a te jelszavad |
| `DB_NAME` | `cloudquotes` |

→ **Save** → App Service újraindul.

🎉 **Nyisd meg `http://<VM_PUBLIC_IP>` → Az idézetek megjelennek!**

---

## 5. lépés – Azure OpenAI (AI Chatbot)

### OpenAI erőforrás létrehozása

Azure Portal → **Azure OpenAI** → **Create**

| Beállítás | Érték |
|---|---|
| Resource group | `workshop-rg` |
| Name | `quotes-openai` |
| Region | **Sweden Central** *(itt érhető el a legtöbb modell)* |
| Pricing tier | Standard S0 |

### Deployment létrehozása (Azure AI Foundry)

OpenAI erőforrás → **Go to Azure AI Foundry** → **Deployments** → **Deploy model**

| Beállítás | Érték |
|---|---|
| Model | `gpt-4o-mini` |
| Deployment name | `gpt-4o-mini` |

### API Key és Endpoint

Azure Portal → OpenAI erőforrás → **Keys and Endpoint**

- Endpoint: `https://quotes-openai.openai.azure.com/`
- Key 1: `xxxxx…`

### App Service – OpenAI Application Settings

App Service → **Configuration** → **Application settings**:

| Név | Érték |
|---|---|
| `OPENAI_ENDPOINT` | `https://quotes-openai.openai.azure.com/` |
| `OPENAI_KEY` | az API kulcs |
| `OPENAI_DEPLOYMENT` | `gpt-4o-mini` |

→ **Save**

🎉 **Nyisd meg az alkalmazást → A chatbot válaszol!**

---

## 🧹 Takarítás

Azure Portal → **Resource groups** → `workshop-rg` → **Delete resource group** → gépeld be: `workshop-rg` → **Delete**

Minden törlődik egyszerre.

---

## ❓ Gyakori problémák

| Probléma | Megoldás |
|---|---|
| App Service 500 | App Service → **Log stream** – ott látod a Python hibát |
| MySQL connection refused | Firewall rule hozzáadva? App Service újraindult? |
| CORS hiba | `flask-cors` telepítve és `CORS(app)` az app.py-ban? |
| OpenAI 404 | A deployment neve pontosan egyezik? (`OPENAI_DEPLOYMENT` env var) |
| OpenAI auth error | Trailing slash az endpoint URL végén! |
| Frontend nem frissül | `Ctrl+Shift+R` hard reload a böngészőben |
| GitHub deploy nem fut | Repo → Actions → nézd meg a workflow log-ot |

---

## 💰 Napi költség (1 workshop)

| Szolgáltatás | ~Napi költség |
|---|---|
| VM Standard_B1s | ~$0.01 |
| App Service Free F1 | **$0** |
| MySQL Burstable B1ms | ~$0.02 |
| Azure OpenAI GPT-4o-mini | ~$0.01–0.05 |
| **Összesen** | **< $0.10** |
