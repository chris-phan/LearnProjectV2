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
var numClicks = 0;

// Event listeners

// Beginner button
const beginnerDiffBtn = document.querySelector('#diff-beg');
beginnerDiffBtn.addEventListener('click', () => {
    difficulty = 'beginner';
    generateCoverTiles(difficulty);
    numClicks = 0;
});

// Intermediate button
const intermediateDiffBtn = document.querySelector('#diff-int');
intermediateDiffBtn.addEventListener('click', () => {
    difficulty = 'intermediate';
    generateCoverTiles(difficulty);
    numClicks = 0;
});

// Expert button
const expertDiffBtn = document.querySelector('#diff-exp');
expertDiffBtn.addEventListener('click', () => {
    difficulty = 'expert';
    generateCoverTiles(difficulty);
    numClicks = 0;
});

// Creates the cover tiles
// TODO: add custom difficulty option
function generateCoverTiles(difficulty) {
    // Show the board
    document.querySelector('#border4').hidden = false;

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
        const imgSrc = coverTiles[i].src + '';
        coverTiles[i].addEventListener('contextmenu', (e) => {
            e.preventDefault();

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

        // Whenever a cover tile is clicked, hide it
        // First click code
        coverTiles[i].addEventListener('click', () => {
            numClicks++;
            if (numClicks == 1) {
                setMines(totMines, coverTiles[i]);
                displayMineCount(totMines);
            }
            coverTiles[i].style.zIndex = -1;
            console.log(coverTiles[i].id);
        });

        // When the mouse is held down and over a cover tile, switch it to a blank tile
        // When the mouse is held down and leaves a cover tile, switch it back to a cover tile
        let mousedown;
        document.addEventListener('mousedown', () => {
            mousedown = true;
        });
        document.addEventListener('mouseup', () => {
            mousedown = false;
        });

        if (!imgSrc.includes('flag')) {
            coverTiles[i].addEventListener('mouseover', () => {
                if (mousedown == true) {
                    coverTiles[i].src = '../images/tile_0.png';
                }
            });
            coverTiles[i].addEventListener('mouseleave', () => {
                if (mousedown == true) {
                    coverTiles[i].src = '../images/cover_block.png';
                }
            });
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
    console.log(allBlankTiles);

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
        mine.src = '../images/mine.png';
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
    const allBlanks = document.querySelectorAll('[id^="mine"]');
    for (let i = 0; i < allBlanks.length; i++) {
        allBlanks[i].style.zIndex = 5;
    }
    console.log(allBlanks.length);
});

// TODO: input validation: numbers greater than 999
let numMines = 0;
const mineFormRef = document.querySelector('#user-mines-form');
mineFormRef.addEventListener('submit', (e) => {
    e.preventDefault();

    numMines = mineFormRef.mines.value;
    console.log(numMines);

    displayMineCount(numMines);
});

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
                setTimeout(function(){
                    const signUpDropDown = document.querySelector('#sign-up-dropdown');
                    signUpDropDown.classList.toggle("collapsing");
                    resultMessage.innerHTML = '';
                },2000);

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
                setDoc(userDocRef, { email: cred.user.email, score: 0,  username: username });
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