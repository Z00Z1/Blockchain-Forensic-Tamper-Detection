import json
import os
from datetime import datetime
from uuid import uuid4

def create_metadata(file_path, file_hash, collector, case_id, description):

    evidence_id = "EV-" + str(uuid4())[:8]

    metadata = {
        "evidence_id": evidence_id,
        "file_name": os.path.basename(file_path),
        "hash_sha256": file_hash,
        "collector": collector,
        "timestamp": datetime.utcnow().isoformat(),
        "case_id": case_id,
        "description": description
    }

    return metadata


def save_metadata(metadata):

    metadata_dir = "../evidence/metadata"
    os.makedirs(metadata_dir, exist_ok=True)

    metadata_file_path = os.path.join(
        metadata_dir,
        metadata["evidence_id"] + ".json"
    )

    with open(metadata_file_path, 'w') as f:
        json.dump(metadata, f, indent=4)

    return metadata_file_path

