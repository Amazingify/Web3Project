require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  gasReporter: {
    enabled:true,
    currency: "USD",
    coinmarketcap: process?.env?.COIN_KEY,
    gasPrice:80,
    gasPriceApi:process?.env?.COIN_KEY
  },
};
