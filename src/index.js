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
    reload,
    onIdTokenChanged
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCSCBy0iQIERmCCBZsdftpz1kleiDYMjWI",
    authDomain: "minesweeper-74a91.firebaseapp.com",
    projectId: "minesweeper-74a91",
    storageBucket: "minesweeper-74a91.appspot.com",
    messagingSenderId: "97339507701",
    appId: "1:97339507701:web:8fe6068b10124d61b596bc"
};

// Initializes the firebase app
initializeApp(firebaseConfig);

// Initializes the firebase services used
const db = getFirestore();
const auth = getAuth();

// Global variables
var difficulty = 'beginner';
var numClicks = 0;
var mousedown;
var stopPlaying = false;
let numMines = 0;

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
displayMineCount(10);

// Toggles the visibility of the log in form
const loginBtn = document.querySelector('#showLoginBtn');
loginBtn.addEventListener('click', () => {
    const loginForm = document.querySelector('#loginForm');
    if (loginForm.hidden) {
        loginForm.hidden = false;
    }
    else {
        loginForm.hidden = true;
    }
    
    // Hide the sign up form
    const signUpForm = document.querySelector('#sign-up-dropdown');
    if (!signUpForm.hidden) {
        signUpForm.hidden = true;
    }
});

// Hides log in form
const cancelLogIn = document.querySelector('#loginCancelBtn');
cancelLogIn.addEventListener('click', () => {
    const loginForm = document.querySelector('#loginForm');
    loginForm.reset();
    loginForm.hidden = true;
});

// Toggles the visibility of the sign up form
const signUpBtn = document.querySelector('#showSignUpBtn');
signUpBtn.addEventListener('click', () => {
    const signUpDropDown = document.querySelector('#sign-up-dropdown');
    if (signUpDropDown.hidden) {
        signUpDropDown.hidden = false;
    }
    else {
        signUpDropDown.hidden = true;
    }

    // Hides the log in form
    const loginForm = document.querySelector('#loginForm');
    if (!loginForm.hidden) {
        loginForm.hidden = true;
    }
});

// Hides sign up form
const cancelSignUp = document.querySelector('#signUpCancelBtn');
cancelSignUp.addEventListener('click', () => {
    const signUpRef = document.querySelector('.add');
    signUpRef.reset();
    signUpRef.hidden = true;
});

// Log out
const logOutBtn = document.querySelector('#logOutBtn');
logOutBtn.addEventListener('click', (e) => {
    if (auth.currentUser !== null) {
        signOut(auth).catch((err) => {
            console.error(err.message);
        });
    }
});

// Toggling board alignment
const leftAlignBtn = document.querySelector('#left-align-btn');
const centerAlignBtn = document.querySelector('#center-align-btn');
const rightAlignBtn = document.querySelector('#right-align-btn');

const outerBorder = document.querySelector('#outer-border-id');
const alignmentSectId = document.querySelector('#alignments');
const difficulySectId = document.querySelector('#difficulty-section');
const alignSects = [alignmentSectId, difficulySectId, outerBorder];

leftAlignBtn.addEventListener('click', () => {
    for (let i = 0; i < alignSects.length; i++) {
        alignSects[i].classList.remove('right-align');
        alignSects[i].classList.remove('center-align');
    }
});

centerAlignBtn.addEventListener('click', () => {
    for (let i = 0; i < alignSects.length; i++) {
        alignSects[i].classList.remove('right-align');
        alignSects[i].classList.add('center-align');
    }
});

rightAlignBtn.addEventListener('click', () => {
    for (let i = 0; i < alignSects.length; i++) {
        alignSects[i].classList.remove('center-align');
        alignSects[i].classList.add('right-align');
    }
});

// Beginner button
const beginnerDiffBtn = document.querySelector('#diff-beg');
beginnerDiffBtn.addEventListener('click', () => {
    difficulty = 'beginner';
    resetGame();
});

// Intermediate button
const intermediateDiffBtn = document.querySelector('#diff-int');
intermediateDiffBtn.addEventListener('click', () => {
    difficulty = 'intermediate';
    resetGame();
});

