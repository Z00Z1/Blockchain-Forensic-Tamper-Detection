from web3 import Web3
import json
import os
from dotenv import load_dotenv

load_dotenv()

RPC = os.getenv("BLOCKCHAIN_RPC")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

web3 = Web3(Web3.HTTPProvider(RPC))

account = web3.eth.account.from_key(PRIVATE_KEY)
wallet_address = account.address

with open("../blockchain/artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json") as f:
    contract_json = json.load(f)

contract_abi = contract_json["abi"]

contract = web3.eth.contract(
    address=CONTRACT_ADDRESS,
    abi=contract_abi
)

def register_evidence_blockchain(evidence_id, file_hash, cid):

    nonce = web3.eth.get_transaction_count(wallet_address)

    tx = contract.functions.addEvidence(
        evidence_id,
        file_hash,
        cid
    ).build_transaction({
        "from": wallet_address,
        "nonce": nonce,
        "gas": 2000000,
        "gasPrice": web3.to_wei("20", "gwei")
    })

    signed_tx = web3.eth.account.sign_transaction(tx, PRIVATE_KEY)

    tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)

    receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

    return tx_hash.hex()
    
    
def get_latest_evidence(evidence_id):
    try:
        data = contract.functions.getLatestEvidence(evidence_id).call()

        # Handle empty evidence (important!)
        if not data or data[0] == "":
            return None

        # Make sure each element exists and provide defaults
        return {
            "file_hash": data[0] if len(data) > 0 else None,
            "cid": data[1] if len(data) > 1 else None,
            "timestamp": data[2] if len(data) > 2 else None,
            "registrant": data[3] if len(data) > 3 else "unknown",  # fallback
            "version": data[4] if len(data) > 4 else 1
        }

    except Exception as e:
        print(f"[Blockchain ERROR] {e}")
        return None
