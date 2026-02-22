"""
Azure Tips of the Day - Backend API
Azure App Service (Python 3.12)

Szukseges kornyezeti valtozok (Azure Portal -> App Service -> Configuration -> Environment variables):
  DB_HOST            Azure MySQL Flexible Server hostname
  DB_PORT            3306
  DB_USER            MySQL felhasznalonev (pl. adminuser)
  DB_PASSWORD        MySQL jelszo
  DB_NAME            cloudquotes
  OPENAI_ENDPOINT    https://<eroforras>.openai.azure.com/
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

def get_db():
    return pymysql.connect(
        host            = os.environ.get("DB_HOST", ""),
        port            = int(os.environ.get("DB_PORT", 3306)),
        user            = os.environ.get("DB_USER", ""),
        password        = os.environ.get("DB_PASSWORD", ""),
        database        = os.environ.get("DB_NAME", "cloudquotes"),
        ssl             = {"ssl_disabled": False},
        connect_timeout = 10,
        cursorclass     = pymysql.cursors.DictCursor,
    )

# ── OpenAI ────────────────────────────────────────────────────────────────

def openai_client():
    return AzureOpenAI(
        azure_endpoint = os.environ.get("OPENAI_ENDPOINT", ""),
        api_key        = os.environ.get("OPENAI_KEY", ""),
        api_version    = "2024-02-01",
    )

def openai_deployment():
    return os.environ.get("OPENAI_DEPLOYMENT", "gpt-4o-mini")

SYSTEM = (
    "Te egy tapasztalt Azure cloud architect es trainer vagy. "
    "Segites megerteni az Azure szolgaltatasokat. "
    "Valaszolj magyarul, tomoren es erthetoen."
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
            model      = openai_deployment(),
            messages   = [{"role": "user", "content": "ping"}],
            max_tokens = 1,
        )
        result["openai"] = "ok"
    except Exception as e:
        log.warning("OpenAI health: %s", e)

    return jsonify(result), 200


@app.get("/quotes")
def all_quotes():
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("SELECT id, text, author, category FROM quotes ORDER BY id")
        rows = cur.fetchall()
    conn.close()
    return jsonify({"count": len(rows), "quotes": rows})


@app.get("/quotes/random")
def random_quote():
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("SELECT id, text, author, category FROM quotes ORDER BY RAND() LIMIT 1")
        row = cur.fetchone()
    conn.close()
    return jsonify(row) if row else (jsonify({"error": "Nincs idezet"}), 404)


@app.post("/chat")
def chat():
    body    = request.get_json(silent=True) or {}
    message = (body.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Ures uzenet"}), 400

    resp = openai_client().chat.completions.create(
        model       = openai_deployment(),
        messages    = [
            {"role": "system", "content": SYSTEM},
            {"role": "user",   "content": message},
        ],
        max_tokens  = 500,
        temperature = 0.7,
    )
    return jsonify({"reply": resp.choices[0].message.content})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
