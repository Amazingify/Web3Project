// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";
import "./signatureVerifier.sol";

contract NFT is ERC721, ReentrancyGuard {
    uint256 public totalSupply = 0;
    uint256 public price = 1 ether; // ether = 1^18;
    uint256 public limitPerUser = 3;
    mapping(address => uint) public balances;
    address public owner;

    constructor() ERC721("NFT", "nft") {
        owner = msg.sender;
    }

    modifier mintChecks(
        uint amount,
        uint funds,
        address to,
        bytes memory signature
    ) {
        require(amount > 0, "mint: amount is 0");
        require(funds >= price * amount, "mint:funds sent not enough");
        require(balances[to] + amount <= limitPerUser, "mint: limit reached");
        require(verify(msg.sender,signature,owner),"mint:invalid siganture");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "onlyOwner: unathorized");
        _;
    }

    function verify(address _addr, bytes memory signature, address signer) internal view returns (bool) {
        bytes32 messageHash = getMessageHash(_addr);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        return  signer == ECDSA.recover(ethSignedMessageHash, signature);
    }

    function mint(
        address to,
        uint amount,
        bytes memory signature
    ) external payable nonReentrant mintChecks(amount, msg.value, to, signature) {
        _handleRefund(msg.value, price, amount);
        balances[to] += amount;
        for (uint i = 0; i < amount; i++) _mint(to, totalSupply++);
    }

    function _handleRefund(uint funds, uint price, uint amount) internal {
        if (funds > price * amount) {
            uint refund = msg.value - price;
            (bool status, ) = (msg.sender).call{value: refund}("");
            require(status, "_handleRefund: refund failed");
        }
    }

    function withdraw() external onlyOwner {
        uint balance = address(this).balance;
        (bool status, ) = (owner).call{value: balance}("");
        require(status, "withdraw: trasnfer failed");
    }

 
      function getMessageHash(address _addr)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(_addr));
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }
}
