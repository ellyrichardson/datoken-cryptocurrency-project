// Authored by Elly Richardson - June 12, 2021
import "./DaToken.sol";
import "./MahToken.sol";

pragma solidity >=0.4.22 <0.9.0;

contract MahYieldFarm {

    struct StakerInfo {
        address stakerAddress;
        uint256 stakedTokens;
    }

    DaToken public daTokenContract;
    MahToken public mahTokenContract;

    //uint256 public stakedDaTokenCount;

    address payable admin;

    mapping (address => StakerInfo) public stakers;

    event Stake(address _staker, uint256 _daTokenAmount);

    constructor(DaToken _daTokenContract, MahToken _mahTokenContract) public {
        daTokenContract = _daTokenContract;
        mahTokenContract = _mahTokenContract;
    }

    function stakeDaToken(uint256 _daTokenAmount) public {
        require(_daTokenAmount > 0);
        require(daTokenContract.balanceOf(msg.sender) >= _daTokenAmount);

        daTokenContract.transferFrom(msg.sender, address(this), _daTokenAmount);

        if (!doesStakerExist(msg.sender)) {
            stakers[msg.sender].stakerAddress = msg.sender;
            stakers[msg.sender].stakedTokens = stakers[msg.sender].stakedTokens + _daTokenAmount;
        }

        emit Stake(msg.sender, _daTokenAmount);
    }

    function doesStakerExist(address _staker) public returns (bool) {
        return stakers[msg.sender].stakerAddress != address(0);
    }

    function distributeMahTokens() public {

    }
}