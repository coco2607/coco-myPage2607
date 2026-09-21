// checkFirebase.js

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

import {db} from "../firebase.js";

export async function findMemberByDeviceId(deviceId){
    if(!deviceId){
        return null;
    }

    const snapshot = await get(
        ref(db, `으차방/deviceId/${deviceId}`)
    );

    if(!snapshot.exists()){
        return null;
    }

    return snapshot.val();
}