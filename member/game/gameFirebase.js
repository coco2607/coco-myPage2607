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
const MINI_GAME = "으차방/miniGame";

export async function ensureMemberMiniGame(nickname,gameKey){
    const gameRef = ref(
        db,
        `${MEMBER}/${nickname}/miniGame/${gameKey}`
    );

    const result = await runTransaction(gameRef,current => {
        if(current !== null){
            return;
        }

        return {
            alive:false
        };
    });

    return result.snapshot.val() || {
        alive:false
    };
}

export async function loadMemberGame(nickname,gameKey){
    const snapshot = await get(
        ref(
            db,
            `${MEMBER}/${nickname}/miniGame/${gameKey}`
        )
    );

    if(!snapshot.exists()){
        return null;
    }

    return snapshot.val();
}

export async function loadGameRound(gameKey,round){
    const snapshot = await get(
        ref(
            db,
            `${MINI_GAME}/${gameKey}/round${round}`
        )
    );

    if(!snapshot.exists()){
        return {};
    }

    return snapshot.val();
}

export async function loadGamePlayerChoice(
    nickname,
    gameKey,
    round
){
    const snapshot = await get(
        ref(
            db,
            `${MINI_GAME}/${gameKey}/round${round}/player/${nickname}`
        )
    );

    if(!snapshot.exists()){
        return null;
    }

    return snapshot.val();
}

export async function loadGameDie(gameKey,round){
    const snapshot = await get(
        ref(
            db,
            `${MINI_GAME}/${gameKey}/round${round}/die`
        )
    );

    if(!snapshot.exists()){
        return {};
    }

    return snapshot.val();
}

export async function loadGameEnd(gameKey){
    const snapshot = await get(
        ref(
            db,
            `${MINI_GAME}/${gameKey}/end`
        )
    );

    if(!snapshot.exists()){
        return null;
    }

    return snapshot.val();
}

export async function saveGameChoice(
    nickname,
    gameKey,
    round,
    choice
){
    const endSnapshot = await get(
        ref(
            db,
            `${MINI_GAME}/${gameKey}/end`
        )
    );

    if(endSnapshot.exists()){
        return false;
    }

    const roundRef = ref(
        db,
        `${MINI_GAME}/${gameKey}/round${round}`
    );

    const result = await runTransaction(roundRef,current => {
        if(current === null || typeof current !== "object"){
            current = {};
        }

        if(current.die){
            return;
        }

        if(!current.player || typeof current.player !== "object"){
            current.player = {};
        }

        const first =
            current.player[nickname] === undefined;

        current.player[nickname] = choice;

        if(first){
            current.count =
                (Number(current.count) || 0) + 1;
        }

        return current;
    });

    return result.committed;
}

export async function setGameAlive(
    nickname,
    gameKey,
    alive
){
    await set(
        ref(
            db,
            `${MEMBER}/${nickname}/miniGame/${gameKey}/alive`
        ),
        alive === true
    );
}

export async function saveMemberRoundResult(
    nickname,
    gameKey,
    round,
    alive
){
    await update(
        ref(
            db,
            `${MEMBER}/${nickname}/miniGame/${gameKey}`
        ),
        {
            [`result${round}`]:true,
            alive:alive === true
        }
    );
}

export async function saveRoundDie(
    gameKey,
    round,
    dieChoices
){
    const dieRef = ref(
        db,
        `${MINI_GAME}/${gameKey}/round${round}/die`
    );

    const result = await runTransaction(dieRef,current => {
        if(current !== null){
            return;
        }

        const die = {};

        dieChoices.forEach(choice => {
            die[choice] = true;
        });

        if(Object.keys(die).length === 0){
            return;
        }

        return die;
    });

    if(result.committed){
        return result.snapshot.val() || {};
    }

    const snapshot = await get(dieRef);

    return snapshot.exists()
        ? snapshot.val()
        : {};
}

export async function saveGameEnd(
    gameKey,
    round,
    reason,
    winnerNicknames
){
    const endRef = ref(
        db,
        `${MINI_GAME}/${gameKey}/end`
    );

    const result = await runTransaction(endRef,current => {
        if(current !== null){
            return;
        }

        const end = {
            round:Number(round),
            count:winnerNicknames.length
        };

        if(reason){
            end.reason = reason;
        }

        if(winnerNicknames.length > 0){
            end.winners = {};

            winnerNicknames.forEach(nickname => {
                end.winners[nickname] = true;
            });
        }

        return end;
    });

    if(result.committed){
        return result.snapshot.val();
    }

    const snapshot = await get(endRef);

    return snapshot.exists()
        ? snapshot.val()
        : null;
}

export async function rewardGamePoint(
    nickname,
    gameKey
){
    const memberRef = ref(
        db,
        `${MEMBER}/${nickname}`
    );

    let rewarded = false;

    const result = await runTransaction(memberRef,current => {
        if(!current){
            return;
        }

        if(!current.miniGame){
            current.miniGame = {};
        }

        if(!current.miniGame[gameKey]){
            current.miniGame[gameKey] = {
                alive:false
            };
        }

        if(
            Number(
                current.miniGame[gameKey].reward
            ) === 1
        ){
            return;
        }

        current.miniGame[gameKey].reward = 1;
        current.point =
            (Number(current.point) || 0) + 1;

        rewarded = true;

        return current;
    });

    if(!result.committed || !rewarded){
        return 0;
    }

    const historyRef = push(
        ref(
            db,
            `${HISTORY}/${nickname}`
        )
    );

    await set(historyRef,{
        getP:1,
        type:"주간 게임 우승"
    });

    return 1;
}

export async function saveGameChat(
    nickname,
    gameKey,
    comment
){
    const chatRef = push(
        ref(
            db,
            `${MINI_GAME}/${gameKey}/chat`
        )
    );

    await set(chatRef,{
        nickname,
        comment,
        time:serverTimestamp()
    });

    return chatRef.key;
}

export function listenGameChat(gameKey,callback){
    const chatRef = ref(
        db,
        `${MINI_GAME}/${gameKey}/chat`
    );

    return onChildAdded(chatRef,snapshot => {
        const data = snapshot.val();

        if(!data || typeof data !== "object"){
            return;
        }

        callback({
            key:snapshot.key,
            nickname:data.nickname ?? "",
            comment:data.comment ?? "",
            time:data.time ?? 0
        });
    });
}