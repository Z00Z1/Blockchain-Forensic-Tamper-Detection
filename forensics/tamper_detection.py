from web3 import Web3
import json
import hashlib
import os
from datetime import datetime, timezone

# ---------------------------------------
# BLOCKCHAIN CONNECTION

ganache_url = "http://127.0.0.1:8545"
web3 = Web3(Web3.HTTPProvider(ganache_url))

if web3.is_connected():
    print("Connected to Blockchain")
else:
    print("Blockchain connection failed")
    exit()

# ---------------------------------------
# ACCOUNT DETAILS

private_key = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"

account_address = web3.eth.account.from_key(private_key).address

print("🔐 Using Account:", account_address)

# LOAD CONTRACT ABI
with open("../blockchain/artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json") as f:
    contract_json = json.load(f)
    contract_abi = contract_json["abi"]

# CONTRACT ADDRESS
contract_address = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"
contract = web3.eth.contract(address=contract_address, abi=contract_abi)

print("Contract loaded successfully")

# ---------------------------------------
# HASH FUNCTION

def calculate_hash(file_path):
    file_path = os.path.expanduser(file_path)

    if not os.path.exists(file_path):
        print("File not found.")
        exit()

    with open(file_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

#------------------------------------------------------------
# REGISTER EVIDENCE
def register_evidence(evidence_id, file_hash):

    nonce = web3.eth.get_transaction_count(account_address)

    transaction = contract.functions.addEvidence(
        evidence_id,
        file_hash
    ).build_transaction({
        'from': account_address,
        'nonce': nonce,
        'gas': 2000000,
        'gasPrice': web3.to_wei('20', 'gwei')
    })

    signed_txn = web3.eth.account.sign_transaction(transaction, private_key)

    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

    print("Evidence registered successfully")
    print("Transaction Hash:", tx_hash.hex())

# -------------------------------------
# VERIFY LATEST EVIDENCE

def verify_evidence(evidence_id, file_path):

    current_file_hash = calculate_hash(file_path)

    latest = contract.functions.getLatestEvidence(evidence_id).call()

    blockchain_hash = latest[0]
    blockchain_timestamp = latest[1]
    registrant = latest[2]
    version = latest[3]

    blockchain_time = datetime.fromtimestamp(blockchain_timestamp, tz=timezone.utc)

    file_size = os.path.getsize(file_path)
    file_modified_time = datetime.fromtimestamp(
        os.path.getmtime(file_path),
        tz=timezone.utc
    )

    if blockchain_hash == current_file_hash:
        if file_modified_time <= blockchain_time:
            confidence = 100
        else:
            confidence = 50
    else:
        confidence = 0

    print("\n--- VERIFYING LATEST EVIDENCE ---")
    print("Hash Check       :", "Match" if blockchain_hash == current_file_hash else "Mismatch")
    print("Blockchain Time  :", blockchain_time)
    print("File Modified    :", file_modified_time)
    print("Registrant       :", registrant)
    print("Version          :", version)
    print("File Size        :", file_size, "bytes")
    print("Forensic Score:", f"{confidence}%")
    print("Status        :", "Trusted" if confidence >= 50 else "Compromised")

# ---------------------------------------
# SHOW HISTORY WITH SCORE

def show_history(evidence_id, file_path):

    total_versions = contract.functions.getTotalVersions(evidence_id).call()

    if total_versions == 0:
        print("No evidence history found.")
        return

    print(f"\nTotal Versions: {total_versions}\n")

    current_hash = calculate_hash(file_path)
    file_modified_time = datetime.fromtimestamp(
        os.path.getmtime(file_path),
        tz=timezone.utc
    )

    for i in range(1, total_versions + 1):

        v = contract.functions.getEvidenceVersion(evidence_id, i).call()

        v_hash = v[0]
        v_timestamp = v[1]
        v_registrant = v[2]

        v_time = datetime.fromtimestamp(v_timestamp, tz=timezone.utc)

        if v_hash == current_hash:
            confidence = 100 if file_modified_time <= v_time else 50
        else:
            confidence = 0

        print(f"--- Version {i} ---")
        print("Hash       :", v_hash)
        print("Timestamp  :", v_time)
        print("Registrant :", v_registrant)
        print("Confidence :", f"{confidence}%")
        print()

# ---------------------------------------
#  MAIN
# ---------------------------------------

if __name__ == "__main__":

    print("\nChoose mode:")
    print("1 = Register Evidence")
    print("2 = Verify Evidence")
    print("3 = Show Evidence History")

    choice = input("Enter 1, 2 or 3: ").strip()
    evidence_id = int(input("Enter Evidence ID: "))
    file_path = input("Enter file path: ").strip()

    if choice == "1":
        file_hash = calculate_hash(file_path)
        register_evidence(evidence_id, file_hash)

    elif choice == "2":
        verify_evidence(evidence_id, file_path)

    elif choice == "3":
        show_history(evidence_id, file_path)

    else:
        print("Invalid choice.")
