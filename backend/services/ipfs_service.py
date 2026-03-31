import requests
import os
from dotenv import load_dotenv

load_dotenv()

IPFS_API = os.getenv("IPFS_API")

def upload_to_ipfs(file_path):

    url = f"{IPFS_API}/api/v0/add"

    with open(file_path, "rb") as f:
        files = {"file": f}
        response = requests.post(url, files=files)

    cid = response.json()["Hash"]

    return cid
