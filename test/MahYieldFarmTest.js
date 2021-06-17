const { assert } = require("chai");

var MahToken = artifacts.require("./MahToken.sol");
var DaToken = artifacts.require("./DaToken.sol");
var MahYieldFarm = artifacts.require("./MahYieldFarm.sol");

contract('MahYieldFarm', function(accounts) {
  var yieldFarmInstance;
  var daTokenInstance;
  var mahTokenInstance;
  var yieldFarmUser = accounts[1];

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
    });
  });
});