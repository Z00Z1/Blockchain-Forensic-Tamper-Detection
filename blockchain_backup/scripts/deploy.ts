import { network } from "hardhat";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import artifact from "../artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json" assert { type: "json" };

async function main() {
  const account = privateKeyToAccount("0x31b36d499b60489cab31aa55d4ca2bd609cade960dde74686147d6401859f639");

  const publicClient = createPublicClient({
    transport: http("http://127.0.0.1:8545")
  });

  const walletClient = createWalletClient({
    account,
    transport: http("http://127.0.0.1:8545")
  });

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: []
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log("Contract deployed at:", receipt.contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