// Expert button
const expertDiffBtn = document.querySelector('#diff-exp');
expertDiffBtn.addEventListener('click', () => {
    difficulty = 'expert';
    resetGame();
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

            if (!stopPlaying) {
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
            if (!stopPlaying && !coverTiles[i].classList.contains('flag') && e.button == 0) {
                numClicks++;

                // On first click
                if (numClicks == 1) {
                    startTimer();
                    setMines(totMines, coverTiles[i]);
                    setMineProperties();
                    setNumberTiles();
                    setNumberTileProperties();
                    displayMineCount(totMines);

                    // Firebase: increment the total number of games played by the user
                    const user = auth.currentUser;
                    if (user !== null) {
                        const userDocRef = doc(db, 'users', user.uid);
                        if (difficulty == 'beginner') {
                            updateDoc(userDocRef, { beginnerGamesPlayed: increment(1) });
                        }
                        else if (difficulty == 'intermediate') {
                            updateDoc(userDocRef, { intermediateGamesPlayed: increment(1) });
                        }
                        else if (difficulty == 'expert') {
                            updateDoc(userDocRef, { expertGamesPlayed: increment(1) });
                        }
                    }
                }

                // Always reveal a tile if an unflagged cover tile is left clicked
                reveal(coverTiles[i]);
            }
        });

        // When the mouse is held down and over a cover tile, switch it to a blank tile
        // When the mouse is held down and leaves a cover tile, switch it back to a cover tile
        coverTiles[i].addEventListener('mousedown', (e) => {
            if (!stopPlaying && e.button == 0 && !coverTiles[i].classList.contains('flag')) {
                coverTiles[i].src = '../images/tile_0.png';
            }
        });
        coverTiles[i].addEventListener('mouseover', () => {
            if (!stopPlaying && mousedown == true && !coverTiles[i].classList.contains('flag')) {
                coverTiles[i].src = '../images/tile_0.png';
            }
        });
        coverTiles[i].addEventListener('mouseleave', () => {
            if (!stopPlaying && coverTiles[i].src.includes('tile') && !coverTiles[i].classList.contains('flag')) {
                coverTiles[i].src = '../images/cover_block.png';
            }
        });
    }
}

// Reveals tiles and checks if the player has won
function reveal(coverTile) {
    // Parses coverTile's id to get 'tile-row-#-col-#'
    const numberTile = document.querySelector('#' + coverTile.id.substring(6));

    // If the player clicks on a mine, they lose
    // Else if the tile underneath the cover tile is 0, chain reveal
    // Else, just reveal it
    if (coverTile.classList.contains('mine')) {
        stopTimer();
        stopPlaying = true;

        // substring(6) to get rid of 'cover-' to get 'row-#-col-#'
        const mineId = 'mine-' + coverTile.id.substring(6);
        const mine = document.querySelector('#' + mineId);
        mine.src = '../images/mine_clicked.png';
        const smileyBtn = document.querySelector('#smiley-img');
        smileyBtn.src = '../images/lose.png';
        showAllMines();
        checkForWrongFlag();

        // Firebase: calculate the win rate
        const user = auth.currentUser;
        if (user !== null) {
            const userDocRef = doc(db, 'users', user.uid);
            let winRate;
            getDoc(userDocRef).then((doc) => {
                if (difficulty == 'beginner') {
                    winRate = doc.data().beginnerWins / doc.data().beginnerGamesPlayed;
                    updateDoc(userDocRef, { beginnerWinRate: winRate });
                }
                else if (difficulty == 'intermediate') {
                    winRate = doc.data().intermediateWins / doc.data().intermediateGamesPlayed;
                    updateDoc(userDocRef, { intermediateWinRate: winRate });
                }
                else if (difficulty == 'expert') {
                    winRate = doc.data().expertWins / doc.data().expertGamesPlayed;
                    updateDoc(userDocRef, { expertWinRate: winRate });
                }
            });
        }
    }
    else if (numberTile !== null && numberTile.src.includes('tile_0')) {
        chainReveal(numberTile);
        checkWin();
    }
    else {
        coverTile.style.zIndex = -1;
        coverTile.classList.add('revealed');
        checkWin();
    }
}

