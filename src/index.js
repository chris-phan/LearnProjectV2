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
var difficulty = 'beginner';
var numClicks = 0;
var mousedown;
var lost = false; // hanson

// Document event listeners
// Used to switch cover tiles to blank tiles temporarily when left click is held down
// e.button: 0 = left click, 1 = middle click, 2 = right click
document.addEventListener('mousedown', (e) => {
    if (e.button == 0) {
        mousedown = true;
    }
});
document.addEventListener('mouseup', () => {
    mousedown = false;
});


// Onload:
generateCoverTiles('beginner');
setSmileyProperties();
displayMineCount(10); // hanson

// Toggling minefield alignment
const leftAlignBtn = document.querySelector('#left-align-btn');
const centerAlignBtn = document.querySelector('#center-align-btn');
const rightAlignBtn = document.querySelector('#right-align-btn');
const outerBorder = document.querySelector('#outer-border-id');

leftAlignBtn.addEventListener('click', () => {
    outerBorder.classList.remove('right');
    outerBorder.classList.remove('center-border');
    outerBorder.classList.add('left');
});

centerAlignBtn.addEventListener('click', () => {
    outerBorder.classList.remove('right');
    outerBorder.classList.remove('left');
    outerBorder.classList.add('center-border');
});

rightAlignBtn.addEventListener('click', () => {
    outerBorder.classList.remove('center-border');
    outerBorder.classList.remove('left');
    outerBorder.classList.add('right');
});

// Beginner button
const beginnerDiffBtn = document.querySelector('#diff-beg');
beginnerDiffBtn.addEventListener('click', () => {
    difficulty = 'beginner';
    generateCoverTiles(difficulty);
    numClicks = 0;
    stopTimer();
    resetTimer(); // hanson
    numMines = getNumMines(difficulty);
    displayMineCount(numMines);
});

// Intermediate button
const intermediateDiffBtn = document.querySelector('#diff-int');
intermediateDiffBtn.addEventListener('click', () => {
    difficulty = 'intermediate';
    generateCoverTiles(difficulty);
    numClicks = 0;
    stopTimer();
    resetTimer(); // hanson
    numMines = getNumMines(difficulty);
    displayMineCount(numMines);
});

// Expert button
const expertDiffBtn = document.querySelector('#diff-exp');
expertDiffBtn.addEventListener('click', () => {
    difficulty = 'expert';
    generateCoverTiles(difficulty);
    numClicks = 0;
    stopTimer();
    resetTimer(); // hanson
    numMines = getNumMines(difficulty);
    displayMineCount(numMines);
});

// Creates the cover tiles
// TODO: add custom difficulty option
function generateCoverTiles(difficulty) {
    let boardWidth;
    let boardHeight;
    let totMines;
    if (difficulty === 'beginner') {
        boardWidth = 9;
        boardHeight = 9;
        totMines = 10;
    }
    else if (difficulty === 'intermediate') {
        boardWidth = 16;
        boardHeight = 16;
        totMines = 40;
    }
    else if (difficulty === 'expert') {
        boardWidth = 30;
        boardHeight = 16;
        totMines = 99;
    }

    cleanBoard();
    createBlankTiles(boardHeight, boardWidth);
    setCoverTileProperties(totMines);
}

// Clears the board's rows
function cleanBoard() {
    // Looks for all ids starting with (^=) "div-row"
    const rows = document.querySelectorAll('[id^="div-row"]');
    const length = rows.length;
    console.log('removing ' + rows.length + ' rows');
    for (let i = 0; i < length; i++) {
        rows[i].remove();
    }
}

