// adminFirebase.js
import {
    db,
    ref,
    get,
    update,
    push,
    set
} from "../firebase.js";

const MEMBER = "으차방/member";
const HISTORY = "으차방/history";

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