// Reveals all empty pockets that connect to a click
function chainReveal(tile) {
    // base case, all adjacent are revealed numbers or reached edge
    const coverTile = document.querySelector('#cover-' + tile.id);
    coverTile.classList.add('revealed');
    coverTile.style.zIndex = -1;

    // t: top,  m: middle,  b: bottom,  l: left,   r: right
    const pos = ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'];

    for (let i = 0; i < pos.length; i++) {
        // The adjacent number tile must exist and the cover tile must not already be revealed
        const checkTile = getAdjacentTile(tile, pos[i], 'tile');
        if (checkTile === null) {
            continue;
        }

        const checkCoverTile = document.querySelector('#cover-' + checkTile.id);
        if (checkCoverTile.classList.contains('revealed') || checkCoverTile.classList.contains('flag')) {
            continue;
        }

        // If the adjacent number tile is blank, recurse
        // Else, reveal it
        if (checkTile.src.includes('tile_0.png')) {
            chainReveal(checkTile);
        }
        else {
            checkCoverTile.classList.add('revealed');
            checkCoverTile.style.zIndex = -1;
        }
    }
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

// Flag all the cover tiles above a mine if the player wins
function flagRemainingMines() {
    const allMines = document.querySelectorAll('[id^="mine"]');
    for (let i = 0; i < allMines.length; i++) {
        // Parses the mine id and gets rid of 'mine-' to get row-#-col-#
        const coverTileOverMineId = 'cover-' + allMines[i].id.substring(5);
        const coverTileOverMine = document.querySelector('#' + coverTileOverMineId);

        coverTileOverMine.src = '../images/cover_block_flag.png';
    }
}

// If a cover tile that is not over a mine is flagged, change its image to mine_x.png
function checkForWrongFlag() {
    // Convert from NodeList to array
    const allMines = Array.from(document.querySelectorAll('[id^="mine"]'));

    const allFlaggedCoverTiles = document.querySelectorAll('.flag');

    // Loop through each flagged cover tile and check if it is over a mine, if it isn't change it to mine_x.png
    for (let i = 0; i < allFlaggedCoverTiles.length; i++) {
        let isInvalid = true;
        for (let j = 0; j < allMines.length; j++) {
            // Parses the mine id and gets rid of 'mine-' to get row-#-col-#
            const mineRowAndCol = allMines[j].id.substring(5);

            // If the flagged cover tile has the same id, break out of the loop and remove that mine from the array 
            if (allFlaggedCoverTiles[i].id.includes(mineRowAndCol)) {
                console.log('isvalid');
                // Removes the mine from the array
                allMines.splice(j, 1);
                isInvalid = false;
                break;
            }
        }
        // If the flagged cover tile makes it through the inner loop without isInvalid being changed to false, change it to mine_x.png
        if (isInvalid) {
            allFlaggedCoverTiles[i].src = '../images/mine_x.png';
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
            if (!stopPlaying && e.button == 0) {
                const adjUnflaggedCoverTiles = getUnflaggedCoverTiles(numberTiles[i]);
                for (let i = 0; i < adjUnflaggedCoverTiles.length; i++) {
                    adjUnflaggedCoverTiles[i].src = '../images/tile_0.png';
                }
            }
        });

        numberTiles[i].addEventListener('mouseover', (e) => {
            if (!stopPlaying && mousedown == true) {
                const adjUnflaggedCoverTiles = getUnflaggedCoverTiles(numberTiles[i]);
                for (let i = 0; i < adjUnflaggedCoverTiles.length; i++) {
                    adjUnflaggedCoverTiles[i].src = '../images/tile_0.png';
                }
            }
        });

        // Revert back to cover tile
        numberTiles[i].addEventListener('mouseleave', () => {
            if (!stopPlaying) {
                const adjUnflaggedCoverTiles = getUnflaggedCoverTiles(numberTiles[i]);
                for (let i = 0; i < adjUnflaggedCoverTiles.length; i++) {
                    adjUnflaggedCoverTiles[i].src = '../images/cover_block.png';
                }
            }
        });

        // Chording and reverting the cover tiles that got changed into blanks back into cover tiles
        numberTiles[i].addEventListener('mouseup', (e) => {
            if (!stopPlaying) {
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
    })

    // Resets the cover tiles, numClicks, and the timer
    smileyBtn.addEventListener('mouseup', () => {
        smileyBtn.classList.remove('smiley-img-pressed');
        smileyBtn.classList.add('smiley-img-idle');
        resetGame();
    });
}

// Resets the board
function resetGame() {
    generateCoverTiles(difficulty);
    numClicks = 0;
    stopPlaying = false;
    numMines = getNumMines(difficulty);
    displayMineCount(numMines);
    stopTimer();
    resetTimer();

    const smileyBtn = document.querySelector('#smiley-img');
    smileyBtn.src = '../images/smiley.png'; // changes to normal smile after reset
}

// Returns the number of mines
function getNumMines(difficulty) {
    if (difficulty == 'beginner') {
        return 10;
    }
    else if (difficulty == 'intermediate') {
        return 40;
    }
    else if (difficulty == 'expert') {
        return 99;
    }
}

// Code to check win condition
// getElementByClassName returns array of everything in that class
function checkWin() {

    if (!stopPlaying) {
        var tilesRevealed = document.getElementsByClassName('revealed').length;
        if (difficulty === 'beginner' && (tilesRevealed) == 71) { // 81 - 10
            win();
        } else if (difficulty === 'intermediate' && (tilesRevealed) == 216) { // 256 - 40
            win();
        } else if (difficulty === 'expert' && (tilesRevealed) == 381) { // 480 - 99
            win();
        }
    }

}

// Events after win condition is met
function win() {
    const smileyBtn = document.querySelector('#smiley-img');
    smileyBtn.src = '../images/win.png';
    stopPlaying = true;
    flagRemainingMines();
    displayMineCount(0);

    // Firebase: updates the win and time fields according to the difficulty played
    // Also update win rate
    const time = stopTimer();
    const user = auth.currentUser;
    if (user !== null) {
        const userDocRef = doc(db, 'users', user.uid);
        let winRate;

        // Updates the time field if it doesn't exist or is faster than the previous best time
        // Also increments the wins based on difficulty and updates win rate
        // + 1 is necessary for the calculating the win rate since the field that holds the # of wins doesn't update instantly
        getDoc(userDocRef).then((doc) => {
            if (difficulty == 'beginner') {
                if (doc.data().beginnerTime == undefined || doc.data().beginnerTime > time) {
                    updateDoc(userDocRef, { beginnerTime: time });
                }

                updateDoc(userDocRef, { beginnerWins: increment(1) });

                winRate = (doc.data().beginnerWins + 1) / doc.data().beginnerGamesPlayed;
                updateDoc(userDocRef, { beginnerWinRate: winRate });
            }
            else if (difficulty == 'intermediate') {
                if (doc.data().intermediateTime == undefined || doc.data().intermediateTime > time) {
                    updateDoc(userDocRef, { intermediateTime: time });
                }

                updateDoc(userDocRef, { intermediateWins: increment(1) });

                winRate = (doc.data().intermediateWins + 1) / doc.data().intermediateGamesPlayed;
                updateDoc(userDocRef, { intermediateWinRate: winRate });
            }
            else if (difficulty == 'expert') {
                if (doc.data().expertTime == undefined || doc.data().expertTime > time) {
                    updateDoc(userDocRef, { expertTime: time });
                }

                updateDoc(userDocRef, { expertWins: increment(1) });

                winRate = (doc.data().expertWins + 1) / doc.data().expertGamesPlayed;
                updateDoc(userDocRef, { expertWinRate: winRate });
            }
        });

        // Increment the total number of wins
        updateDoc(userDocRef, { totWins: increment(1) });
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


// Firebase code

// Log in
const loginForm = document.querySelector('.login');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    console.log("logged in");
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    signInWithEmailAndPassword(auth, email, password).catch((error) => {
        console.error(error.message);
    });
});

// Sign up
const signUpRef = document.querySelector('.add');
signUpRef.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = signUpRef.email.value;
    const password = signUpRef.password.value;
    const username = signUpRef.username.value;
    createUserWithEmailAndPassword(auth, email, password).then((cred) => {
        // Displaying success message, disappears after 2 seconds
        const resultMessage = document.querySelector('#resultMessage');
        resultMessage.style.color = 'green';
        resultMessage.innerHTML = 'Success!';
        setTimeout(function () {
            const signUpDropDown = document.querySelector('#sign-up-dropdown');
            signUpDropDown.classList.toggle("collapsing");
            resultMessage.innerHTML = '';
        }, 2000);

        // Log the users in after they sign up
        signInWithEmailAndPassword(auth, email, password).catch((error) => {
            console.error(error.message);
        });

        // Creates a doc for the user with the following fields:
        // lastSignedIn, email, username, beginnerWins, intermediateWins, expertWins, totWins
        const userDocRef = doc(db, 'users', cred.user.uid);
        setDoc(userDocRef, {
            lastSignedIn: serverTimestamp(),
            email: cred.user.email,
            username: username,
            beginnerWins: 0,
            intermediateWins: 0,
            expertWins: 0,
            totWins: 0
        });

        signUpRef.reset();

    }).catch((error) => {
        // this catches if email is repeated, 
        // TODO: make it so that same username is also an error
        const resultMessage = document.querySelector('#resultMessage');
        resultMessage.style.color = 'red';
        resultMessage.innerHTML = error.message;
        signUpRef.reset();
    });
});

