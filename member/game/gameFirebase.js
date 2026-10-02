// gameFirebase.js
import {
    db,
    ref,
    get,
    set,
    update,
    push,
    onChildAdded,
    serverTimestamp,
    runTransaction
} from "../../firebase.js";

const MEMBER = "으차방/member";
const HISTORY = "으차방/history";
const GAME = "으차방/game";

export async function loadMemberGame(
    nickname,
    monthKey
){
    const snapshot = await get(
        ref(
            db,
            `${MEMBER}/${nickname}/game/${monthKey}`
        )
    );

    if(!snapshot.exists()){
        return null;
    }

    return snapshot.val();
}

export async function loadGameRound(
    monthKey,
    round
){
    const snapshot = await get(
        ref(
            db,
            `${GAME}/${monthKey}/round${round}`
        )
    );

    if(!snapshot.exists()){
        return {};
    }

    return snapshot.val();
}

export async function loadGameDie(
    monthKey,
    round
){
    const snapshot = await get(
        ref(
            db,
            `${GAME}/${monthKey}/die${round}`
        )
    );

    if(!snapshot.exists()){
        return {};
    }

    return snapshot.val();
}

export async function loadGameWin(
    monthKey
){
    const snapshot = await get(
        ref(
            db,
            `${GAME}/${monthKey}/win5`
        )
    );

    if(!snapshot.exists()){
        return {};
    }

    return snapshot.val();
}

export async function saveGameChoice(
    nickname,
    monthKey,
    round,
    choice
){
    const memberGameRef = ref(
        db,
        `${MEMBER}/${nickname}/game/${monthKey}`
    );

    const gameRoundRef = ref(
        db,
        `${GAME}/${monthKey}/round${round}/${nickname}`
    );

    await update(
        memberGameRef,
        {
            alive:true,
            [`r${round}`]:choice,
            round:round
        }
    );

    await set(
        gameRoundRef,
        choice
    );

    await set(
        ref(
            db,
            `${MEMBER}/${nickname}/lastUpdate`
        ),
        serverTimestamp()
    );

    return true;
}

export async function setGameAlive(
    nickname,
    monthKey,
    alive
){
    await set(
        ref(
            db,
            `${MEMBER}/${nickname}/game/${monthKey}/alive`
        ),
        alive
    );
}

export async function saveGameResultCheck(
    nickname,
    monthKey,
    round
){
    await set(
        ref(
            db,
            `${MEMBER}/${nickname}/game/${monthKey}/check${round}`
        ),
        true
    );
}

export async function saveGameElimination(
    nickname,
    monthKey
){
    await set(
        ref(
            db,
            `${MEMBER}/${nickname}/game/${monthKey}/alive`
        ),
        false
    );
}

export async function saveRoundDie(
    monthKey,
    round,
    dieChoices
){
    const dieRef = ref(
        db,
        `${GAME}/${monthKey}/die${round}`
    );

    const result = {};

    dieChoices.forEach(choice => {
        result[choice] = true;
    });

    await set(
        dieRef,
        result
    );

    return result;
}

export async function saveRoundWin(
    monthKey,
    winChoices
){
    const winRef = ref(
        db,
        `${GAME}/${monthKey}/win5`
    );

    const result = {};

    winChoices.forEach(choice => {
        result[choice] = true;
    });

    await set(
        winRef,
        result
    );

    return result;
}

export async function rewardGamePoint(
    nickname,
    monthKey
){
    const rewardRef = ref(
        db,
        `${MEMBER}/${nickname}/game/${monthKey}/reward`
    );

    const rewardResult = await runTransaction(
        rewardRef,
        current => {
            if(current !== null){
                return;
            }

            return 1;
        }
    );

    if(
        !rewardResult.committed ||
        Number(rewardResult.snapshot.val()) !== 1
    ){
        return 0;
    }

    const pointRef = ref(
        db,
        `${MEMBER}/${nickname}/point`
    );

    await runTransaction(
        pointRef,
        current => {
            return (Number(current) || 0) + 1;
        }
    );

    const historyRef = push(
        ref(
            db,
            `${HISTORY}/${nickname}`
        )
    );

    await set(
        historyRef,
        {
            getP:1,
            type:`${monthKey.substring(2).replace("-","")} 월간 미니 게임`
        }
    );

    return 1;
}

export async function saveGameChat(
    nickname,
    monthKey,
    comment
){
    const chatRef = push(
        ref(
            db,
            `${GAME}/${monthKey}/chat`
        )
    );

    await set(
        chatRef,
        {
            nickname:nickname,
            comment:comment,
            time:serverTimestamp()
        }
    );
}

export function listenGameChat(
    monthKey,
    callback
){
    const chatRef = ref(
        db,
        `${GAME}/${monthKey}/chat`
    );

    const unsubscribe = onChildAdded(
        chatRef,
        snapshot => {
            const data = snapshot.val();

            if(
                !data ||
                typeof data !== "object"
            ){
                return;
            }

            callback({
                key:snapshot.key,
                nickname:data.nickname ?? "",
                comment:data.comment ?? "",
                time:data.time ?? 0
            });
        }
    );

    return unsubscribe;
}