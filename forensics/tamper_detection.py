import os
import hashlib
from web3 import Web3
import json
from datetime import datetime, timezone

# ---------------------------
# CONFIGURATION
# ---------------------------
GANACHE_URL = "http://127.0.0.1:8545"
CONTRACT_ADDRESS = Web3.to_checksum_address("0xf7bc9cBac9CfadcE25ee5BE9DD278aaf21cb06E2")
ABI_PATH = "../blockchain/artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"
ACCOUNT = "0xab17353592f1CD95Bbe85220eDDe60ff59540a41"
PRIVATE_KEY = "0xf7997535af098085309cf62b4a9097df50cec101611e92ada2769baf5702d67d"

# ---------------------------
# CONNECT TO BLOCKCHAIN
# ---------------------------
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
if not w3.is_connected():
    print("❌ Could not connect to Blockchain")
    exit(1)

print("✅ Connected to Blockchain")

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
# METADATA FUNCTION
# ---------------------------
def get_file_metadata(file_path):
    stat = os.stat(file_path)
    return {
        "size": stat.st_size,
        "modified_time": datetime.fromtimestamp(stat.st_mtime, timezone.utc)
    }

# ---------------------------
# FORENSIC CONFIDENCE SCORE
# ---------------------------
def calculate_confidence(hash_match, timestamp_valid):
    score = 0

    if hash_match:
        score += 60
    if timestamp_valid:
        score += 40

    return score

# ---------------------------
# REGISTER EVIDENCE
# ---------------------------
def register_evidence(file_path, case_id="CASE001"):
    file_name = os.path.basename(file_path)
    file_hash = generate_hash(file_path)

    try:
        nonce = w3.eth.get_transaction_count(ACCOUNT)

        tx_hash = contract.functions.storeEvidence(
            file_name,
            case_id,
            file_hash
        ).transact({
            'from': ACCOUNT,
            'nonce': nonce,
            'gas': 3000000,
            'gasPrice': w3.to_wei(20, 'gwei')
        })

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        block = w3.eth.get_block(receipt['blockNumber'])
        blockchain_time = datetime.fromtimestamp(block['timestamp'], timezone.utc)

        print("\n🔐 Evidence Registered on Blockchain")
        print(f"Stored Hash: {file_hash}")
        print(f"Registrant: {ACCOUNT}")
        print(f"Blockchain Timestamp: {blockchain_time}")
        print(f"Transaction Hash: {tx_hash.hex()}")

    except Exception as e:
        print("❌ Error registering evidence:", e)

# ---------------------------
# VERIFY EVIDENCE
# ---------------------------
def verify_evidence(file_path):
    file_name = os.path.basename(file_path)
    current_hash = generate_hash(file_path)
    metadata = get_file_metadata(file_path)

    try:
        evidence = contract.functions.getEvidence(file_name).call()

        stored_hash = evidence[2]
        registrant = evidence[3]
        blockchain_timestamp = datetime.fromtimestamp(evidence[4], timezone.utc)

        print("\n--- VERIFYING EVIDENCE ---")
        print(f"Current File Hash : {current_hash}")
        print(f"Blockchain Hash   : {stored_hash}")
        print(f"Registrant        : {registrant}")
        print(f"Blockchain Time   : {blockchain_timestamp}")
        print(f"File Modified Time: {metadata['modified_time']}")
        print(f"File Size         : {metadata['size']} bytes")

        # Integrity Check
        hash_match = (stored_hash == current_hash)

        # Timestamp Check (File modified should NOT be newer than blockchain registration)
        timestamp_valid = metadata['modified_time'] <= blockchain_timestamp

        # Calculate Score
        confidence = calculate_confidence(hash_match, timestamp_valid)

        print("\n--- FORENSIC ANALYSIS ---")

        if hash_match:
            print("✅ Integrity: Hash Match")
        else:
            print("❌ Integrity: Hash Mismatch")

        if timestamp_valid:
            print("✅ Timestamp Consistent")
        else:
            print("⚠ File Modified After Blockchain Registration")

        print(f"\n🎯 Forensic Confidence Score: {confidence}%")

        if confidence == 100:
            print("🔒 Evidence Fully Trusted")
        elif confidence >= 60:
            print("⚠ Evidence Partially Trusted")
        else:
            print("🚨 Evidence Compromised")

    except Exception as e:
        print("⚠ Evidence not found or contract call failed:", e)

# ---------------------------
# MAIN
# ---------------------------
if __name__ == "__main__":
    file_path = "../evidence.txt"

    choice = input("Choose mode:\n1 = Register Evidence\n2 = Verify Evidence\nEnter 1 or 2: ").strip()
    if choice == "1":
        register_evidence(file_path)
    elif choice == "2":
        verify_evidence(file_path)
    else:
        print("❌ Invalid choice")
