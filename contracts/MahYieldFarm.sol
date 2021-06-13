// Authored by Elly Richardson - June 12, 2021
import "./DaToken.sol";
import "./MahToken.sol";

pragma solidity ^0.5.0;

contract MahYieldFarm {
    DaToken public daTokenContract;
    MahToken public mahTokenContract;

    //uint256 public stakedDaTokenCount;

    address payable admin;

    address[] public stakers;

    event Stake(address _staker, uint256 _daTokenAmount);

    constructor(DaToken _daTokenContract, MahToken _mahTokenContract) public {
        daTokenContract = _daTokenContract;
        mahTokenContract = _mahTokenContract;
    }

    function stakeDaToken(uint256 daTokenAmount) public payable {
        require(daTokenAmount > 0);
        require(daTokenContract.balanceOf(msg.sender) >= daTokenAmount);

        daTokenContract.transferFrom(msg.sender, address(this), daTokenAmount);

        emit Stake(msg.sender, daTokenAmount);
    }

    function distributeMahTokens() public payable {

    }
}