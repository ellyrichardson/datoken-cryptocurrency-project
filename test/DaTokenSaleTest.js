var DaTokenSale = artifacts.require("./DaTokenSale.sol");

contract('DaTokenSale', function(accounts) {
  var tokenSaleInstance;

  it('initializes the contract with the correct values', function() {
    return DaTokenSale.deployed().then(function(instance) {
      tokenSaleInstance = instance;
      return tokenSaleInstance.address;
    }).then(function(tokenSaleAddress) {
      assert.notEqual(tokenSaleAddress, '0x0', 'tokenSale contract contains an address');
      return tokenSaleInstance.daTokenContract();
    }).then(function(daTokenContract) {
      assert.notEqual(daTokenContract.address, '0x0', 'DA token contract contains an address');
      return tokenSaleInstance.daTokenPrice();
    }).then(function(tokenPrice) {
      var expectedPriceInEther = 1000000000000000;
      assert.equal(expectedPriceInEther, tokenPrice, 'token price is the expected price');
    });
  });
});