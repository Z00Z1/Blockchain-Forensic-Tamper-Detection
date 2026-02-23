require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      url: "http://127.0.0.1:8545",
      accounts: ["0x0ed67e32242da2781a5647f9bc77cf110109a36e9cc17651ab62559357bef134"]
    }
  }
};
