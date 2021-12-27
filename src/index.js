import { initializeApp } from 'firebase/app'
import {
    getFirestore, collection, onSnapshot,
    addDoc, deleteDoc, doc,
    query, where,
    orderBy, serverTimestamp,
    getDoc, updateDoc, setDoc, increment, limit
} from 'firebase/firestore'
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword, signOut,
    onAuthStateChanged,
    reload
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCSCBy0iQIERmCCBZsdftpz1kleiDYMjWI",
    authDomain: "minesweeper-74a91.firebaseapp.com",
    projectId: "minesweeper-74a91",
    storageBucket: "minesweeper-74a91.appspot.com",
    messagingSenderId: "97339507701",
    appId: "1:97339507701:web:8fe6068b10124d61b596bc"
};

// init firebase app
initializeApp(firebaseConfig);

// init services
const db = getFirestore();
const auth = getAuth();



// Global variables
var difficulty = '';


// Event listeners

// Beginner button
const beginnerDiffBtn = document.querySelector('#diff-beg');
beginnerDiffBtn.addEventListener('click', () => {
    difficulty = 'beginner';
    generateCoverTiles(difficulty);
});

// Intermediate button
const intermediateDiffBtn = document.querySelector('#diff-int');
intermediateDiffBtn.addEventListener('click', () => {
    difficulty = 'intermediate';
    generateCoverTiles(difficulty);
});

// Expert button
const expertDiffBtn = document.querySelector('#diff-exp');
expertDiffBtn.addEventListener('click', () => {
    difficulty = 'expert';
    generateCoverTiles(difficulty);
});

// Creates the cover tiles
// TODO: add custom difficulty option
function generateCoverTiles(difficulty) {
    let boardWidth;
    let boardHeight;
    if (difficulty === 'beginner') {
        boardWidth = 9;
        boardHeight = 9;
    }
    else if (difficulty === 'intermediate') {
        boardWidth = 16;
        boardHeight = 16;
    }
    else if (difficulty === 'expert') {
        boardWidth = 30;
        boardHeight = 16;
    }

    cleanBoard();
    createCoverTileRows(boardHeight, boardWidth);
    setCoverTileProperties();
}

// Clears the board's rows
function cleanBoard() {
    const rows = document.querySelectorAll('.tile-row');
    const length = rows.length;
    console.log('removing ' + rows.length + ' rows');
    for (let i = 0; i < length; i++) {
        rows[i].remove();
    }
}

// Creates new divs and adds cover_block images to it
function createCoverTileRows(boardHeight, boardWidth) {
    for (let r = 0; r < boardHeight; r++) {
        const border5 = document.querySelector('#border5');
        const tileRowDiv = document.createElement('div');
        tileRowDiv.classList.add('tile-row');
        border5.appendChild(tileRowDiv);
        for (let c = 0; c < boardWidth; c++) {
            const coverTileImg = document.createElement('img');
            coverTileImg.classList.add('cover-tile');
            coverTileImg.src = '../images/cover_block.png';
            tileRowDiv.appendChild(coverTileImg);
        }
    }
}

// Updates mine count and the alternates the image between cover_block and cover_block_flag
function setCoverTileProperties() {
    const coverTiles = document.querySelectorAll('.cover-tile');
    for (let i = 0; i < coverTiles.length; i++) {
        coverTiles[i].addEventListener('contextmenu', (e) => {
            e.preventDefault();

            const imgSrc = coverTiles[i].src + "";
            if (imgSrc.includes('flag')) {
                coverTiles[i].src = '../images/cover_block.png';
                numMines++;
            }
            else {
                coverTiles[i].src = '../images/cover_block_flag.png'
                numMines--;
            }
            displayMineCount(numMines);
        });
    }
}

// TODO: input validation: numbers greater than 999
let numMines = 0;
const mineFormRef = document.querySelector('#user-mines-form');
mineFormRef.addEventListener('submit', (e) => {
    e.preventDefault();

    numMines = mineFormRef.mines.value;
    console.log(numMines);

    displayMineCount(numMines);
});

// Changes the displayed flag counter
// TODO: refactor this, probably can shorten it by a lot
function displayMineCount(numMines) {
    let digits = [];
    let isNegative = false;
    if (numMines == 0) {
        digits.push(0);
    }
    else if (numMines < 0) {
        isNegative = true;
        numMines *= -1;
    }
    while (numMines > 0) {
        digits.push(numMines % 10);
        numMines = Math.floor(numMines / 10);
    }
    if (isNegative) {
        if (digits.length == 1) {
            document.querySelector('#red-num-mine-right').src = "../images/red_" + digits[0] + ".png";
            document.querySelector('#red-num-mine-mid').src = "../images/minus.png";
            document.querySelector('#red-num-mine-left').src = "../images/red_0.png";

        }
        else if (digits.length == 2) {
            document.querySelector('#red-num-mine-right').src = "../images/red_" + digits[0] + ".png";
            document.querySelector('#red-num-mine-mid').src = "../images/red_" + digits[1] + ".png";
            document.querySelector('#red-num-mine-left').src = "../images/minus.png";
        }
    }
    else {
        if (digits.length == 1) {
            document.querySelector('#red-num-mine-right').src = "../images/red_" + digits[0] + ".png";
            document.querySelector('#red-num-mine-mid').src = "../images/red_0.png";
            document.querySelector('#red-num-mine-left').src = "../images/red_0.png";

        }
        else if (digits.length == 2) {
            document.querySelector('#red-num-mine-right').src = "../images/red_" + digits[0] + ".png";
            document.querySelector('#red-num-mine-mid').src = "../images/red_" + digits[1] + ".png";
            document.querySelector('#red-num-mine-left').src = "../images/red_0.png";
        }
        else {
            document.querySelector('#red-num-mine-right').src = "../images/red_" + digits[0] + ".png";
            document.querySelector('#red-num-mine-mid').src = "../images/red_" + digits[1] + ".png";
            document.querySelector('#red-num-mine-left').src = "../images/red_" + digits[2] + ".png";
        }
    }
}



// Code for the timer

//Global variables
var startTime;
var interval;

// Starts the timer
function startTimer() {
    startTime = Date.now();
    var time = 0;
    const delay = 1000;

    interval = setInterval(() => {
        time++;
        updateDisplay(time);
        // console.log('hi');
    }, delay);
}

// Stops the timer and returns the end time
function stopTimer() {
    clearInterval(interval);
    return Date.now() - startTime;
}

// Updates the timer display
function updateDisplay(time) {
    const numbers = [];
    for (let i = 0; i <= 9; i++) {
        numbers[i] = "../images/red_" + i + ".png";
    }
    
    const leftTime = document.querySelector("#red-num-timer-left");
    const midTime = document.querySelector("#red-num-timer-mid");
    const rightTime = document.querySelector("#red-num-timer-right");

    if (!(time > 999)) {
        rightTime.src = numbers[time % 10];
        midTime.src = numbers[Math.floor(time / 10) % 10];
        leftTime.src = numbers[Math.floor(time / 100)];
    }
}

// Event listeners
const startTimeBtn = document.querySelector('#start-timer');
startTimeBtn.addEventListener('click', () => {
    startTimer();
});

const stopTimeBtn = document.querySelector('#stop-timer');
stopTimeBtn.addEventListener('click', () => {
    const endTime = stopTimer();
    console.log(endTime);
});