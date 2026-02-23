// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EvidenceRegistry {
    
    struct Evidence {
        string evidenceId;
        string caseId;
        string hashValue;
        address registrant;
        uint256 timestamp;
    }
    
    mapping(string => Evidence) private evidences;

    event EvidenceStored(
        string evidenceId,
        string caseId,
        string hashValue,
        address registrant,
        uint256 timestamp
    );

    // Store evidence
    function storeEvidence(
        string memory _evidenceId,
        string memory _caseId,
        string memory _hashValue
    ) public {
        require(bytes(_evidenceId).length > 0, "Evidence ID required");
        require(bytes(_hashValue).length > 0, "Hash value required");

        evidences[_evidenceId] = Evidence({
            evidenceId: _evidenceId,
            caseId: _caseId,
            hashValue: _hashValue,
            registrant: msg.sender,
            timestamp: block.timestamp
        });

        emit EvidenceStored(_evidenceId, _caseId, _hashValue, msg.sender, block.timestamp);
    }

    // Retrieve evidence
    function getEvidence(string memory _evidenceId) public view returns (
        string memory evidenceId,
        string memory caseId,
        string memory hashValue,
        address registrant,
        uint256 timestamp
    ) {
        Evidence memory e = evidences[_evidenceId];
        require(bytes(e.evidenceId).length > 0, "Evidence not found");
        return (e.evidenceId, e.caseId, e.hashValue, e.registrant, e.timestamp);
    }
}
