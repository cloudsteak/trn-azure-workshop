-- Azure 1-Day Workshop - Database Setup
-- Azure Tips of the Day

-- Tábla létrehozása
CREATE TABLE tips (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    content NVARCHAR(1000) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    difficulty NVARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- Seed adatok - Azure tippek
INSERT INTO tips (title, content, category, difficulty) VALUES
('Resource Group = Életciklus', 
 'Mindig úgy hozz létre Resource Group-ot, hogy az összes benne lévő erőforrásnak ugyanaz legyen az életciklusa. Ha törölnöd kell, egy kattintás az egész.', 
 'Best Practice', 'Kezdő'),

('Naming Convention', 
 'Használj következetes elnevezési konvenciót! Pl: rg-projekt-env-region (rg-webshop-prod-westeu). Később meghálálja magát.', 
 'Best Practice', 'Kezdő'),

('Cost Management Alert', 
 'Állíts be költségriasztást MINDEN subscription-ön! A Cost Management + Billing menüben pár perc, és megment a meglepetésektől.', 
 'Cost', 'Kezdő'),

('App Service Always On', 
 'Ha az App Service-ed "elalszik" és lassan indul, kapcsold be az Always On opciót. Basic tier-től elérhető.', 
 'App Service', 'Középhaladó'),

('Managed Identity > Connection String', 
 'Ahol lehet, használj Managed Identity-t connection string helyett. Biztonságosabb és nem kell titkokat kezelned.', 
 'Security', 'Középhaladó'),

('Azure CLI a barátod', 
 'Telepítsd az Azure CLI-t lokálban! Az "az interactive" mód automatikus kiegészítéssel segít a parancsok tanulásában.', 
 'Tooling', 'Kezdő'),

('Deployment Slots', 
 'App Service-nél használj staging slot-ot! Először oda deployolj, teszteld, majd swap-eld production-be állásidő nélkül.', 
 'App Service', 'Középhaladó'),

('NSG Flow Logs', 
 'Ha nem tudod, miért nem megy át a forgalom, kapcsold be az NSG Flow Logs-t. Látni fogod, melyik szabály blokkolja.', 
 'Networking', 'Haladó'),

('Azure Advisor', 
 'Hetente nézd meg az Azure Advisor javaslatait! Ingyen ad tippeket a költségcsökkentésre, biztonságra és teljesítményre.', 
 'Cost', 'Kezdő'),

('Tagging Strategy', 
 'Használj tag-eket MINDEN erőforráson! Minimum: Environment, Owner, Project. A költségelemzésnél aranyat ér.', 
 'Best Practice', 'Kezdő'),

('Storage Account Firewall', 
 'Production storage account-nál SOHA ne hagyd "All networks" beállításon! Használj Private Endpoint-ot vagy IP szabályokat.', 
 'Security', 'Középhaladó'),

('VM méretezés titka', 
 'Nem biztos, hogy nagyobb VM kell! Először nézd meg a metrikákat: lehet, hogy csak az alkalmazást kell optimalizálni.', 
 'Compute', 'Középhaladó'),

('Soft Delete bekapcsolása', 
 'Soft delete legyen MINDIG bekapcsolva Storage Account-nál és Key Vault-nál. Egy véletlen törlés napokat menthet meg.', 
 'Security', 'Kezdő'),

('Azure Policy', 
 'Használj Azure Policy-t a subscription-ön! Pl: "Allowed locations" - így senki nem hoz létre erőforrást rossz régióban.', 
 'Governance', 'Haladó'),

('Key Vault reference', 
 'Sose hardcode-olj connection string-et! Tárold Key Vault-ban és App Service-ből Key Vault reference-szel hivatkozz rá.', 
 'Security', 'Középhaladó'),

('Azure OpenAI Content Filtering', 
 'Használj egyedi Content Filtereket az Azure OpenAI Service-ben a kimeneti/bemeneti tartalom szabályozásához. Segít a felelősségteljes AI (Responsible AI) irányelvek betartásában.', 
 'AI / Security', 'Középhaladó'),

('Vector Search az AI Search-ben', 
 'RAG (Retrieval-Augmented Generation) architektúrához használj Vector Search-et az Azure AI Search-ben. Gyorsabb és pontosabb kontextust biztosít az LLM-eknek.', 
 'AI / Search', 'Haladó'),

('Token-alapú költségkövetés', 
 'Az Azure OpenAI hívások költsége a tokenek számától függ. Monitorozd a Usage metrikákat az Azure Monitor-ban, hogy elkerüld a váratlan költségeket.', 
 'AI / Cost', 'Kezdő'),

('Multi-service AI Resource', 
 'Ha több AI szolgáltatást (Vision, Speech, Language) használsz, hozz létre egyetlen Multi-service típusú Cognitive Services erőforrást. Egy kulcs, egy számla, egyszerűbb kezelés.', 
 'AI', 'Kezdő'),

('Autoscale mindenhol', 
 'Ne fizess felesleges kapacitásért! Állíts be autoscale szabályokat App Service Plan-en és VM Scale Set-en CPU vagy memória használat alapján.', 
 'Best Practice', 'Középhaladó'),

('Keresés ezer erőforrás között', 
 'Ha több száz erőforrásod van, az Azure Resource Graph Explorer a leggyorsabb módja a komplex lekérdezéseknek kiterjedt környezetekben.', 
 'Governance', 'Haladó'),

('Infrastructure as Code (IaC)', 
 'Soha ne kattintgass production környezetet! Használj Bicep-et vagy Terraform-ot az erőforrások verziózott és újrafelhasználható telepítéséhez.', 
 'DevOps', 'Középhaladó');

-- Ellenőrzés
SELECT COUNT(*) AS total_tips FROM tips;
SELECT category, COUNT(*) AS count FROM tips GROUP BY category;