// Detects when the user logs in and logs out
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User has logged in

        // Hides the sign up and log in buttons
        document.querySelector('#showSignUpBtn').hidden = true;
        document.querySelector('#showLoginBtn').hidden = true;
        
        // Hides the sign up form and log in form
        const signUpForm = document.querySelector('#sign-up-dropdown');
        signUpForm.reset();
        signUpForm.hidden = true;

        const loginForm = document.querySelector('#loginForm');
        loginForm.reset();
        loginForm.hidden = true;

        // Shows welcome text with the logged in user's username
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then((doc) => {
            let username = doc.data().username;
            const welcomeText = document.querySelector('#welcomeText');
            welcomeText.innerHTML = username + '';
            welcomeText.hidden = false;
        });

        // Shows the log out button
        document.querySelector('#logOutBtn').hidden = false;

        // Updates the user's doc with the log in time
        setDoc(userDocRef, { lastSignedIn: serverTimestamp() }, { merge: true });
    }
    else {
        // User has logged out

        // Hides the welcome text and log out button
        document.querySelector('#welcomeText').hidden = true;
        document.querySelector('#logOutBtn').hidden = true;

        // Shows the log in and sign up buttons
        document.querySelector('#showSignUpBtn').hidden = false;
        document.querySelector('#showLoginBtn').hidden = false;
    }
});

