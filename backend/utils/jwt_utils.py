import jwt
from datetime import datetime, timedelta

SECRET_KEY = "supersecretkey"

def generate_token(user):
    payload = {
        "user": user["name"],
        "role": user["role"],
        "exp": datetime.utcnow() + timedelta(hours=5)
    }

    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def verify_token(token):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded
    except:
        return None
