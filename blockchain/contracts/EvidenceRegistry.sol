// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EvidenceRegistry {

    struct EvidenceRecord {
        string fileHash; // Hash of the file
        string cid;      // IPFS CID
        uint256 timestamp;
        address registrant;
    }

    mapping(uint256 => EvidenceRecord[]) private evidenceHistory;

    address public admin;
    mapping(address => bool) public investigators;

    // ========================
    // EVENTS
    // ========================
    event EvidenceAdded(uint256 indexed evidenceId, uint256 version, address registrant);
    event InvestigatorAdded(address investigator);
    event InvestigatorRemoved(address investigator);

    // ========================
    // MODIFIERS
    // ========================
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyInvestigator() {
        require(investigators[msg.sender], "Not authorized investigator");
        _;
    }

    // ========================
    // CONSTRUCTOR
    // ========================
    constructor() {
        admin = msg.sender;
        investigators[msg.sender] = true; // Admin is also investigator
    }

    // ========================
    // ROLE MANAGEMENT
    // ========================
    function addInvestigator(address _investigator) public onlyAdmin {
        require(_investigator != address(0), "Invalid address");
        require(!investigators[_investigator], "Already investigator");

        investigators[_investigator] = true;
        emit InvestigatorAdded(_investigator);
    }

    function removeInvestigator(address _investigator) public onlyAdmin {
        require(_investigator != address(0), "Invalid address");
        require(_investigator != admin, "Cannot remove admin");
        require(investigators[_investigator], "Not an investigator");

        investigators[_investigator] = false;
        emit InvestigatorRemoved(_investigator);
    }

    // ========================
    // EVIDENCE FUNCTIONS
    // ========================

    // Updated to accept CID
    function addEvidence(uint256 evidenceId, string memory fileHash, string memory cid)
        public
        onlyInvestigator
    {
        require(evidenceId > 0, "Invalid evidence ID");
        require(bytes(fileHash).length > 0, "Invalid hash");
        require(bytes(cid).length > 0, "Invalid CID");

        evidenceHistory[evidenceId].push(
            EvidenceRecord(fileHash, cid, block.timestamp, msg.sender)
        );

        uint256 version = evidenceHistory[evidenceId].length;

        emit EvidenceAdded(evidenceId, version, msg.sender);
    }

    function getLatestEvidence(uint256 evidenceId)
        public
        view
        returns (string memory, string memory, uint256, address, uint256)
    {
        require(evidenceHistory[evidenceId].length > 0, "No evidence found");

        uint256 latestIndex = evidenceHistory[evidenceId].length - 1;
        EvidenceRecord memory record = evidenceHistory[evidenceId][latestIndex];

        return (
            record.fileHash,
            record.cid,
            record.timestamp,
            record.registrant,
            evidenceHistory[evidenceId].length
        );
    }

    function getEvidenceVersion(uint256 evidenceId, uint256 version)
        public
        view
        returns (string memory, string memory, uint256, address)
    {
        require(version > 0, "Invalid version");
        require(version <= evidenceHistory[evidenceId].length, "Version does not exist");

        EvidenceRecord memory record = evidenceHistory[evidenceId][version - 1];

        return (
            record.fileHash,
            record.cid,
            record.timestamp,
            record.registrant
        );
    }

    function getTotalVersions(uint256 evidenceId)
        public
        view
        returns (uint256)
    {
        return evidenceHistory[evidenceId].length;
    }
}
