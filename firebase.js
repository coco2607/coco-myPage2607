// firebase.js

import { initializeApp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

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

} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

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


import { createId, getCurrentDate, getCurrentTime
} from "./utils.js";

// firebase설정
const firebaseConfig = {
    apiKey: "AIzaSy......",
    authDomain: "dice2607.firebaseapp.com",
    databaseURL: "https://dice2607-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dice2607",
    storageBucket: "dice2607.firebasestorage.app",
    messagingSenderId: "308468191758",
    appId: "1:308468191758:web:4b0663..."
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);