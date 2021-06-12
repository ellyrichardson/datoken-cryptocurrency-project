// Authored by Elly Richardson - June 7, 2021
// Credits to DappUniversity
import "./DaToken.sol";

pragma solidity ^0.5.0;

contract DaTokenSale {

    DaToken public daTokenContract;
    uint256 public daTokenPrice;
    uint256 public daTokensSold;
    address payable admin;

    event Sell(address _buyer, uint256 _tokenAmount, uint256 _totalCost);

    constructor(DaToken _daTokenContract, uint256 _daTokenPrice) public {
        admin = msg.sender;
        daTokenContract = _daTokenContract;
        daTokenPrice = _daTokenPrice;
    }

    function multiply(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x);
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        uint256 totalCost = multiply(daTokenPrice, _numberOfTokens);
        require(msg.value == totalCost); // How to test this locally? (Probably add a wrong "value" in the buyTokens call)
        require(daTokenContract.balanceOf(address(this)) >= _numberOfTokens);
        require(_numberOfTokens > 0);
        require(daTokenContract.transfer(msg.sender, _numberOfTokens)); // How to test this locally?

        daTokensSold += _numberOfTokens;

        emit Sell(msg.sender, _numberOfTokens, totalCost);
    }

    function endTokenSale() public payable {
        require(msg.sender == admin);
        require(daTokenContract.transfer(admin, daTokenContract.balanceOf(address(this))));

        // NOTE: Dont destroy the contract here
        // Just transfer the balance to admin
        admin.transfer(address(this).balance);
    }
}