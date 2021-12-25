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
let auth = getAuth();


// Flag counter

// TODO: input validation: numbers greater than 999
let numMines = 0;
const mineFormRef = document.querySelector('#user-mines-form');
mineFormRef.addEventListener('submit', (e) => {
    e.preventDefault();

    numMines = mineFormRef.mines.value;
    console.log(numMines);

    displayMineCount(numMines);
});

// Check if mouse is over a cover tile
let isMouseOverCoverTile = false;
const coverTileRef = document.querySelector('.cover-tile');
coverTileRef.addEventListener('pointerover', () => {
    isMouseOverCoverTile = true;
    console.log('over');
});

coverTileRef.addEventListener('pointerleave', () => {
    isMouseOverCoverTile = false;
    console.log('leave');
});

// Check if mouse is over a flag tile
let isMouseOverFlagTile = false;
const coverFlagRef = document.querySelector('.flag-tile');
coverFlagRef.addEventListener('pointerover', () => {
    isMouseOverFlagTile = true;
});

coverFlagRef.addEventListener('pointerleave', () => {
    isMouseOverFlagTile = false;
});

// If a cover tile is right clicked, the flag count decreases
// If a flagged tile is right clicked, the flag count increases
// TODO: change the right clicked image to a flagged/cover tile
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    if (isMouseOverCoverTile) {
        numMines--;
        displayMineCount(numMines);
    }
    else if (isMouseOverFlagTile) {
        numMines++;
        displayMineCount(numMines);
    }

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