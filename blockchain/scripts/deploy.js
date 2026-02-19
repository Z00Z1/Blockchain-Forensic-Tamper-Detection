async function main() {
  const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
  const contract = await EvidenceRegistry.deploy();
  await contract.deployed();

  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
