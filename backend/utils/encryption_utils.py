from cryptography.fernet import Fernet
import os

KEY_FILE = "secret.key"

def load_key():
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as f:
            f.write(key)
    else:
        with open(KEY_FILE, "rb") as f:
            key = f.read()

    return key

def encrypt_file(file_path):
    key = load_key()
    cipher = Fernet(key)

    with open(file_path, "rb") as f:
        data = f.read()

    encrypted_data = cipher.encrypt(data)

    encrypted_path = file_path + ".enc"

    with open(encrypted_path, "wb") as f:
        f.write(encrypted_data)

    return encrypted_path
