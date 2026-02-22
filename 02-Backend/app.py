"""
Azure Tips of the Day – Backend API
Azure App Service (Python 3.12)

GitHub-ról automatikusan deployol – lásd .github/workflows/deploy-backend.yml

Szükséges Application Settings (Azure Portal → App Service → Configuration):
  DB_HOST            Azure MySQL Flexible Server hostname
  DB_USER            MySQL felhasználónév (pl. adminuser)
  DB_PASSWORD        MySQL jelszó
  DB_NAME            cloudquotes
  OPENAI_ENDPOINT    https://<erőforrás>.openai.azure.com/
  OPENAI_KEY         Azure OpenAI API kulcs
  OPENAI_DEPLOYMENT  deployment neve (pl. gpt-4o-mini)
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
from openai import AzureOpenAI

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ── DB ────────────────────────────────────────────────────────────────────

DB = {
    "host":     os.environ["DB_HOST"],
    "user":     os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "database": os.environ.get("DB_NAME", "cloudquotes"),
    "ssl":      {"ssl_disabled": False},
    "connect_timeout": 10,
    "cursorclass": pymysql.cursors.DictCursor,
}

def get_db():
    return pymysql.connect(**DB)

# ── OpenAI ────────────────────────────────────────────────────────────────

def openai_client():
    return AzureOpenAI(
        azure_endpoint = os.environ["OPENAI_ENDPOINT"],
        api_key        = os.environ["OPENAI_KEY"],
        api_version    = "2024-02-01",
    )

DEPLOYMENT = os.environ.get("OPENAI_DEPLOYMENT", "gpt-4o-mini")

SYSTEM = (
    "Te egy tapasztalt Azure cloud architect és trainer vagy. "
    "Segítesz megérteni az Azure szolgáltatásokat. "
    "Válaszolj magyarul, tömören és érthetően."
)

# ── Routes ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    result = {"app": "ok", "db": "error", "openai": "error"}

    try:
        conn = get_db()
        conn.cursor().execute("SELECT 1")
        conn.close()
        result["db"] = "ok"
    except Exception as e:
        log.warning("DB health: %s", e)

    try:
        openai_client().chat.completions.create(
            model=DEPLOYMENT,
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=1,
        )
        result["openai"] = "ok"
    except Exception as e:
        log.warning("OpenAI health: %s", e)

    return jsonify(result), 200


@app.get("/quotes")
def all_quotes():
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("SELECT id, quote, author, category FROM quotes ORDER BY id")
        rows = cur.fetchall()
    conn.close()
    return jsonify({"count": len(rows), "quotes": rows})


@app.get("/quotes/random")
def random_quote():
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("SELECT id, quote, author, category FROM quotes ORDER BY RAND() LIMIT 1")
        row = cur.fetchone()
    conn.close()
    return jsonify(row) if row else (jsonify({"error": "Nincs idézet"}), 404)


@app.post("/chat")
def chat():
    body = request.get_json(silent=True) or {}
    message = (body.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Üres üzenet"}), 400

    resp = openai_client().chat.completions.create(
        model=DEPLOYMENT,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user",   "content": message},
        ],
        max_tokens=500,
        temperature=0.7,
    )
    return jsonify({"reply": resp.choices[0].message.content})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
