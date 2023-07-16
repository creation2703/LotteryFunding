// const assert = require('assert');
// const ganache = require('ganache-cli');
// const { Web3 } = require('web3'); // used to be a constructor. Now returns an object.
// const web3 = new Web3(ganache.provider());
// const {abi, evm} = require('../compile');
// let accounts, inbox;
// const initialString = "Hello";
// beforeEach(async () => {
//     accounts = await web3.eth.getAccounts();
//     inbox = await new web3.eth.Contract(abi)
//     // tells the web3 library that there is a contract out there and it expects the following 
//     // interface
//       .deploy({ data: evm.bytecode.object, arguments : [initialString]}) 
//       // arguments are needed to be passed on to the constructor functions
//       .send({ from: accounts[0], gas: '1000000' });
//   });
  

// describe('Inbox', () => {
//     it('deploy the contract', async () =>{
//         console.log(inbox);
//         assert.ok(inbox.options.address); //ok checks if the passed value is defined 
//     });
//     it('default message', async () =>{
//         const message = await inbox.methods.message().call(); 
//         // call() to view the deployed contract
//         assert.equal(message, "Hello");
//     });
//     it('change the message', async () =>{
//         await inbox.methods.setString("dayumm").send({from : accounts[0]});
//         // send() sends the transactions
//         const newString = await inbox.methods.message().call();
//         assert.equal(newString, "dayumm");
//     });
// });
const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');
const web3 = new Web3(ganache.provider());

const { abi, evm } = require('../compile');

let accounts;
let lottery;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(abi)
    .deploy({
      data: evm.bytecode.object,
      arguments: [],
    })
    .send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery Contract', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('manager assign', async () => {
    const message = await lottery.methods.manager().call();
    assert.equal(message, accounts[0]);
  });

  it('participant entry', async () => {
    await lottery.methods.entry().send({ from: accounts[1], value: web3.utils.toWei('1', 'ether'), gas: '1000000' });
    const participants = await lottery.methods.participants(0).call({ from: accounts[1] });
    const sentAmounts = await lottery.methods.sentAmounts(0).call({ from: accounts[1] });
    assert.equal(participants, accounts[1]);
    assert.equal(sentAmounts, web3.utils.toWei('1', 'ether'));
  });

  it('sorts participants by amounts', async () => {
    const entryData = [
      { account: accounts[1], value: web3.utils.toWei('1', 'ether') },
      { account: accounts[2], value: web3.utils.toWei('2', 'ether') },
      { account: accounts[3], value: web3.utils.toWei('5', 'ether') },
    ];

    for (const { account, value } of entryData) {
      await lottery.methods.entry().send({ from: account, value: value, gas: '1000000' });
    }

    await lottery.methods.sortParticipantsByAmounts().send({ from: accounts[1] });

    const participants = [];
    const amounts = [];

    for (let i = 0; i < entryData.length; i++) {
      const participant = await lottery.methods.participants(i).call({ from: accounts[1] });
      const amount = await lottery.methods.sentAmounts(i).call({ from: accounts[1] });
      participants.push(participant);
      amounts.push(amount);
    }

    const expectedData = [
      { participant: accounts[3], amount: web3.utils.toWei('5', 'ether') },
      { participant: accounts[2], amount: web3.utils.toWei('2', 'ether') },
      { participant: accounts[1], amount: web3.utils.toWei('1', 'ether') },
    ];

    for (let i = 0; i < expectedData.length; i++) {
      assert.equal(participants[i], expectedData[i].participant);
      assert.equal(amounts[i], expectedData[i].amount);
    }
  });

  it('requires a minimum amount of ether to enter', async () => {
    try {
      await lottery.methods.entry().send({ from: accounts[1], value: web3.utils.toWei('0.0001', 'ether'), gas: '1000000' });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('only manager can pick the winner', async () => {
    try {
      await lottery.methods.pickWinner().send({ from: accounts[1] });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('sends money to the winner and resets the array', async () => {
    // Add participants
    await lottery.methods.entry().send({ from: accounts[0], value: web3.utils.toWei('2', 'ether'), gas: '1000000' });
    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await lottery.methods.pickWinner().send({from: accounts[0]});
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;

    assert.ok(difference > web3.utils.toWei('1.9', 'ether'), 'The difference is not greater than 1.5 ether');
});

});

