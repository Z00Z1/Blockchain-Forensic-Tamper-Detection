// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EvidenceRegistry {

    struct Evidence {
        string evidenceId;
        string caseId;
        string hashValue;
        uint256 timestamp;
        address storedBy;
    }

    mapping(string => Evidence) private evidences;

    event EvidenceStored(
        string evidenceId,
        string caseId,
        string hashValue,
        uint256 timestamp,
        address storedBy
    );

    function storeEvidence(
        string memory _evidenceId,
        string memory _caseId,
        string memory _hashValue
    ) public {

        require(bytes(evidences[_evidenceId].evidenceId).length == 0, "Evidence already exists");

        evidences[_evidenceId] = Evidence({
            evidenceId: _evidenceId,
            caseId: _caseId,
            hashValue: _hashValue,
            timestamp: block.timestamp,
            storedBy: msg.sender
        });

        emit EvidenceStored(_evidenceId, _caseId, _hashValue, block.timestamp, msg.sender);
    }

    function getEvidence(string memory _evidenceId)
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256,
            address
        )
    {
        Evidence memory e = evidences[_evidenceId];
        return (e.evidenceId, e.caseId, e.hashValue, e.timestamp, e.storedBy);
    }
}