// Leaderboard code
// Global variables for leaderboard (lb stands for leaderboard)
var lbSelectedDifficulty;
var lbSelectedType;

// Clicking on the show/hide rankings button will change the visibility of the leaderboard
const showRankingsBtn = document.querySelector('#show-rankings');
showRankingsBtn.addEventListener('click', () => {
    const rankings = document.querySelector('#rankings');
    const rankDifficulty = document.querySelector('.rank-difficulty');
    const rankType = document.querySelector('.rank-type');

    // If the leaderboard is hidden, display it
    // Else, hide it
    if (rankings.hidden) {
        rankings.hidden = false;
        rankDifficulty.hidden = false;
        rankType.hidden = false;
        showRankingsBtn.innerHTML = 'HIDE RANKINGS';

        // Highlights the button
        showRankingsBtn.classList.remove('lb-toggle-idle');
        showRankingsBtn.classList.add('lb-toggle-clicked');

        // By default, the top expert times are shown
        lbSelectedDifficulty = 'expert';
        lbSelectedType = 'Time';
        displayRank(lbSelectedDifficulty + lbSelectedType);
        highlightButtons(lbSelectedDifficulty, lbSelectedType);
        console.log(document.querySelector('#rank-type-time'));
    }
    else {
        rankings.hidden = true;
        rankDifficulty.hidden = true;
        rankType.hidden = true;
        showRankingsBtn.innerHTML = 'SHOW RANKINGS';

        // Unhighlights the button
        showRankingsBtn.classList.remove('lb-toggle-clicked');
        showRankingsBtn.classList.add('lb-toggle-idle');

    }
});