// Properties of cover tiles
function setCoverTileProperties(totMines) {
    const coverTiles = document.querySelectorAll('.cover-tile');
    for (let i = 0; i < coverTiles.length; i++) {

        // Updates mine count and the alternates the image between cover_block and cover_block_flag
        coverTiles[i].addEventListener('contextmenu', (e) => {
            e.preventDefault();

            if (!lost) {
                if (coverTiles[i].classList.contains('flag')) {
                    coverTiles[i].src = '../images/cover_block.png';
                    coverTiles[i].classList.remove('flag');
                    numMines++;
                }
                else {
                    coverTiles[i].src = '../images/cover_block_flag.png'
                    coverTiles[i].classList.add('flag');
                    numMines--;
                }
                displayMineCount(numMines);
            }
        });

        // Whenever a cover tile that is not over a mine is clicked, hide it
        coverTiles[i].addEventListener('mouseup', (e) => {
            if (!lost && !coverTiles[i].classList.contains('flag') && e.button == 0) {
                numClicks++;

                // On first click
                if (numClicks == 1) {
                    startTimer();
                    setMines(totMines, coverTiles[i]);
                    setMineProperties();
                    setNumberTiles();
                    setNumberTileProperties();
                    displayMineCount(totMines);
                }

                // Reveal all mines if a cover tile above a mine has been clicked
                if (coverTiles[i].classList.contains('mine')) {
                    stopTimer();
                    // substring(6) to get rid of 'cover-' to get 'row-#-col-#'
                    lost = true; // hanson
                    const mineId = 'mine-' + coverTiles[i].id.substring(6);
                    const mine = document.querySelector('#' + mineId);
                    mine.src = '../images/mine_clicked.png';
                    const smileyBtn = document.querySelector('#smiley-img');
                    smileyBtn.src = '../images/lose.png';
                    showAllMines();
                }

                // Always reveal a tile if an unflagged cover tile is left clicked
                reveal(coverTiles[i]);
            }
        });

        // When the mouse is held down and over a cover tile, switch it to a blank tile
        // When the mouse is held down and leaves a cover tile, switch it back to a cover tile
        coverTiles[i].addEventListener('mousedown', (e) => {
            if (!lost && e.button == 0 && !coverTiles[i].classList.contains('flag')) {
                coverTiles[i].src = '../images/tile_0.png';
            }
        });
        coverTiles[i].addEventListener('mouseover', () => {
            if (!lost && mousedown == true && !coverTiles[i].classList.contains('flag')) {
                coverTiles[i].src = '../images/tile_0.png';
            }
        });
        coverTiles[i].addEventListener('mouseleave', () => {
            if (!lost && coverTiles[i].src.includes('tile') && !coverTiles[i].classList.contains('flag')) {
                coverTiles[i].src = '../images/cover_block.png';
            }
        });
    }
}

// Reveals tiles and checks if the player has won
function reveal(coverTile) {
    // Parses coverTile's id to get 'tile-row-#-col-#'
    const numberTile = document.querySelector('#' + coverTile.id.substring(6));

    // If the tile underneath the cover tile is 0, chain reveal
    // Else, just reveal it
    if (numberTile !== null && numberTile.src.includes('tile_0')) {
        chainReveal(numberTile);
        checkWin();
    }
    else {
        coverTile.style.zIndex = -1;
        coverTile.classList.add('revealed');
        checkWin();
    }
}

// hanson
// Reveals all empty pockets that connect to a click
function chainReveal(tile) {

    // base case, all adjacent are revealed numbers or reached edge
    const coverTile = document.querySelector('#cover-' + tile.id);
    coverTile.classList.add('revealed');
    coverTile.style.zIndex = -1;

    // t: top,  m: middle,  b: bottom,  l: left,   r: right
    const pos = ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'];

    for (let i = 0; i < pos.length; i++) {

        const checkTile = getAdjacentTile(tile, pos[i], 'tile');
        if (checkTile === null) {

            continue;
        }
        // console.log(checkTile.id);
        const checkCoverTile = document.querySelector('#cover-' + checkTile.id);
        if (checkCoverTile.classList.contains('revealed')) {

            continue;
        }

        if (checkTile.src.includes('tile_0.png')) {
            chainReveal(checkTile);
        } else {
            checkCoverTile.classList.add('revealed');
            checkCoverTile.style.zIndex = -1;
        }
    }

    return;

}

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


