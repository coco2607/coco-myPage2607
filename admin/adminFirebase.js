// adminFirebase.js

import {
    db,
    ref,
    get,
    update,
    push,
    set
} from "../firebase.js";

const ADMIN = "으차방/admin";
const MEMBER = "으차방/member";
const HISTORY = "으차방/history";

export async function checkAdmin(password){
    const snapshot = await get(
        ref(db, "으차방/admin")
    );

    if(!snapshot.exists()){
        return null;
    }

    const data = snapshot.val();

    const inputPassword = String(password).trim();
    const adminPassword = String(data.adminPassword ?? "").trim();
    const staffPassword = String(data.staffPassword ?? "").trim();

    if(inputPassword === adminPassword){
        return "admin";
    }

    if(inputPassword === staffPassword){
        return "staff";
    }

    return null;
}

export async function loadHistory(nickname = ""){
    if(nickname){
        const snapshot = await get(
            ref(db, `${HISTORY}/${nickname}`)
        );

        if(!snapshot.exists()){
            return [];
        }

        const list = [];

        snapshot.forEach(child => {
            list.push({
                key:child.key,
                nickname,
                ...child.val()
            });
        });

        return list;
    }

    const snapshot = await get(
        ref(db, HISTORY)
    );

    if(!snapshot.exists()){
        return [];
    }

    const list = [];

    snapshot.forEach(memberSnap => {
        const nickname = memberSnap.key;

        memberSnap.forEach(historySnap => {
            list.push({
                key:historySnap.key,
                nickname,
                ...historySnap.val()
            });
        });
    });

    return list;
}

export async function loadMembers(){
    const snapshot = await get(
        ref(db, MEMBER)
    );

    if(!snapshot.exists()){
        return [];
    }

    const data = snapshot.val();

    return Object.entries(data).map(
        ([nickname,value]) => ({
            nickname,
            ...value
        })
    );
}

export async function updateMemberState(nickname,state){
    const updates = {
        state,
        lastUpdate:Date.now()
    };

    if(state === "외출"){
        updates.point = 0;
    }

    await update(
        ref(db, `${MEMBER}/${nickname}`),
        updates
    );
}

export async function uploadHistory(historyList){
    for(const history of historyList){
        const nickname = history.nickname;

        if(!nickname){
            continue;
        }

        const data = {
            ...history
        };

        delete data.nickname;

        if(!data.timestamp && data.date){
            data.timestamp =
                new Date(data.date).getTime();
        }

        await set(
            push(
                ref(
                    db,
                    `${HISTORY}/${nickname}`
                )
            ),
            data
        );
    }
}

export async function uploadMembers(memberList){
    for(const member of memberList){
        const {
            nickname,
            memberPw,
            totalP,
            ...data
        } = member;

        if(!nickname){
            continue;
        }

        if(
            totalP !== undefined &&
            totalP !== ""
        ){
            data.point = Number(totalP);
        }

        await update(
            ref(db, `${MEMBER}/${nickname}`),
            data
        );
    }
}