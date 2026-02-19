import json
from web3 import Web3

# Connect to Ganache
ganache_url = "http://127.0.0.1:8545"
w3 = Web3(Web3.HTTPProvider(ganache_url))

if w3.is_connected():
    print("✅ Connected to Ganache")
else:
    print("❌ Connection failed")

# Your deployed contract address
contract_address = "0x2f0b6DfD9072C559c2A6077186550B4Dcda945cB"

# Load ABI
with open("blockchain/artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json") as f:
    contract_json = json.load(f)
    abi = contract_json["abi"]

# Create contract instance
contract = w3.eth.contract(address=contract_address, abi=abi)

print("✅ Contract loaded successfully")
