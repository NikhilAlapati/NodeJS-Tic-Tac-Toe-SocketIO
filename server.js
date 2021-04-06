// Depedencies
const express = require("express");
const app = express();
const socketIo = require("socket.io");
const server = app.listen(process.argv[2]);
const io = socketIo(server);
// Total Players
let players = 0;
// Id of player one and player 2
let playerOne;
let playerTwo;
// Keep track of which player's turn it is
let playerOneTurn = true;
// Board of the tic tac toe. dictionary with key value pair
let board = {
    1: ".",
    2: ".",
    3: ".",
    4: ".",
    5: ".",
    6: ".",
    7: ".",
    8: ".",
    9: "."
};
// All the possible combinations to be able to win
const winCoordinates = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [3, 6, 9],
    [2, 5, 8], [1, 4, 7], [3, 5, 7], [1, 5, 9]];

// Checks for win by looping through the winCoordinate array and seeing if there is a match
function checkForWin(playerChar) {
    let conflicts;
    for (let i = 0; i < winCoordinates.length; i++) {
        conflicts = 0;
        for (let j = 0; j < winCoordinates[i].length; j++) {
            if (board[winCoordinates[i][j]] === playerChar) {
                conflicts++;
            }
            if (conflicts === 3) {
                return true;
            }
        }
    }
    return false;
}

// Checks if there is a tie by seeing if all the board is full NOTE: only called when there is no win
function checkTie() {
    for (let i = 1; i <= Object.keys(board).length; i++) {
        if (board[i] === ".") {
            return false;
        }
    }
    return true;
}

// Resets the board and game
function newGame() {
    Object.keys(board).forEach(function (key) {
        board[key] = ".";
    });
    playerOneTurn = true;
}

// Run when a player is connected
io.on("connection", socket => {
    console.log("connected");
    if (players === 0) {
        // Player 1 initialized
        socket.emit("message", 1);
        playerOne = socket.id;
        players++;
    } else if (players === 1) {
        // Player 2 initialized
        socket.emit("message", 2);
        playerTwo = socket.id;
        players++;
        // Starting the game only if player 2 is connected
        io.to(playerOne).emit("turn", "Game Started you are first");
    } else {
        // Invalid amount of players
        socket.emit("message", -1);
    }
    // Subtracts the total players when disconnected and resets the board and ends the game
    socket.on("disconnect", () => {
        if (players !== 0) {
            players--;
        }
        newGame();
        return;
    })
    // Runs when a move is sent by the client
    socket.on("move", msg => {
        // If player one's turn
        if (playerOneTurn) {
            // Is spot is already played
            if (board[msg] !== ".") {
                io.to(playerOne).emit("turn", "spot already taken");
            } else {
                // Changes spot
                board[msg] = "x";
                // If won or tie then resets game and sends win or tie message
                if (checkForWin("x")) {
                    io.emit("win", "Player 1 won");
                    newGame();
                    return;
                } else {
                    if (checkTie()) {
                        io.emit("win", "It's a TIE!!");
                        newGame();
                        return;
                    }
                }
                // Sends the board and starts player 2's turn
                io.emit("board", board);
                io.to(playerTwo).emit("turn", "");
                playerOneTurn = false;
            }
        } else {

            if (board[msg] !== ".") {
                io.to(playerTwo).emit("turn", "spot already taken");
            } else {
                board[msg] = "o";
                // If won or tie then resets game and sends win or tie message
                if (checkForWin("o")) {
                    io.emit("win", "Player 2 won");
                    newGame();
                    return;
                } else {
                    if (checkTie()) {
                        io.emit("win", "It's a TIE!!");
                        newGame();
                        return;
                    }
                }
                // Sends the board and sets for for next player
                io.emit("board", board);
                io.to(playerOne).emit("turn", "");
                playerOneTurn = true;
            }
        }
    });
    // Resign code
    socket.on("exit", (msg) => {
        if (socket.id === playerOne) {
            io.emit("win", "Game won by second player");
            newGame();
        } else if (socket.id === playerTwo) {
            io.emit("win", "Game won by first player");
            newGame();
        }
    });
});


