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
      var daTokenToStakeAmount = 10;
      return yieldFarmInstance.stakeDaToken(daTokenToStakeAmount, { from: yieldFarmUser });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'Staker cannot stake daTokens if it doesnt have enough daTokens');
      var daTokenToStakeAmount = 0;
      return yieldFarmInstance.stakeDaToken(daTokenToStakeAmount, { from: yieldFarmUser });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'Staker cannot stake daTokens if the stake amount is zero');
      // Transferring some tokens to the user
      return daTokenInstance.transferFrom(yieldFarmUser, 100, { from: accounts[0] });
    }).then(function(receipt) {
      var daTokenToStakeAmount = 10;
      return yieldFarmInstance.stakeDaToken(daTokenToStakeAmount, { from: yieldFarmUser });
    }).then(function(stakeEvent) {
      assert.equal(stakeEvent.logs.length, 1, 'triggers one Sell event');
      assert.equal(stakeEvent.logs[0].event, 'Stake', 'should be the "Sell" event');
      //assert.equal(stakeEvent.logs[0].args._buyer, buyer, 'should be the address of the buyer');
    });
  });
});