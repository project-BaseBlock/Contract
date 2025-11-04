// hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition-ethers");
require("dotenv").config({ path: ".env" });

const {
  CHAIN_RPC_URL,
  MINTER_PK,           // 0x로 시작해야 함
  ETHERSCAN_API_KEY,
  SOLIDITY_VERSION
} = process.env;

const accounts = MINTER_PK && MINTER_PK.startsWith("0x") ? [MINTER_PK] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: SOLIDITY_VERSION || "0.8.28",
  networks: {
    sepolia: {
      url: CHAIN_RPC_URL,
      accounts,
      chainId: 11155111,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "P3FKRH6US5VNG2E5VREXSFC3J6XWQNAYRE",
  },
  mocha: {
    timeout: 60_000,
  },
};
