async function main() {
  const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
  const evidence = await EvidenceRegistry.deploy();

  await evidence.deployed();

  console.log("EvidenceRegistry deployed to:", evidence.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
