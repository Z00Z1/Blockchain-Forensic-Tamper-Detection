import mysql.connector
from dotenv import load_dotenv
import os
from time import time

load_dotenv()

def get_connection():
    conn = mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE")
    )
    return conn
    
from services.database_service import get_connection

def save_evidence(
    evidence_id,
    case_id,
    description,
    cid,
    file_hash,
    version,
    wallet
):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # get current timestamp
        timestamp = int(time())

        query = """
        INSERT INTO evidences
        (evidence_id, case_id, description, cid, file_hash, version, registrant_wallet, timestamp)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """

        cursor.execute(query, (
            evidence_id,
            case_id,
            description,
            cid,
            file_hash,
            version,
            wallet,
            timestamp  # ✅ insert timestamp
        ))

        conn.commit()  # ✅ commit transaction

    except Exception as e:
        conn.rollback()  # ✅ rollback if error
        print(f"[DB ERROR] {e}")
        raise e

    finally:
        cursor.close()  # ✅ CRITICAL FIX
        conn.close()    # ✅ close connection
        
def get_evidence_by_id(evidence_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM evidences WHERE evidence_id=%s", (evidence_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result
