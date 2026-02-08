"""
Azure Tips API - Backend for Azure 1-Day Workshop
Flask API, ami Azure SQL-ből olvas tippeket
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
import pyodbc

app = Flask(__name__)
CORS(app)

def get_db_connection():
    """Adatbázis kapcsolat létrehozása környezeti változókból"""
    server = os.environ.get('SQL_SERVER')
    database = os.environ.get('SQL_DATABASE')
    username = os.environ.get('SQL_USERNAME')
    password = os.environ.get('SQL_PASSWORD')
    port = os.environ.get('SQL_PORT')
    
    connection_string = (
        f"Driver={{ODBC Driver 18 for SQL Server}};"
        f"Server=tcp:{server},{port};"
        f"Database={database};"
        f"Uid={username};"
        f"Pwd={password};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
    )
    
    return pyodbc.connect(connection_string)

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "service": "Azure Tips API",
        "version": "1.0"
    })

@app.route('/api/tip/random')
def get_random_tip():
    """Véletlenszerű tipp lekérése"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT TOP 1 id, title, content, category, difficulty 
            FROM tips 
            ORDER BY NEWID()
        """)
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return jsonify({
                "success": True,
                "tip": {
                    "id": row[0],
                    "title": row[1],
                    "content": row[2],
                    "category": row[3],
                    "difficulty": row[4]
                }
            })
        else:
            return jsonify({"success": False, "error": "Nincs tipp az adatbázisban"}), 404
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/tips')
def get_all_tips():
    """Összes tipp lekérése"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, content, category, difficulty 
            FROM tips 
            ORDER BY category, difficulty
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        tips = [{
            "id": row[0],
            "title": row[1],
            "content": row[2],
            "category": row[3],
            "difficulty": row[4]
        } for row in rows]
        
        return jsonify({
            "success": True,
            "count": len(tips),
            "tips": tips
        })
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT'))
    app.run(host='0.0.0.0', port=port, debug=False)
