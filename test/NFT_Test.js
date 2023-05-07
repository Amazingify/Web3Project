const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT tests", () => {

  describe("Mint test", () => {
    let deployedContract
    let accounts;

    beforeEach(async () => {
      accounts = await ethers.getSigners();
      let contract = await ethers.getContractFactory("NFT", accounts[0]);
      let owner = accounts[0].address
      deployedContract = await contract.deploy();
      deployedContract = await deployedContract.deployed();
    })

    it("Total Supply test", async () => {
      expect(await deployedContract.totalSupply()).to.equal(0);
    })

    it("Tests Mint", async () => {

      let balanceBefore = await ethers.provider.getBalance(accounts[0].address);
     
      await deployedContract.connect(accounts[0]).addToWhitelist([accounts[0].address])
      
      await deployedContract.connect(accounts[0]).mint(
        accounts[0].address, // to
        1, // amount
        {
          value: ethers.utils.parseEther("1") // msg.value
        }
      );

      let balanceAfter = await ethers.provider.getBalance(accounts[0].address);
      balanceBefore = ethers.utils.formatEther(balanceBefore);
      balanceAfter = ethers.utils.formatEther(balanceAfter);
      expect(Math.floor(balanceBefore - balanceAfter)).to.equal(1);
      expect(await deployedContract.totalSupply()).to.equal(1);
      expect(await deployedContract.balanceOf(accounts[0].address)).to.equal(1);
      expect(await deployedContract.balances(accounts[0].address)).to.equal(1);
      expect(await deployedContract.ownerOf(0)).to.equal(accounts[0].address);
    })

    it("allows minting 3 times per user", async () => {
      const contract = await deployedContract.connect(accounts[1]);
      let balanceBefore = await ethers.provider.getBalance(accounts[1].address);
      await deployedContract.connect(accounts[0]).addToWhitelist([accounts[1].address])
      await contract.mint(accounts[1].address, 3, {
        value: ethers.utils.parseEther("3")
      })
      expect(await contract.balances(accounts[1].address)).to.equal(3);
      let balanceAfter = await ethers.provider.getBalance(accounts[1].address);
      balanceBefore = ethers.utils.formatEther(balanceBefore);
      balanceAfter = ethers.utils.formatEther(balanceAfter);
      expect(Math.floor(balanceBefore - balanceAfter)).to.equal(3);
    })

    it("prevents minting more than limit", async () => {

      const contract = await deployedContract.connect(accounts[2]);
      await deployedContract.connect(accounts[0]).addToWhitelist([accounts[1].address])
      await contract.mint(accounts[1].address, 1, {
        value: ethers.utils.parseEther("1")
      })

      let tx = contract.mint(accounts[1].address, 3, {
        value: ethers.utils.parseEther("3")
      })
      await expect(tx).to.be.revertedWith("mint: limit reached");
    })

    it("prevents minting with no funds", async () => {
      const contract = await deployedContract.connect(accounts[2]);

      let tx = contract.mint(accounts[1].address, 1, {
        value: ethers.utils.parseEther("0")
      })
      await expect(tx).to.revertedWith("mint:funds sent not enough")
    })

    it("prevents minting with amount of 0", async () => {
      const contract = await deployedContract.connect(accounts[2]);

      let tx = contract.mint(accounts[1].address, 0, {
        value: ethers.utils.parseEther("0")
      })
      await expect(tx).to.revertedWith("mint: amount is 0")
    })

    it("allows owner to withdraw", async () => {
      const contract = await deployedContract.connect(accounts[2]);
      await deployedContract.connect(accounts[0]).addToWhitelist([accounts[2].address])
      await contract.mint(accounts[2].address, 3, {
        value: ethers.utils.parseEther("3")
      })
      let balance = await contract.balanceOf(accounts[2].address);
      expect(balance).to.equals(3);
      let contractBalance = await ethers.provider.getBalance(contract.address);
      console.log(ethers.utils.formatEther(contractBalance));
      let owner = accounts[0];
      expect(await contract.owner()).to.equal(accounts[0].address);
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      await deployedContract.connect(accounts[0]).withdraw();
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      let profit = ownerBalanceAfter.sub(ownerBalanceBefore);
      let result = ethers.utils.formatEther(profit);
      result = Math.ceil(result);
      expect(result).to.equal(3);
    })


    it("adds users to the whitelist", async () => {

      const contract = await deployedContract.connect(accounts[0]);

      const whitelist = [
        accounts[1].address,
        accounts[2].address,
        accounts[3].address,
        accounts[4].address,
        accounts[5].address,
      ]

      await contract.addToWhitelist(whitelist);
      const state = await contract.whitelist(accounts[3].address);
      expect(state).to.be.true
      
    })
  })

});
