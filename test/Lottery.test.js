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
    await lottery.methods.entry().send({ from: accounts[1], value: '1000000000000000000', gas: '1000000' });
    const participants = await lottery.methods.participants(0).call({ from: accounts[1] });
    const sentAmounts = await lottery.methods.sentAmounts(0).call({ from: accounts[1] });
    assert.equal(participants, accounts[1]);
    assert.equal(sentAmounts, '1000000000000000000');
  });

  it('sorts participants by amounts', async () => {
    const entryData = [
      { account: accounts[1], value: '1000000000000000000' },
      { account: accounts[2], value: '2000000000000000000' },
      { account: accounts[3], value: '5000000000000000000' },
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
      { participant: accounts[3], amount: '5000000000000000000' },
      { participant: accounts[2], amount: '2000000000000000000' },
      { participant: accounts[1], amount: '1000000000000000000' },
    ];
  
    for (let i = 0; i < expectedData.length; i++) {
      assert.equal(participants[i], expectedData[i].participant);
      assert.equal(amounts[i], expectedData[i].amount);
    }
  });

  it('requires a minimum amount of ether to enter', async() =>{
    try{
      await lottery.methods.entry().send({ from: accounts[1], value: '100000000000', gas: '1000000' });
      assert(false);
   }
    
   catch(err){
      assert(err);
   } 
  });
  
  
});
