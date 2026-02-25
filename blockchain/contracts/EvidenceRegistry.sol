// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EvidenceRegistry {

    struct EvidenceVersion {
        string fileHash;
        uint256 timestamp;
        address registrant;
    }

    // Evidence ID → list of versions
    mapping(string => EvidenceVersion[]) private evidenceHistory;

    event EvidenceAdded(
        string evidenceId,
        string fileHash,
        uint256 timestamp,
        address registrant,
        uint256 version
    );

    function addEvidence(
        string memory evidenceId,
        string memory fileHash
    ) public {

        EvidenceVersion memory newVersion = EvidenceVersion({
            fileHash: fileHash,
            timestamp: block.timestamp,
            registrant: msg.sender
        });

        evidenceHistory[evidenceId].push(newVersion);

        emit EvidenceAdded(
            evidenceId,
            fileHash,
            block.timestamp,
            msg.sender,
            evidenceHistory[evidenceId].length
        );
    }

    function getLatestEvidence(string memory evidenceId)
        public
        view
        returns (
            string memory fileHash,
            uint256 timestamp,
            address registrant,
            uint256 version
        )
    {
        require(evidenceHistory[evidenceId].length > 0, "No evidence found");

        uint256 latestIndex = evidenceHistory[evidenceId].length - 1;
        EvidenceVersion memory ev = evidenceHistory[evidenceId][latestIndex];

        return (ev.fileHash, ev.timestamp, ev.registrant, evidenceHistory[evidenceId].length);
    }

    function getEvidenceVersion(string memory evidenceId, uint256 versionIndex)
        public
        view
        returns (
            string memory fileHash,
            uint256 timestamp,
            address registrant
        )
    {
        require(versionIndex > 0, "Version index starts from 1");
        require(versionIndex <= evidenceHistory[evidenceId].length, "Invalid version");

        EvidenceVersion memory ev = evidenceHistory[evidenceId][versionIndex - 1];
        return (ev.fileHash, ev.timestamp, ev.registrant);
    }

    function getTotalVersions(string memory evidenceId)
        public
        view
        returns (uint256)
    {
        return evidenceHistory[evidenceId].length;
    }
}
