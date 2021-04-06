// Depedencies
const http = require("http")
const prompt = require('prompt');
const readline = require('readline');
// Read line boilerplate
const lineReader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const socketIo = require("socket.io-client");
// Connects to server.js
const io = socketIo.connect("http://" + process.argv[2] + ":" + process.argv[3], {
    reconnect: true
});
let win = false;
// Called when a message is sent detailing what player you are
io.on("message", (playerNum) => {
    if (playerNum === 1) {
        console.log("You are Player 1");
    } else if (playerNum === 2) {
        console.log("You are Player 2");
    } else {
        console.log("Lobby is full");
    }
    io.on("win", msg => {
        win = true;
        console.log(msg);
    })
    // Prints the board when sent by server
    io.on("board", board => {
        console.log(board[1] + " " + board[2] + " " + board[3]);
        console.log(board[4] + " " + board[5] + " " + board[6]);
        console.log(board[7] + " " + board[8] + " " + board[9]);
    });
    // requests a turn when server calls for it
    io.on("turn", res => {
        if (res !== "") {
            console.log(res);
        }
        lineReader.question('Command: ', function (result) {
            if (win === true) {
                return lineReader.close();
            }
            if (result === "r") {
                io.emit("exit", "");
            } else {
                io.emit("move", result);
            }
        });
    })
});