// Sets a total of numMines anywhere except for the first click
function setMines(numMines, firstClickCoverTile) {
    // Gets all the blank tiles, converts it from a NodeList to an array
    const allBlankTiles = Array.from(document.querySelectorAll('[id^="tile-row"]'));

    // Remove the first cover tile that was clicked from the array of possible mine locations
    // substring(6) is used to remove 'cover-' from the id
    const coverTileId = firstClickCoverTile.id + '';
    const blankTileId = coverTileId.substring(6);
    const blankTile = document.querySelector('#' + blankTileId);
    allBlankTiles.splice(allBlankTiles.indexOf(blankTile), 1);

    let maxRandInt = allBlankTiles.length - 1;
    for (let i = 0; i < numMines; i++) {
        // Generate a random index of the allBlankTiles array to be a mine
        const randomInt = Math.floor(Math.random() * maxRandInt);
        const mine = allBlankTiles[randomInt];

        // Take out the blank tile from the array and decrease the max value that can be randomly generated
        allBlankTiles.splice(randomInt, 1);
        maxRandInt--;

        // Change the tile's id to indicate that it is a mine
        // Id: mine-tile-row-#-col-#
        mine.id = 'mine-' + mine.id;
        mine.classList.add('mine');
        mine.src = '../images/mine.png';
    }
}

