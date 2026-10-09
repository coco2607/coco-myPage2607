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
import {getGameKey,getCurrentRound,isRoundClosed} from "./gameState.js";

const MEMBER = "으차방/member";
const HISTORY = "으차방/history";
const MINI_GAME = "으차방/miniGame";

const ROUND_CHOICES = {
    1:["A","B","C","D","E"],
    2:["A","B","C","D","E"],
    3:["A","B","C","D"],
    4:["A","B","C"],
    5:["A","B","C"]
};

export async function ensureMemberMiniGame(nickname,gameKey){
    const gameRef = ref(db,`${MEMBER}/${nickname}/miniGame/${gameKey}`);

    const result = await runTransaction(gameRef,current => {
        if(current !== null) return;
        return {alive:false};
    });

    return result.snapshot.val() || {alive:false};
}

export async function loadMemberGame(nickname,gameKey){
    const snapshot = await get(
        ref(db,`${MEMBER}/${nickname}/miniGame/${gameKey}`)
    );

    return snapshot.exists() ? snapshot.val() : null;
}

export async function loadGameRound(gameKey,round){
    const snapshot = await get(
        ref(db,`${MINI_GAME}/${gameKey}/round${round}`)
    );

    return snapshot.exists() ? snapshot.val() : {};
}

export async function loadGamePlayerChoice(nickname,gameKey,round){
    const snapshot = await get(
        ref(db,`${MINI_GAME}/${gameKey}/round${round}/player/${nickname}`)
    );

    return snapshot.exists() ? snapshot.val() : null;
}

export async function loadGameDie(gameKey,round){
    const snapshot = await get(
        ref(db,`${MINI_GAME}/${gameKey}/round${round}/die`)
    );

    return snapshot.exists() ? snapshot.val() : {};
}

export async function loadGameEnd(gameKey){
    const snapshot = await get(
        ref(db,`${MINI_GAME}/${gameKey}/end`)
    );

    return snapshot.exists() ? snapshot.val() : null;
}

export async function saveGameChoice(nickname,gameKey,round,choice){
    round = Number(round);

    if(!ROUND_CHOICES[round]?.includes(choice)) return false;
    if(gameKey !== getGameKey()) return false;
    if(round !== getCurrentRound()) return false;
    if(isRoundClosed(gameKey,round)) return false;

    const endSnapshot = await get(
        ref(db,`${MINI_GAME}/${gameKey}/end`)
    );

    if(endSnapshot.exists()) return false;

    const roundRef = ref(db,`${MINI_GAME}/${gameKey}/round${round}`);

    const result = await runTransaction(roundRef,current => {
        if(isRoundClosed(gameKey,round)) return;
        if(current?.die || current?.live) return;

        if(current === null || typeof current !== "object"){
            current = {};
        }

        if(!current.player || typeof current.player !== "object"){
            current.player = {};
        }

        const first = current.player[nickname] === undefined;
        current.player[nickname] = choice;

        if(first){
            current.count = (Number(current.count) || 0) + 1;
        }

        return current;
    });

    return result.committed;
}

export async function setGameAlive(nickname,gameKey,alive){
    await set(
        ref(db,`${MEMBER}/${nickname}/miniGame/${gameKey}/alive`),
        alive === true
    );
}

export async function saveMemberRoundResult(nickname,gameKey,round,alive){
    await update(
        ref(db,`${MEMBER}/${nickname}/miniGame/${gameKey}`),
        {
            [`result${round}`]:true,
            alive:alive === true
        }
    );
}

export async function saveRoundDie(gameKey,round,dieChoices){
    const dieRef = ref(db,`${MINI_GAME}/${gameKey}/round${round}/die`);

    const result = await runTransaction(dieRef,current => {
        if(current !== null) return;

        const die = {};

        dieChoices.forEach(choice => {
            die[choice] = true;
        });

        if(Object.keys(die).length === 0) return;
        return die;
    });

    if(result.committed){
        return result.snapshot.val() || {};
    }

    const snapshot = await get(dieRef);
    return snapshot.exists() ? snapshot.val() : {};
}

export async function saveRoundLive(gameKey,round,survivors){
    const liveRef = ref(db,`${MINI_GAME}/${gameKey}/round${round}/live`);

    const result = await runTransaction(liveRef,current => {
        if(current !== null) return;

        const live = {};

        survivors.forEach(nickname => {
            live[nickname] = true;
        });

        if(Object.keys(live).length === 0) return;
        return live;
    });

    return result.snapshot.val() || {};
}

export async function saveGameEnd(gameKey,round,reason,winnerNicknames){
    const endRef = ref(db,`${MINI_GAME}/${gameKey}/end`);

    const result = await runTransaction(endRef,current => {
        if(current !== null) return;

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
    return snapshot.exists() ? snapshot.val() : null;
}

export async function rewardGamePoint(nickname,gameKey){
    const memberRef = ref(db,`${MEMBER}/${nickname}`);
    const historyRef = push(ref(db,`${HISTORY}/${nickname}`));
    const newHistoryKey = historyRef.key;

    const result = await runTransaction(memberRef,current => {
        if(!current) return;

        if(!current.miniGame){
            current.miniGame = {};
        }

        if(!current.miniGame[gameKey]){
            current.miniGame[gameKey] = {alive:false};
        }

        const game = current.miniGame[gameKey];

        if(Number(game.reward) === 1) return;

        game.reward = 1;
        game.rewardHistoryKey = newHistoryKey;
        current.point = (Number(current.point) || 0) + 1;

        return current;
    });

    const member = result.snapshot.val();
    const game = member?.miniGame?.[gameKey];

    if(Number(game?.reward) !== 1) return 0;

    const savedHistoryKey = game.rewardHistoryKey;

    if(savedHistoryKey){
        const savedHistoryRef = ref(
            db,
            `${HISTORY}/${nickname}/${savedHistoryKey}`
        );

        const historyResult = await runTransaction(savedHistoryRef,current => {
            if(current !== null) return;

            return {
                getP:1,
                type:"주간 미니 게임 우승"
            };
        });

        if(!historyResult.snapshot.exists()){
            throw new Error("게임 우승 히스토리 저장 실패");
        }
    }

    return result.committed ? 1 : 0;
}

export async function saveGameChat(nickname,gameKey,comment){
    const chatRef = push(
        ref(db,`${MINI_GAME}/${gameKey}/chat`)
    );

    await set(chatRef,{
        nickname,
        comment,
        time:serverTimestamp()
    });

    return chatRef.key;
}

export function listenGameChat(gameKey,callback){
    const chatRef = ref(db,`${MINI_GAME}/${gameKey}/chat`);

    return onChildAdded(chatRef,snapshot => {
        const data = snapshot.val();

        if(!data || typeof data !== "object") return;

        callback({
            key:snapshot.key,
            nickname:data.nickname ?? "",
            comment:data.comment ?? "",
            time:data.time ?? 0
        });
    });
}