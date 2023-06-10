const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT tests", () => {

  const generateSignature = async (signer, message) => {
    const data = ethers.utils.solidityPack(["address"], [message]);
    let hash = ethers.utils.keccak256(data); // keccak256 hash the message
    hash = ethers.utils.arrayify(hash); // convert the hash to an array of bytes
    let sign = await signer.signMessage(hash);
    return sign;
  };
  

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
     
      let signature = generateSignature(accounts[0],accounts[0].address)
      await deployedContract.connect(accounts[0]).mint(
        accounts[0].address, // to
        1, // amount
        signature,
        {
          value: ethers.utils.parseEther("1") // msg.value
       })
        

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
      let signature = generateSignature(accounts[0], accounts[1].address);

      await contract.mint(accounts[1].address, 3, signature, {
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
      let signature = generateSignature(accounts[0], accounts[2].address);

      await contract.mint(accounts[1].address, 1, signature,{
        value: ethers.utils.parseEther("1")
      })

      let tx =  contract.mint(accounts[1].address, 3, signature, {
        value: ethers.utils.parseEther("3")
      })
      await expect(tx).to.be.revertedWith("mint: limit reached");
    })

    it("prevents minting with no funds", async () => {
      const contract = await deployedContract.connect(accounts[2]);
      let signature = generateSignature(accounts[0], accounts[2].address);
      let tx = contract.mint(accounts[1].address, 1, signature,{
        value: ethers.utils.parseEther("0")
      })
      await expect(tx).to.revertedWith("mint:funds sent not enough")
    })

    it("prevents minting with amount of 0", async () => {
      const contract = await deployedContract.connect(accounts[2]);
      let signature = generateSignature(accounts[0], accounts[2].address);
      let tx = contract.mint(accounts[1].address, 0, signature,{
        value: ethers.utils.parseEther("0")
      })
      await expect(tx).to.revertedWith("mint: amount is 0")
    })

    it("allows owner to withdraw", async () => {
      const contract = await deployedContract.connect(accounts[2]);
      let signature = generateSignature(accounts[0], accounts[2].address);
      await contract.mint(accounts[2].address, 3, signature,{
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

  })

});