// Properties of mine related tiles
function setMineProperties() {
    const mines = document.querySelectorAll('[id^="mine"]');
    for (let i = 0; i < mines.length; i++) {

        // Get all the cover tiles above mines and add them to the mine class, substring(5) is used to remove 'mine-'
        const mineCoverTileId = 'cover-' + mines[i].id.substring(5);
        const coverTile = document.querySelector('#' + mineCoverTileId);
        coverTile.classList.add('mine');

        // Prevent right clicking on mines
        mines[i].addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
}

// Reveals the location of all the mines
function showAllMines() {
    const allMines = document.querySelectorAll('[id^="mine"]');
    for (let i = 0; i < allMines.length; i++) {
        // Parses the mine id and gets rid of 'mine-' to get row-#-col-#
        const coverTileOverMineId = 'cover-' + allMines[i].id.substring(5);
        const coverTileOverMine = document.querySelector('#' + coverTileOverMineId);

        // Hides the cover tile if it is not flagged
        if (!coverTileOverMine.classList.contains('flag')) {
            coverTileOverMine.style.zIndex = -1;
        }
    }
}

// Set blank tiles and cover tiles
function createBlankTiles(boardHeight, boardWidth) {
    for (let r = 0; r < boardHeight; r++) {
        const tileRowDiv = createTableRowDiv(r);
        for (let c = 0; c < boardWidth; c++) {
            const blankAndCoverTilePair = createTilePairDiv(tileRowDiv, r, c);
            createBlankTile(blankAndCoverTilePair, r, c);
            createCoverTile(blankAndCoverTilePair, r, c);
        }
    }
}

// Creates div that acts as a table row
// Returns the created div
// Id: div-row-#
function createTableRowDiv(r) {
    const border5 = document.querySelector('#border5');
    const tileRowDiv = document.createElement('div');
    tileRowDiv.style.display = 'table-row';
    tileRowDiv.id = 'div-row-' + r + '';
    border5.appendChild(tileRowDiv);
    return tileRowDiv;
}

// Creates div that holds the cover and blank tile pair and adds it to the div in the param
// Returns the created div
// Id: pair-row-#-col-#
function createTilePairDiv(tileRowDiv, r, c) {
    const blankAndCoverTilePair = document.createElement('div');
    blankAndCoverTilePair.classList.add('pair-row-' + r + '-col-' + c + '');
    blankAndCoverTilePair.style.display = 'table-cell';
    tileRowDiv.appendChild(blankAndCoverTilePair);
    return blankAndCoverTilePair;
}

// Creates a blank tile and adds it to the div in the param
// Id: tile-row-#-col-#
function createBlankTile(blankAndCoverTilePair, r, c) {
    const blankTile = document.createElement('img');
    blankTile.classList.add('tile');
    blankTile.id = 'tile-row-' + r + '-col-' + c + '';
    blankTile.src = '../images/tile_0.png';
    blankTile.setAttribute('draggable', false);
    blankAndCoverTilePair.appendChild(blankTile);
}

// Creates a cover tile and adds it to the div in the param
// Id: cover-tile-row-#-col-#
function createCoverTile(blankAndCoverTilePair, r, c) {
    const coverTile = document.createElement('img');
    coverTile.classList.add('cover-tile');
    coverTile.id = 'cover-tile-row-' + r + '-col-' + c + '';
    coverTile.src = '../images/cover_block.png';
    coverTile.setAttribute('draggable', false);
    blankAndCoverTilePair.appendChild(coverTile);
}

// Set number tiles
function setNumberTiles() {
    const mines = document.querySelectorAll('[id^="mine"]');
    // t: top,  m: middle,  b: bottom,  l: left,   r: right
    const pos = ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'];
    for (let i = 0; i < mines.length; i++) {
        for (let j = 0; j < pos.length; j++) {
            const numberTile = getAdjacentTile(mines[i], pos[j], 'tile');
            if (numberTile === null) {
                continue;
            }
            else {
                increaseNumberVal(numberTile);
            }
        }
    }
}

// Returns the tile indicated by pos
// tileType = 'mine', 'tile', 'cover-tile'
// Example board with labeled rows and cols:
//     0 * * *
//     1 * * *
//     2 * * *
//       0 1 2
function getAdjacentTile(rootTile, pos, tileType) {
    // Parses the rootTile id to get the row and column number
    const rowNum = Number(rootTile.id.substring(rootTile.id.indexOf('row-') + 4, rootTile.id.indexOf('-col-')));
    const colNum = Number(rootTile.id.substring(rootTile.id.indexOf('col-') + 4));
    let targetRowNum;
    let targetColNum;
    switch (pos) {
        case 'tl':
            targetRowNum = rowNum - 1;
            targetColNum = colNum - 1;
            break;
        case 'tm':
            targetRowNum = rowNum - 1;
            targetColNum = colNum;
            break;
        case 'tr':
            targetRowNum = rowNum - 1;
            targetColNum = colNum + 1;
            break;
        case 'ml':
            targetRowNum = rowNum;
            targetColNum = colNum - 1;
            break;
        case 'mr':
            targetRowNum = rowNum;
            targetColNum = colNum + 1;
            break;
        case 'bl':
            targetRowNum = rowNum + 1;
            targetColNum = colNum - 1;
            break;
        case 'bm':
            targetRowNum = rowNum + 1;
            targetColNum = colNum;
            break;
        case 'br':
            targetRowNum = rowNum + 1;
            targetColNum = colNum + 1;
            break;
        default:
            console.log('error in switch statement');
    }
    let resultId;
    if (tileType == 'mine') {
        resultId = '#mine-tile-row-' + targetRowNum + '-col-' + targetColNum;
    }
    else if (tileType == 'cover-tile') {
        resultId = '#cover-tile-row-' + targetRowNum + '-col-' + targetColNum;
    }
    else if (tileType == 'tile') {
        resultId = '#tile-row-' + targetRowNum + '-col-' + targetColNum;
    }
    return document.querySelector(resultId);
}

// Increases tile number value
function increaseNumberVal(numberTile) {
    // Parses the image source to get the number (numberTile.src will be something like '../images/tile_x.png', where x is the number)
    const curValue = Number(numberTile.src.substring(numberTile.src.indexOf('tile_') + 5, numberTile.src.indexOf('.png')));
    const newValue = curValue + 1;
    numberTile.src = '../images/tile_' + newValue + '.png';
}

// Properties of number tiles
function setNumberTileProperties() {
    const numberTiles = document.querySelectorAll('[id^="tile"]');
    for (let i = 0; i < numberTiles.length; i++) {
        // Prevent right clicking on number tiles
        numberTiles[i].addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Change unflagged cover tiles to tile when the left click is held over a number tile
        numberTiles[i].addEventListener('mousedown', (e) => {
            if (!lost && e.button == 0) {
                const adjUnflaggedCoverTiles = getUnflaggedCoverTiles(numberTiles[i]);
                for (let i = 0; i < adjUnflaggedCoverTiles.length; i++) {
                    adjUnflaggedCoverTiles[i].src = '../images/tile_0.png';
                }
            }
        });

        numberTiles[i].addEventListener('mouseover', (e) => {
            if (!lost && mousedown == true) {
                const adjUnflaggedCoverTiles = getUnflaggedCoverTiles(numberTiles[i]);
                for (let i = 0; i < adjUnflaggedCoverTiles.length; i++) {
                    adjUnflaggedCoverTiles[i].src = '../images/tile_0.png';
                }
            }
        });

        // Revert back to cover tile
        numberTiles[i].addEventListener('mouseleave', () => {
            if (!lost) {
                const adjUnflaggedCoverTiles = getUnflaggedCoverTiles(numberTiles[i]);
                for (let i = 0; i < adjUnflaggedCoverTiles.length; i++) {
                    adjUnflaggedCoverTiles[i].src = '../images/cover_block.png';
                }
            }
        });

        // Chording and reverting the cover tiles that got changed into blanks back into cover tiles
        numberTiles[i].addEventListener('mouseup', (e) => {
            if (!lost) {
                chord(e, numberTiles[i]);
                const adjUnflaggedCoverTiles = getUnflaggedCoverTiles(numberTiles[i]);
                for (let i = 0; i < adjUnflaggedCoverTiles.length; i++) {
                    adjUnflaggedCoverTiles[i].src = '../images/cover_block.png';
                }
            }
        });
    }
}

// Get all unflagged adjacent cover tiles
function getUnflaggedCoverTiles(numberTile) {
    const pos = ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'];
    const adjCoverTiles = [];
    for (let i = 0; i < pos.length; i++) {
        const coverTile = getAdjacentTile(numberTile, pos[i], 'cover-tile');
        if (coverTile !== null && !coverTile.classList.contains('flag')) {
            adjCoverTiles.push(coverTile);
        }
    }
    return adjCoverTiles;
}

// Reveal all adjacent tiles when left clicking on a number tile
// Only execute if the number of flags is equal to the number value of the clicked number tile
function chord(e, numberTile) {
    if (e.button == 0) {
        // Get all adjacent cover tiles and add them to an array
        // Also count the number of flags around the number tile
        const pos = ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'];
        const adjCoverTiles = [];
        let adjFlags = 0;
        for (let i = 0; i < pos.length; i++) {
            const coverTile = getAdjacentTile(numberTile, pos[i], 'cover-tile');
            if (coverTile !== null) {
                if (coverTile.classList.contains('flag')) {
                    adjFlags++;
                }
                adjCoverTiles.push(coverTile);
            }
        }

        // Reveal adjacent tiles around a number tile if the number tile is surrounded by an equal number of flags
        // Parses the numberTile image src to get the number value
        const numberTileVal = Number(numberTile.src.substring(numberTile.src.indexOf('tile_') + 5, numberTile.src.indexOf('.png')));
        if (numberTileVal == adjFlags) {
            for (let i = 0; i < adjCoverTiles.length; i++) {
                // Only reveal the cover tiles that are not flags
                if (!adjCoverTiles[i].classList.contains('flag')) {
                    reveal(adjCoverTiles[i]);
                }
            }
        }
    }
}

// Attaches event listeners to the smiley button
function setSmileyProperties() {
    const smileyBtn = document.querySelector('#smiley-img');
    // Changes the smiley border styling with hovered over and pressed
    smileyBtn.addEventListener('mouseover', () => {
        if (mousedown == true) {
            smileyBtn.classList.add('smiley-img-pressed');
            smileyBtn.classList.remove('smiley-img-idle');
        }
    });
    smileyBtn.addEventListener('mouseleave', () => {
        if (mousedown == true) {
            smileyBtn.classList.remove('smiley-img-pressed');
            smileyBtn.classList.add('smiley-img-idle');
        }
    });
    smileyBtn.addEventListener('mousedown', () => {
        smileyBtn.classList.add('smiley-img-pressed');
        smileyBtn.classList.remove('smiley-img-idle');
        console.log('mouseover', smileyBtn);
    })

    // Resets the cover tiles, numClicks, and the timer
    smileyBtn.addEventListener('mouseup', () => {
        smileyBtn.classList.remove('smiley-img-pressed');
        smileyBtn.classList.add('smiley-img-idle');
        generateCoverTiles(difficulty);
        numClicks = 0;
        lost = false; // hanson
        numMines = getNumMines(difficulty);
        if (difficulty === 'beginner') {
            displayMineCount(10);
        }
        else if (difficulty === 'intermediate') {
            displayMineCount(40);
        }
        else if (difficulty === 'expert') {
            displayMineCount(99);
        }
        smileyBtn.src = '../images/smiley.png'; // changes to normal smile after reset
        stopTimer();
        resetTimer();
    });
}

// Hanson
// Code to check win condition
// getElementByClassName returns array of everything in that class
function checkWin() {

    if (!lost) {
        var tilesRevealed = document.getElementsByClassName('revealed').length;
        console.log(tilesRevealed);
        if (difficulty === 'beginner' && (tilesRevealed) == 71) { // 81 - 10
            win();
        } else if (difficulty === 'intermediate' && (tilesRevealed) == 216) { // 256 - 40
            win();
        } else if (difficulty === 'expert' && (tilesRevealed) == 381) { // 480 - 99
            win();
        }
    }

}

// hanson
// Events after win condition is met
function win() {
    stopTimer(); // this returns time (use it with firebase)
    const smileyBtn = document.querySelector('#smiley-img');
    smileyBtn.src = '../images/win.png';
    lost = false;
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

// Resets the timer's display to 000
function resetTimer() {
    const leftTime = document.querySelector("#red-num-timer-left");
    const midTime = document.querySelector("#red-num-timer-mid");
    const rightTime = document.querySelector("#red-num-timer-right");
    leftTime.src = '../images/red_0.png';
    midTime.src = '../images/red_0.png';
    rightTime.src = '../images/red_0.png';
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


// Code for testing purposes
const startTimeBtn = document.querySelector('#start-timer');
startTimeBtn.addEventListener('click', () => {
    startTimer();
});

const stopTimeBtn = document.querySelector('#stop-timer');
stopTimeBtn.addEventListener('click', () => {
    const endTime = stopTimer();
    console.log(endTime);
});

const showMinesBtn = document.querySelector('#show-mines');
showMinesBtn.addEventListener('click', () => {
    const allMines = document.querySelectorAll('[id^="mine"]');
    for (let i = 0; i < allMines.length; i++) {
        allMines[i].style.zIndex = 5;
    }
    console.log(allMines.length);
});

// TODO: input validation: numbers greater than 999
let numMines = 0;
numMines = getNumMines(difficulty);
const mineFormRef = document.querySelector('#user-mines-form');
mineFormRef.addEventListener('submit', (e) => {
    e.preventDefault();

    numMines = mineFormRef.mines.value;
    console.log(numMines);

    displayMineCount(numMines);
});

// If form is not used
function getNumMines(difficulty) {
    if (difficulty === 'beginner') {
        return 10;
    }
    else if (difficulty === 'intermediate') {
        return 40;
    }
    else if (difficulty === 'expert') {
        return 99;
    }
}

// Login, Logout, firebase stuff

const loginForm = document.querySelector('.login');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("logged in");
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    signInWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            const logOutSect = document.querySelector('#logout-section')
            logOutSect.classList.toggle("hide-private");
            const navbarItems = document.querySelector('#navbar-items');
            navbarItems.classList.add("hide-private");
            console.log('user logged in: ', cred.user);
            loginForm.reset();
            loginForm.classList.add("hide-private");

            const userDocRef = doc(db, 'scores', cred.user.uid);    // get a reference of the user's doc

            getDoc(userDocRef)
                .then((doc) => {
                    let username = doc.data().username;
                    const welcome = document.querySelector('#welcome-user');
                    welcome.style.color = 'white';
                    console.log('username here');
                    console.log(username);
                    welcome.innerHTML = 'Welcome ' + username;
                })

            setDoc(userDocRef, { lastUpdated: serverTimestamp() }, { merge: true });    // updates doc or creates it if it doesn't exist
            // getDoc(userDocRef)
            //     .then((doc) => {
            //         if (typeof doc.data().count === 'undefined') {
            //             updateDoc(userDocRef, {email: cred.user.email, score: 0});
            //             location.reload();
            //         }
            //     });

            // onSnapshot(userDocRef, (doc) => {
            //     document.querySelector('#indivNum').innerHTML = doc.data().count;
            // });
        })
        .catch((error) => {
            console.error(error.message);
        });
});

