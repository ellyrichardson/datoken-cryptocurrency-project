
var DaToken = artifacts.require("./DaToken.sol");
var DaTokenSale = artifacts.require("./DaTokenSale.sol");

var totalSupply = 1000000;

module.exports = function(deployer) {
  deployer.deploy(DaToken, totalSupply).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(DaTokenSale, DaToken.address, tokenPrice);
  });
};