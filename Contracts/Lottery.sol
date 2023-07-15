// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lottery {
    address public manager;
    address[] public participants;
    uint[] public sentAmounts;
    event WinnerPicked(address indexed winner, uint amount);

    constructor() {
        manager = msg.sender;
    }

    modifier managerOnly() {
        require(msg.sender == manager);
        _;
    }

    function entry() public payable {
        require(msg.value > 0.1 ether, "Minimum amount of wei required");
        participants.push(msg.sender);
        sentAmounts.push(msg.value);
    }

    function getParticipants() public view returns (address[] memory) {
        return participants;
    }

    function getAmounts() public view returns (uint[] memory) {
        return sentAmounts;
    }

    function sortParticipantsByAmounts() public {
        for (uint i = 0; i < sentAmounts.length - 1; i++) {
            for (uint j = 0; j < sentAmounts.length - i - 1; j++) {
                if (sentAmounts[j] < sentAmounts[j + 1]) {
                    address tempParticipant = participants[j];
                    participants[j] = participants[j + 1];
                    participants[j + 1] = tempParticipant;

                    uint tempAmount = sentAmounts[j];
                    sentAmounts[j] = sentAmounts[j + 1];
                    sentAmounts[j + 1] = tempAmount;
                }
            }
        }
    }

    function randomInt() private view returns (uint) {
        return
            uint(
                keccak256(
                    abi.encodePacked(
                        block.prevrandao,
                        block.timestamp,
                        participants
                    )
                )
            );
    }

    function pickWinner() public managerOnly {
        require(participants.length > 0, "No participants in the lottery.");

        uint index = randomInt() % participants.length;
        address payable winner = payable(participants[index]);

        uint balance = address(this).balance;
        require(balance > 0, "No balance in the contract.");

        // M1(bool success, ) = winner.call{value: balance}("");
        bool success = winner.send(balance);
        require(success, "Failed to send funds to the winner.");

        emit WinnerPicked(winner, balance);

        // m1 participants = new address[](0); it resets the old array for populatuon and puts it back to length 0
        delete participants; // this deletes the the array and frees the memory and resets the array back to length 0
    }
}
