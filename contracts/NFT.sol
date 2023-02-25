// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFT is ERC721 {
    

    uint256 public totalSupply = 0;
    uint256 public price = 1 ether; // ether = 1^18;

    bool lock;

    uint256 public limitPerUser = 3;
    mapping(address => uint) public balances;


    constructor() ERC721("NFT", "nft") {
        lock = false;
    }

    modifier nonReentrant(){
        require(!lock,"nonReentrant: lock is active");
        lock = true;
        _;
        lock = false;
    }

    function mint(address to, uint amount) external payable nonReentrant {
        require(amount > 0, "mint: amount is 0");
        require(msg.value >= price * amount, "mint:amount not enough");
        require(balances[to] + amount <= limitPerUser,"mint: limit reached");
       
        if (msg.value > price * amount) {
            uint refund = msg.value - price;
            (bool status, ) = (msg.sender).call{value: refund}("");
            require(status, "mint: refund failed");
        }

        for (uint i = 0; i < amount; i++) {
            balances[to]++;
            _mint(to, totalSupply); 
            totalSupply++; 
        }
    }              
}
