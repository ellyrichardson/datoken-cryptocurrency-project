var DaTokenSale = artifacts.require("./DaTokenSale.sol");
var DaToken = artifacts.require("./DaToken.sol")

contract('DaTokenSale', function(accounts) {
  var tokenSaleInstance;
  var tokenInstance;
  var admin = accounts[0];
  var buyer = accounts[1];
  var tokenPrice;
  var numberOfTokens;

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

  it('buyTokens transfers bought tokens to the buyer', function() {
    return DaToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return DaTokenSale.deployed()
    }).then(function(instance) {
      tokenSaleInstance = instance;
      // Token sale Supply is only 5000 so that the test accounts will have enough ether when testing buying more than the supply
      var tokenSaleSupply = 5000;
      // Transferring tokens to the TokenSale
      return tokenInstance.transfer(tokenSaleInstance.address, tokenSaleSupply, { from: admin });
    }).then(function(receipt) {
      return tokenSaleInstance.daTokenPrice();
    }).then(function(daTokenPrice) {
      tokenPrice = daTokenPrice;
      numberOfTokens = 100;
      return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
    }).then(function(sellEvent) {
      assert.equal(sellEvent.logs.length, 1, 'triggers one Sell event');
      assert.equal(sellEvent.logs[0].event, 'Sell', 'should be the "Sell" event');
      assert.equal(sellEvent.logs[0].args._buyer, buyer, 'should be the address of the buyer');
      assert.equal(sellEvent.logs[0].args._tokenAmount, numberOfTokens, 'should have the correct token amount');
      var expectedTotalCost = numberOfTokens * tokenPrice;
      assert.equal(sellEvent.logs[0].args._totalCost, expectedTotalCost, 'should have the correct total cost');
      return tokenInstance.balanceOf(buyer);
    }).then(function(buyerTokenBalance) {
      var expectedBuyerTokenBalance = 100;
      assert.equal(buyerTokenBalance, expectedBuyerTokenBalance, 'buyer must have the correct token balance for DaToken');
      return tokenInstance.balanceOf(tokenSaleInstance.address);
    }).then(function(tokenSaleTokenBalance) {
      var expectedTokenSaleTokenBalance = 4900;
      assert.equal(tokenSaleTokenBalance, expectedTokenSaleTokenBalance, 'tokenSale must have the correct token balance for DaToken');
      // Buying tokens but Ether value of the buyer don't match with the expected value
      numberOfTokens = 100;
      return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 * tokenPrice });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot buy tokens if expected Ether value of the buyer dont match');
      // Buy tokens greater than the amount available
      numberOfTokens = 5000;
      return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot buy tokens larger than the amount of supply');
      numberOfTokens = 0;
      return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot buy tokens if the amount of tokens bought is 0');
    });
  });
});