const signUpRef = document.querySelector('.add');
signUpRef.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = signUpRef.email.value;
    const password = signUpRef.password.value;
    const username = signUpRef.username.value;
    createUserWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            const resultMessage = document.querySelector('#resultMessage');
            resultMessage.style.color = 'green';
            resultMessage.innerHTML = 'Success!';
            setTimeout(function () {
                const signUpDropDown = document.querySelector('#sign-up-dropdown');
                signUpDropDown.classList.toggle("collapsing");
                resultMessage.innerHTML = '';
            }, 2000);

            signInWithEmailAndPassword(auth, email, password)
                .then((cred) => {
                    const logOutSect = document.querySelector('#logout-section')
                    logOutSect.classList.toggle("hide-private");
                    const navbarItems = document.querySelector('#navbar-items');
                    navbarItems.classList.add("hide-private");
                    console.log('user logged in: ', cred.user);
                    loginForm.classList.add("hide-private");
                    signUpRef.reset();
                    const userDocRef = doc(db, 'scores', cred.user.uid);    // get a reference of the user's doc

                    getDoc(userDocRef)
                        .then((doc) => {
                            let username = doc.data().username;
                            const welcome = document.querySelector('#welcome-user');
                            welcome.style.color = 'white';
                            console.log('username here');
                            console.log(username);
                            welcome.innerHTML = 'Welcome ' + username;
                        })

                    setDoc(userDocRef, { lastUpdated: serverTimestamp() }, { merge: true });    // updates doc or creates it if it doesn't exist
                    getDoc(userDocRef)
                        .then((doc) => {
                            if (typeof doc.data().score === 'undefined') {
                                updateDoc(userDocRef, { count: 0, email: cred.user.email });
                                location.reload();
                            }
                        });

                    // onSnapshot(userDocRef, (doc) => {
                    //     document.querySelector('#indivNum').innerHTML = doc.data().count;
                    // });
                })
                .catch((error) => {
                    console.error(error.message);
                });


            // Creates an indivCount document for the user
            const userDocRef = doc(db, 'scores', cred.user.uid);
            setDoc(userDocRef, { email: cred.user.email, score: 0, username: username });
            signUpRef.reset();
        })
        // this catches if email is repeated, 
        // TODO: make it so that same username is also an error
        .catch((error) => {
            const resultMessage = document.querySelector('#resultMessage');
            resultMessage.style.color = 'red';
            resultMessage.innerHTML = error.message;
            signUpRef.reset();
        })
})

const logOutBtn = document.querySelector('#logout');
logOutBtn.addEventListener('click', (e) => {
    console.log('here');
    if (auth.currentUser !== null) {
        signOut(auth)
            .then(() => {
                loginForm.classList.remove("hide-private");
                const logOutSect = document.querySelector('#logout-section')
                logOutSect.classList.toggle("hide-private");
                const navbarItems = document.querySelector('#navbar-items');
                navbarItems.classList.remove("hide-private");
                const welcome = document.querySelector('#welcome-user');
                welcome.style.color = 'white';
                welcome.innerHTML = '';
                console.log('Log out successful');
            })
            .catch((err) => {
                console.error(err.message);
            });
    }
});

const signUpDropDown = document.querySelector('#sign-up-dropdown');

const signUpBtn = document.querySelector('#sign-up-button');
signUpBtn.addEventListener('click', () => {
    signUpDropDown.classList.toggle("collapse");
});

const cancelSignUp = document.querySelector('#cancel-signup');
cancelSignUp.addEventListener('click', () => {
    const signUpRef = document.querySelector('.add');
    signUpRef.reset();
    signUpDropDown.classList.toggle("collapse");
});