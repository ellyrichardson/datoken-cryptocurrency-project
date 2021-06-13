
var DaToken = artifacts.require("./DaToken.sol");
var DaTokenSale = artifacts.require("./DaTokenSale.sol");
var MahToken = artifacts.require("./MahToken.sol");
var MahYieldFarm = artifacts.require("./MahYieldFarm.sol");

var daTokenTotalSupply = 1000000;
var mahTokenTotalSupply = 2000000;

module.exports = function(deployer) {
  deployer.deploy(DaToken, daTokenTotalSupply).then(function() {
    return deployer.deploy(MahToken, mahTokenTotalSupply);
  }).then(function() {
    return deployer.deploy(MahYieldFarm, DaToken.address, MahToken.address);
  }).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(DaTokenSale, DaToken.address, tokenPrice);
  });
};