// Authored by Elly Richardson - June 12, 2021
import "./DaToken.sol";
import "./MahToken.sol";

pragma solidity >=0.4.22 <0.9.0;

contract MahYieldFarm {

    struct StakerInfo {
        address stakerAddress;
        uint256 stakedTokens;
        //uint256 mahTokens;
    }

    struct EarnerInfo {
        address earnerAddress;
        uint256 earnedTokens;
    }

    DaToken public daTokenContract;
    MahToken public mahTokenContract;

    //uint256 public stakedDaTokenCount;

    address payable admin;

    mapping (address => StakerInfo) public stakerInfos;
    mapping (address => EarnerInfo) public earnerInfos;
    address[] stakers;
    address[] earners;

    event Stake(address _staker, uint256 _daTokenAmount);
    event WithdrawStakedToken(address _staker, uint256 _withdrawTokenAmount);
    event WithdrawEarnedToken(address _earner, uint256 _withdrawTokenAmount);

    constructor(DaToken _daTokenContract, MahToken _mahTokenContract) public {
        daTokenContract = _daTokenContract;
        mahTokenContract = _mahTokenContract;
        admin = msg.sender;
    }

    function stakeDaToken(uint256 _daTokenAmount) public {
        require(_daTokenAmount > 0);
        require(daTokenContract.balanceOf(msg.sender) >= _daTokenAmount);

        daTokenContract.transferFrom(msg.sender, address(this), _daTokenAmount);

        if (!doesStakerExist(msg.sender)) {
            stakerInfos[msg.sender].stakerAddress = msg.sender;
            stakerInfos[msg.sender].stakedTokens = stakerInfos[msg.sender].stakedTokens + _daTokenAmount;
            stakers.push(msg.sender);
        }

        addStakerToEarners(msg.sender);

        emit Stake(msg.sender, _daTokenAmount);
    }

    function addStakerToEarners(address _earner) private {
        if (!doesEarnerExist(_earner)) {
            // Initially adding earner info to the earner mapping once they stake a token
            earnerInfos[_earner].earnerAddress = _earner;
            earnerInfos[_earner].earnedTokens = 0;
            earners.push(_earner);
        }
    }

    function doesStakerExist(address _staker) public returns (bool) {
        bool stakerExist = false;

        for (uint i; i< stakers.length;i++){
          if (stakers[i] == _staker)
          stakerExist = true;
        }

        return stakerInfos[_staker].stakerAddress != address(0) && stakerExist;
    }

    function stakedTokensOfStaker(address _staker) public returns (uint256) {
        return stakerInfos[_staker].stakedTokens;
    }

    function earnedTokensOfEarner(address _earner) public returns (uint256) {
        return earnerInfos[_earner].earnedTokens;
    }

    function withdrawStakedTokens(uint256 _withdrawTokenAmount) public {
        require(doesStakerExist(msg.sender));
        require(_withdrawTokenAmount > 0);
        require(stakerInfos[msg.sender].stakedTokens > 0); // make sure that Staker has a staked tokens
        require(stakerInfos[msg.sender].stakedTokens >= _withdrawTokenAmount);
        
        stakerInfos[msg.sender].stakedTokens = stakerInfos[msg.sender].stakedTokens - _withdrawTokenAmount;
        daTokenContract.transfer(msg.sender, _withdrawTokenAmount);

        removeStaker(msg.sender);

        emit WithdrawStakedToken(msg.sender, _withdrawTokenAmount);
    }

    function removeStaker(address _staker) private {
        if (stakerInfos[_staker].stakedTokens == 0) {
            delete stakerInfos[_staker];
        }
        for (uint i; i< stakers.length;i++){
          if (stakers[i] == _staker) {
              delete stakers[i];
          }
        }
    }

    function withdrawEarnedTokens(uint256 _withdrawTokenAmount) public {
        require(doesEarnerExist(msg.sender));
        require(_withdrawTokenAmount > 0);
        require(earnedTokensOfEarner(msg.sender) > 0); // Make sure that earner has earned tokens
        require(_withdrawTokenAmount <= earnedTokensOfEarner(msg.sender));
        
        earnerInfos[msg.sender].earnedTokens = earnerInfos[msg.sender].earnedTokens - _withdrawTokenAmount;
        mahTokenContract.transfer(msg.sender, _withdrawTokenAmount);

        removeEarner(msg.sender);

        emit WithdrawEarnedToken(msg.sender, _withdrawTokenAmount);
    }

    function doesEarnerExist(address _earner) public returns (bool) {
        bool earnerExist = false;

        for (uint i; i< earners.length;i++){
          if (earners[i] == _earner)
          earnerExist = true;
        }

        return earnerInfos[_earner].earnerAddress != address(0) && earnerExist;
    }

    function removeEarner(address _earner) private {
        if (earnerInfos[_earner].earnedTokens == 0) {
            delete earnerInfos[_earner];
        }
        for (uint i; i< earners.length;i++){
          if (earners[i] == _earner) {
              delete earners[i];
          }
        }
    }
    
    function distributeMahTokens(uint amountPerStakers) public {
        require(msg.sender == admin);

        for (uint256 i=0; i < stakers.length; i++) {
            /*
            if (!doesEarnerExist(stakers[i])) {
                earnerInfos[stakers[i]].earnerAddress = stakers[i];
                earners.push(stakers[i]);
            }*/
            earnerInfos[stakers[i]].earnedTokens = earnerInfos[stakers[i]].earnedTokens + amountPerStakers;
        }
    }
}