// Beginner rank button
const beginnerRanking = document.querySelector('#rank-diff-beginner');
beginnerRanking.addEventListener('click', () => {
    lbSelectedDifficulty = 'beginner';
    displayRank(lbSelectedDifficulty + lbSelectedType);
    highlightButtons(lbSelectedDifficulty, lbSelectedType);
});

// Intermediate rank button
const intermediateRanking = document.querySelector('#rank-diff-intermediate');
intermediateRanking.addEventListener('click', () => {
    lbSelectedDifficulty = 'intermediate';
    displayRank(lbSelectedDifficulty + lbSelectedType);
    highlightButtons(lbSelectedDifficulty, lbSelectedType);
});

// Expert rank button
const expertRanking = document.querySelector('#rank-diff-expert');
expertRanking.addEventListener('click', () => {
    lbSelectedDifficulty = 'expert';
    displayRank(lbSelectedDifficulty + lbSelectedType);
    highlightButtons(lbSelectedDifficulty, lbSelectedType);
});

// Time rank button
const timeRanking = document.querySelector('#rank-type-time');
timeRanking.addEventListener('click', () => {
    lbSelectedType = 'Time';
    displayRank(lbSelectedDifficulty + lbSelectedType);
    highlightButtons(lbSelectedDifficulty, lbSelectedType);
});

// Wins rank button
const winsRanking = document.querySelector('#rank-type-wins');
winsRanking.addEventListener('click', () => {
    lbSelectedType = 'Wins';
    displayRank(lbSelectedDifficulty + lbSelectedType);
    highlightButtons(lbSelectedDifficulty, lbSelectedType);
});

// Win rate rank button
const winRateRanking = document.querySelector('#rank-type-win-rate');
winRateRanking.addEventListener('click', () => {
    lbSelectedType = 'WinRate';
    displayRank(lbSelectedDifficulty + lbSelectedType);
    highlightButtons(lbSelectedDifficulty, lbSelectedType);
});


