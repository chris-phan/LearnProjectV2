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

