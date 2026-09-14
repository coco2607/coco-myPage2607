// firebase.js

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    set,
    update,
    remove,
    push,
    onValue,
    onDisconnect,
    serverTimestamp,
    runTransaction,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDJNLTppKlcIJrLS7F1gu6PYOyVmnKtsfU",
    authDomain: "wany2608.firebaseapp.com",
    databaseURL: "https://wany2608-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "wany2608",
    storageBucket: "wany2608.firebasestorage.app",
    messagingSenderId: "270617158648",
    appId: "1:270617158648:web:6642e85eeb4155924bec0d"
};


// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


// Firebase 함수 내보내기
export {
    db,
    ref,
    get,
    set,
    update,
    remove,
    push,
    onValue,
    onDisconnect,
    serverTimestamp,
    runTransaction,
    query,
    orderByChild,
    equalTo
};