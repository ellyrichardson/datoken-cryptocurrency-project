const { assert } = require("chai");

var MahToken = artifacts.require("./MahToken.sol");
var DaToken = artifacts.require("./DaToken.sol");
var MahYieldFarm = artifacts.require("./MahYieldFarm.sol");

contract('MahYieldFarm', function(accounts) {
  var yieldFarmInstance;
  var daTokenInstance;
  var mahTokenInstance;
  var yieldFarmUser = accounts[1];
  var yieldFarmUser2 = accounts[2];
  var yieldFarmUser3 = accounts[3];
  var admin = accounts[0];

  // Vars for the endTokenSaleTest


  it('initializes the contract with the correct values', function() {
    return MahYieldFarm.deployed().then(function(instance) {
      yieldFarmInstance = instance;
      return yieldFarmInstance.address;
    }).then(function(yieldFarmAddress) {
      assert.notEqual(yieldFarmAddress, '0x0', 'yield farm contract contains an address');
    });
  });

  it('staking DaTokens work as expected', function() {
    return MahYieldFarm.deployed().then(function(instance) {
      yieldFarmInstance = instance;
      return DaToken.deployed();
    }).then(function(instance) {
      daTokenInstance = instance;
      return MahToken.deployed();
    }).then(function(instance) {
        mahTokenInstance = instance;
        return daTokenInstance.approve(yieldFarmInstance.address, 10, { from: yieldFarmUser });
    }).then(function(approval) {
      var daTokenToStakeAmount = 10;
      return yieldFarmInstance.stakeDaToken(daTokenToStakeAmount, { from: yieldFarmUser });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'Staker cannot stake daTokens if it doesnt have enough daTokens');
      return yieldFarmInstance.doesStakerExist.call(yieldFarmUser, { from: yieldFarmUser });
    }).then(function(stakerExist) {
        assert.equal(false, stakerExist, 'YieldFarmUser must not be added to staker list of the YieldFarm');
        var daTokenToStakeAmount = 0;
        return yieldFarmInstance.stakeDaToken(daTokenToStakeAmount, { from: yieldFarmUser });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'Staker cannot stake daTokens if the stake amount is zero');
      // Transferring some tokens to the user
      return yieldFarmInstance.doesStakerExist.call(yieldFarmUser, { from: yieldFarmUser });
    }).then(function(stakerExist) {
        assert.equal(false, stakerExist, 'YieldFarmUser must not be added to staker list of the YieldFarm');
        // Transferring some tokens to the user
      return daTokenInstance.transfer(yieldFarmUser, 100, { from: accounts[0] });
    }).then(function(receipt) {
        return daTokenInstance.balanceOf(yieldFarmUser);
    }).then(function(balance) {
        assert.equal(100, balance, 'YieldFarmUser should have correct balance');
        var daTokenToStakeAmount = 10;
        return yieldFarmInstance.stakeDaToken(daTokenToStakeAmount, { from: yieldFarmUser });
    }).then(function(stakeEvent) {
        assert.equal(stakeEvent.logs.length, 1, 'triggers one Sell event');
      assert.equal(stakeEvent.logs[0].event, 'Stake', 'should be the "Stake" event');
      assert.equal(stakeEvent.logs[0].args._staker, yieldFarmUser, 'should be the address of the yield farm user');
      assert.equal(stakeEvent.logs[0].args._daTokenAmount, 10, 'should have the correct token amount');
        return daTokenInstance.balanceOf(yieldFarmUser);
    }).then(function(balance) {
        assert.equal(90, balance, 'YieldFarmUser should have correct balance');
        return yieldFarmInstance.doesStakerExist.call(yieldFarmUser, { from: yieldFarmUser });
    }).then(function(stakerExist) {
        assert.equal(true, stakerExist, 'YieldFarmUser must be added to staker list of the YieldFarm');
        return yieldFarmInstance.stakedTokensOfStaker.call(yieldFarmUser, { from: yieldFarmUser });
    }).then(function(stakerTokens) {
      assert.equal(10, stakerTokens, 'YieldFarm must keep track the staked tokens of the staker');
    });
  });

  it('Distribution of MahTokens to Stakers work as expected', function() {
    return MahYieldFarm.deployed().then(function(instance) {
      yieldFarmInstance = instance;
      return DaToken.deployed();
    }).then(function(instance) {
      daTokenInstance = instance;
      return MahToken.deployed();
    }).then(function(stakerExist) {
      // Transferring some tokens to the user
      return daTokenInstance.transfer(yieldFarmUser, 100, { from: accounts[0] });
    }).then(function(instance) {
        mahTokenInstance = instance;
        return daTokenInstance.approve(yieldFarmInstance.address, 10, { from: yieldFarmUser });
    }).then(function(blah) {
      var daTokenToStakeAmount = 10;
      return yieldFarmInstance.stakeDaToken(daTokenToStakeAmount, { from: yieldFarmUser });
    }).then(function(blah) {
      return yieldFarmInstance.earnedTokensOfEarner.call(yieldFarmUser, { from: yieldFarmUser });
    }).then(function(balance) {
      assert.equal(0, balance, 'YieldFarmUser should not have any MahTokens balance in the YieldFarm');
      var mahTokensToDistribute = 1;
      return yieldFarmInstance.distributeMahTokens(mahTokensToDistribute, { from: yieldFarmUser });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'Non-Admins cant distribute MahTokens to Stakers');
      return yieldFarmInstance.earnedTokensOfEarner.call(yieldFarmUser, { from: yieldFarmUser });
    }).then(function(balance) {
      assert.equal(0, balance, 'YieldFarmUser should not have any MahTokens balance in the YieldFarm');
      var mahTokensToDistribute = 1;
      return yieldFarmInstance.distributeMahTokens(mahTokensToDistribute, { from: admin });
    }).then(function(balance) {
      return yieldFarmInstance.earnedTokensOfEarner.call(yieldFarmUser, { from: yieldFarmUser });
    }).then(function(balance) {
      assert.equal(1, balance, 'YieldFarmUser should not have any MahTokens balance in the YieldFarm');
    });
  });

  it('Withdraw DaTokens should work as expected', function() {
    return MahYieldFarm.deployed().then(function(instance) {
      yieldFarmInstance = instance;
      return DaToken.deployed();
    }).then(function(instance) {
      daTokenInstance = instance;
      return MahToken.deployed();
    }).then(function(stakerExist) {
      return yieldFarmInstance.withdrawStakedTokens(10, { from: yieldFarmUser2 });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'Users cannot withdraw staked tokens if they havent staked yet');
      return daTokenInstance.transfer(yieldFarmUser2, 100, { from: accounts[0] });
    }).then(function(instance) {
        return daTokenInstance.approve(yieldFarmInstance.address, 10, { from: yieldFarmUser2 });
    }).then(function(blah) {
      var daTokenToStakeAmount = 10;
      return yieldFarmInstance.stakeDaToken(daTokenToStakeAmount, { from: yieldFarmUser2 });
    }).then(function(stakerExist) {
      return yieldFarmInstance.stakedTokensOfStaker.call(yieldFarmUser2, { from: yieldFarmUser2 });
    }).then(function(stakerTokens) {
      assert.equal(10, stakerTokens, 'YieldFarm must keep track the staked tokens of the staker');
      return yieldFarmInstance.withdrawStakedTokens(0, { from: yieldFarmUser2 });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'Users cannot withdraw zero amount of staked Tokens');
      return yieldFarmInstance.withdrawStakedTokens(10, { from: yieldFarmUser2 });
    }).then(function(withdrawStakeEvent) {
      assert.equal(withdrawStakeEvent.logs.length, 1, 'triggers one WithdrawStakedToken event');
      assert.equal(withdrawStakeEvent.logs[0].event, 'WithdrawStakedToken', 'should be the "WithdrawStakedToken" event');
      assert.equal(withdrawStakeEvent.logs[0].args._staker, yieldFarmUser2, 'should be the address of the yield farm user');
      assert.equal(withdrawStakeEvent.logs[0].args._withdrawTokenAmount, 10, 'should have the correct withdrawn token amount');
      return yieldFarmInstance.stakedTokensOfStaker.call(yieldFarmUser2, { from: yieldFarmUser2 });
    }).then(function(stakerTokens) {
      assert.equal(0, stakerTokens, 'Yield farm must reflect amount of staked tokens left for the staker');
      return yieldFarmInstance.doesStakerExist.call(yieldFarmUser2, { from: yieldFarmUser2 });
    }).then(function(stakerExist) {
      assert.equal(false, stakerExist, 'YieldFarmUser must be removed from staker list of the YieldFarm');
    });
  });

  it('Withdraw MahTokens should work as expected', function() {
    return MahYieldFarm.deployed().then(function(instance) {
      yieldFarmInstance = instance;
      return DaToken.deployed();
    }).then(function(instance) {
      daTokenInstance = instance;
      return MahToken.deployed();
    }).then(function(instance) {
        return daTokenInstance.approve(yieldFarmInstance.address, 10, { from: yieldFarmUser3 });
    }).then(function(blah) {
      var daTokenToStakeAmount = 10;
      return yieldFarmInstance.stakeDaToken(daTokenToStakeAmount, { from: yieldFarmUser3 });
    }).then(function(blah) {
      return yieldFarmInstance.withdrawEarnedTokens(10, { from: yieldFarmUser3 });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'Users cannot withdraw earned tokens if they havent staked yet');
      var mahTokensToDistribute = 1;
      return yieldFarmInstance.distributeMahTokens(mahTokensToDistribute, { from: admin });
    }).then(function(blah) {
      return yieldFarmInstance.earnedTokensOfEarner.call(yieldFarmUser3, { from: yieldFarmUser3 });
    }).then(function(earnedTokens) {
      console.log("Earned tokens");
      console.log(earnedTokens);
      assert.equal(1, earnedTokens, 'YieldFarm must keep track the earned tokens of the staker');
      return yieldFarmInstance.withdrawEarnedTokens(0, { from: yieldFarmUser3 });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'Users cannot withdraw earned tokens if the withdrawn amount is 0');
      console.log("Earned tokens2");
      //return yieldFarmInstance.withdrawEarnedTokens(2, { from: yieldFarmUser3 });
    })/*.then(assert.fail).catch(function(error) {
      //assert(error.message.indexOf('revert') >= 0, 'Users cannot withdraw earned tokens if the withdrawn amount is greater than what they earned');
      console.log("Earned tokens3");
    //  return yieldFarmInstance.withdrawEarnedTokens(1, { from: yieldFarmUser3 });
    })*//*.then(function(withdrawEarnedEvent) {
      assert.equal(withdrawEarnedEvent.logs.length, 1, 'triggers one WithdrawEarnedEvent event');
      assert.equal(withdrawEarnedEvent.logs[0].event, 'WithdrawEarnedEvent', 'should be the "WithdrawEarnedEvent" event');
      assert.equal(withdrawEarnedEvent.logs[0].args._earner, yieldFarmUser3, 'should be the address of the yield farm user');
      assert.equal(withdrawEarnedEvent.logs[0].args._withdrawTokenAmount, 1, 'should have the correct withdrawn token amount');
      //return yieldFarmInstance.earnedTokensOfEarner.call(yieldFarmUser2, { from: yieldFarmUser2 });
    })*/;
  });
});