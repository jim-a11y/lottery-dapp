require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // 確保載入環境變數

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28", // 合約使用的 Solidity 版本
  networks: {
    goerli: { // 確保名稱為小寫 "goerli"
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`], // 你的私鑰
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // 用於合約驗證
  },
};
console.log("Alchemy API Key:", process.env.ALCHEMY_API_KEY);
console.log("Private Key:", process.env.PRIVATE_KEY);
console.log("Etherscan API Key:", process.env.ETHERSCAN_API_KEY);