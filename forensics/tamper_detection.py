import os
import hashlib
import json
from web3 import Web3

# ---------------------------
# CONFIGURATION
# ---------------------------
GANACHE_URL = "http://127.0.0.1:8545"
CONTRACT_ADDRESS = Web3.to_checksum_address("0x8a78b5c208f62a28f42e09f52b8abb2bc35fb277")
ABI_PATH = "../blockchain/artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"
ACCOUNT = "0x2BCC2D4F66E6141A72109F3E5670A8c9093Ff134"  # Ganache account
PRIVATE_KEY = "0x5d978784bc0d6155781712ccea917f03413e18d389ca401199359a6792d81f04"  # Ganache private key

# ---------------------------
# CONNECT TO BLOCKCHAIN
# ---------------------------
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
if w3.is_connected():
    print("✅ Connected to Blockchain")
else:
    print("❌ Could not connect to Blockchain")
    exit(1)

# Load contract ABI
with open(ABI_PATH, 'r') as f:
    contract_json = json.load(f)
    contract_abi = contract_json['abi']

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_abi)
print("✅ Contract loaded successfully")

# ---------------------------
# HASHING FUNCTION
# ---------------------------
def generate_hash(file_path):
    with open(file_path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()

# ---------------------------
# REGISTER EVIDENCE
# ---------------------------
def register_evidence(file_path, case_id="CASE001"):
    file_name = os.path.basename(file_path)
    file_hash = generate_hash(file_path)
    try:
        nonce = w3.eth.get_transaction_count(ACCOUNT)
        tx = contract.functions.storeEvidence(
            file_name,
            case_id,
            file_hash
        ).build_transaction({
            'from': ACCOUNT,
            'nonce': nonce,
            'gas': 3000000,
            'gasPrice': w3.to_wei(20, 'gwei')
        })

        signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)  # ✅ lowercase here
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        print("\n🔐 Evidence Registered on Blockchain")
        print("Stored Hash:", file_hash)
        print("Transaction Hash:", receipt.transactionHash.hex())

    except Exception as e:
        print("❌ Error registering evidence:", e)


# ---------------------------
# VERIFY EVIDENCE
# ---------------------------
def verify_evidence(file_path):
    file_name = os.path.basename(file_path)
    current_hash = generate_hash(file_path)
    try:
        stored_data = contract.functions.getEvidence(file_name).call()
        stored_hash = stored_data[2]

        print("\n--- VERIFYING EVIDENCE ---")
        print("Current File Hash :", current_hash)
        print("Blockchain Hash   :", stored_hash)

        if stored_hash == "":
            print("⚠ Evidence does not exist on blockchain.")
        elif current_hash == stored_hash:
            print("✅ EVIDENCE VALID — No Tampering Detected")
        else:
            print("❌ TAMPER DETECTED — File Integrity Compromised")

    except Exception as e:
        print("⚠ Evidence not found or contract call failed:", e)

# ---------------------------
# MAIN
# ---------------------------
if __name__ == "__main__":
    file_path = "../evidence.txt"

    print("Choose mode:\n1 = Register Evidence\n2 = Verify Evidence")
    choice = input("Enter 1 or 2: ").strip()

    if choice == "1":
        register_evidence(file_path)
    elif choice == "2":
        verify_evidence(file_path)
    else:
        print("❌ Invalid choice")