// Displays the top five users of the specified rank
// Rank types: 'beginnerTime', 'intermediateTime', 'expertTime',
//             'beginnerWins', 'intermediateWins', 'expertWins'
//             'beginnerWinRate', intermediateWinRate, 'expertWinRate'
function displayRank(rankType) {
    // Query the top 5 users according to rankType
    let q;
    switch (rankType) {
        case 'beginnerTime':
            q = query(collection(db, 'users'), orderBy('beginnerTime', 'asc'), limit(5));
            break;
        case 'intermediateTime':
            q = query(collection(db, 'users'), orderBy('intermediateTime', 'asc'), limit(5));
            break;
        case 'expertTime':
            q = query(collection(db, 'users'), orderBy('expertTime', 'asc'), limit(5));
            break;
        case 'beginnerWins':
            q = query(collection(db, 'users'), orderBy('beginnerWins', 'desc'), limit(5));
            break;
        case 'intermediateWins':
            q = query(collection(db, 'users'), orderBy('intermediateWins', 'desc'), limit(5));
            break;
        case 'expertWins':
            q = query(collection(db, 'users'), orderBy('expertWins', 'desc'), limit(5));
            break;
        case 'beginnerWinRate':
            q = query(collection(db, 'users'), orderBy('beginnerWinRate', 'desc'), limit(5));
            break;
        case 'intermediateWinRate':
            q = query(collection(db, 'users'), orderBy('intermediateWinRate', 'desc'), limit(5));
            break;
        case 'expertWinRate':
            q = query(collection(db, 'users'), orderBy('expertWinRate', 'desc'), limit(5));
            break;
        default:
            console.log('error in switch statement')
    }

    // Updates the score label
    const scoreLabel = document.querySelector('#score');
    if (rankType.includes('Time')) {
        scoreLabel.innerHTML = '<b>TIME</b>';
    }
    else if (rankType.includes('Wins')) {
        scoreLabel.innerHTML = '<b>WINS</b>';
    }
    else if (rankType.includes('WinRate')) {
        scoreLabel.innerHTML = '<b>WIN RATE</b>';
    }

    // Real time listener
    onSnapshot(q, (snapshot) => {
        // Looks for the top 5 users according to rankType and adds them to an array
        let topUsers = [];
        snapshot.docs.forEach((doc) => {
            topUsers.push(doc);
        });

        const rankings = document.querySelector('#rankings');

        // Hide all rows initially
        const numRows = 5;
        for (let i = 0; i < numRows; i++) {
            const row = document.querySelector('#row' + (i + 1) + '');
            row.hidden = true;
        }

        for (let i = 0; i < topUsers.length; i++) {
            const row = document.querySelector('#row' + (i + 1) + '');

            // Reveal rows if the data in that row exists
            if (row.hidden) {
                row.hidden = false;
            }

            // Updates the ranking # cell
            let rankCell = rankings.rows[i + 1].cells[0];
            rankCell.innerHTML = "<b>" + (i + 1) + "</b>";

            // Updates the username cell
            let nameCell = rankings.rows[i + 1].cells[1];
            nameCell.innerHTML = topUsers[i].data().username;

            // Updates the score cell
            let scoreCell = rankings.rows[i + 1].cells[2];
            // Brackets after data() allow for getting data using a variable field name
            if (rankType.includes('Time')) {
                scoreCell.innerHTML = topUsers[i].data()[rankType] / 1000;
            }
            else if (rankType.includes('Wins')) {
                scoreCell.innerHTML = topUsers[i].data()[rankType];
            }
            else if (rankType.includes('WinRate')) {
                scoreCell.innerHTML = Math.round(topUsers[i].data()[rankType] * 100000) / 1000 + '%';
            }
        }
    });
}

// Highlights the selected buttons, unhighlights deselected buttons
function highlightButtons(diff, type) {
    // Gets all the rank buttons
    const rankBtns = document.querySelectorAll('[id^="rank-"]');

    if (type == 'WinRate') {
        type = 'win-rate'
    }
    type = type.toLowerCase();


    for (let i = 0; i < rankBtns.length; i++) {
        if (rankBtns[i].classList.contains('rank-diff-clicked') && !rankBtns[i].id.includes(diff)) {
            // Unhighlight the previously selected difficulty button
            rankBtns[i].classList.remove('rank-diff-clicked');
            rankBtns[i].classList.add('rank-diff-idle');
        }
        else if (rankBtns[i].classList.contains('rank-type-clicked') && !rankBtns[i].id.includes(type)) {
            // Unhighlight the previously selected type button
            console.log('im here', rankBtns[i]);

            rankBtns[i].classList.remove('rank-type-clicked');
            rankBtns[i].classList.add('rank-type-idle');
        }
        else if (rankBtns[i].id.includes(diff)) {
            // Highlight selected difficulty button
            rankBtns[i].classList.remove('rank-diff-idle');
            rankBtns[i].classList.add('rank-diff-clicked');
        }
        else if (rankBtns[i].id.includes(type)) {
            // Highlights slected type button
            console.log('im in here', rankBtns[i]);
            rankBtns[i].classList.remove('rank-type-idle');
            rankBtns[i].classList.add('rank-type-clicked');
        }
    }
}