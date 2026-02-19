require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      url: "http://127.0.0.1:8545",
      accounts: ["0xc1728a8efeea1684d477087aa1d29cc52e033bb3a2bbbf690652a210193e00ed"]
    }
  }
};
