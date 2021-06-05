var DaToken = artifacts.require("./DaToken.sol");

contract('DaToken', function(accounts) {
  var tokenInstance;

  it('initializes the contract with the correct values', function() {
    return DaToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.name();
    }).then(function(name) {
      assert.equal(name, 'DaToken', 'token contains the correct name');
      return tokenInstance.symbol();
    }).then(function(symbol) {
      assert.equal(symbol, 'DAT', 'token contains the correct symbol');
      return tokenInstance.standard();
    }).then(function(standard) {
      assert.equal(standard, 'DaToken v0.0.1', 'token contains the correct standard');
    });
  });

  it('contains the correct amount of supply', function() {
    return DaToken.deployed().then(function(instance) {
        tokenInstance = instance;
        return tokenInstance.totalSupply();
    }).then(function(totalSupply) {
        var expectedTotalSupply = 1000000;
        assert.equal(totalSupply, expectedTotalSupply, 'token contains the right amount of supply');
        return tokenInstance.balanceOf(accounts[0]);
    }).then(function(accountBalance) {
        var expectedAccountBalance = 1000000;
        assert.equal(accountBalance, expectedAccountBalance, 'token contains correct amount of balance');
    });
  });

  it('can transfer tokens from one account to another', function() {
    return DaToken.deployed().then(function(instance) {
        tokenInstance = instance;
        // Test to fail transfer if value specified to transfer by the caller is more than what the caller obtains
        return tokenInstance.transfer.call(accounts[1], 99999999999, { from: accounts[0] });
    }).then(assert.fail).catch(function(error) {
        assert(error.message.indexOf('revert') >= 0, 'error message of transfer fail must contain revert');
        return tokenInstance.transfer.call(accounts[1], 250, { from: accounts[0] });
    }).then(function(success) {
        assert.equal(success, true, 'transfer returns true');
        return tokenInstance.transfer(accounts[1], 250, { from: accounts[0] });
    }).then(function(transferEvent) {
        assert.equal(transferEvent.logs.length, 1, 'transfer() call should emit 1 event');
        assert.equal(transferEvent.logs[0].event, 'Transfer', 'event emitted should be "Transfer"');
        assert.equal(transferEvent.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from using the transfer()');
        assert.equal(transferEvent.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to using the transfer()');
        assert.equal(transferEvent.logs[0].args._value, 250, 'logs the transfer amount using the transfer()');
        return tokenInstance.balanceOf(accounts[1]);
    }).then(function(receiverBalance) {
        var expectedReceiverBalance = 250;
        assert.equal(receiverBalance, expectedReceiverBalance, 'the receiver of the transferred tokens should have the right amount of tokens');
        return tokenInstance.balanceOf(accounts[0]);
    }).then(function(senderBalance) {
        var expectedSenderBalance = 999750;
        assert.equal(senderBalance, expectedSenderBalance, 'the sender of the transferred tokens should have the right amount of tokens');
    });
  }); 

  it('approves tokens for delegated transfer', function() {
    return DaToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.approve.call(accounts[1], 100);
    }).then(function(success) {
      assert.equal(success, true, 'it returns true');
      return tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
    }).then(function(transferEvent) {
      assert.equal(transferEvent.logs.length, 1, 'approve() triggers one event');
      assert.equal(transferEvent.logs[0].event, 'Approval', 'event triggered should be the "Approval" event');
      assert.equal(transferEvent.logs[0].args._owner, accounts[0], 'logs the account the tokens are authorized by');
      assert.equal(transferEvent.logs[0].args._spender, accounts[1], 'logs the account the tokens are authorized to');
      assert.equal(transferEvent.logs[0].args._value, 100, 'logs the transfer amount');
      return tokenInstance.allowance(accounts[0], accounts[1]);
    }).then(function(allowance) {
      assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated trasnfer');
    });
  });

  it('handles delegated token transfers', function() {
    return DaToken.deployed().then(function(instance) {
      tokenInstance = instance;
      fromAccount = accounts[2];
      toAccount = accounts[3];
      spendingAccount = accounts[4];
      // Transfer some tokens to fromAccount
      return tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });
    }).then(function(transferEvent) {
      // Approve spendingAccount to spend 10 tokens form fromAccount
      return tokenInstance.approve(spendingAccount, 10, { from: fromAccount });
    }).then(function(transferEvent) {
      // Try transferring something larger than the sender's balance
      return tokenInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
      // Try transferring something larger than the approved amount
      return tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
      return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
    }).then(function(success) {
      assert.equal(success, true);
      return tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });
    }).then(function(transferEvent) {
      assert.equal(transferEvent.logs.length, 1, 'triggers one event');
      assert.equal(transferEvent.logs[0].event, 'Transfer', 'should be the "Transfer" event');
      assert.equal(transferEvent.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from');
      assert.equal(transferEvent.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to');
      assert.equal(transferEvent.logs[0].args._value, 10, 'logs the transfer amount');
      return tokenInstance.balanceOf(fromAccount);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 90, 'deducts the amount from the sending account');
      return tokenInstance.balanceOf(toAccount);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 10, 'adds the amount from the receiving account');
      return tokenInstance.allowance(fromAccount, spendingAccount);
    }).then(function(allowance) {
      assert.equal(allowance.toNumber(), 0, 'deducts the amount from the allowance');
    });
  });

});