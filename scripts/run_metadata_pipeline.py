from hash_generator import generate_hash
from metadata import create_metadata, save_metadata

# Step 1: Define file to process
file_path = "../sample_evidence.txt"

# Step 2: Generate hash
file_hash = generate_hash(file_path)

# Step 3: Create metadata
metadata = create_metadata(
    file_path=file_path,
    file_hash=file_hash,
    collector="Investigator A",
    case_id="CASE-2026-01",
    description="Test evidence file"
)

# Step 4: Save metadata
metadata_file = save_metadata(metadata)

print("Metadata created successfully.")
print("Saved at:", metadata_file)
