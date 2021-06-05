
var DaToken = artifacts.require("./DaToken.sol");

var totalSupply = 1000000;

module.exports = function(deployer) {
  return deployer.deploy(DaToken, totalSupply);
};