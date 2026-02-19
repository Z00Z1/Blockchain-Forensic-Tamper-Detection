import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      type: "http",
      url: "http://127.0.0.1:8545",
      accounts: ["0x31b36d499b60489cab31aa55d4ca2bd609cade960dde74686147d6401859f639"]
    }
  }
};

export default config;
