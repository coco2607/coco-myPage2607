 // gameRule.js
import {
    loadGameRound,
    loadGameEnd,
    saveRoundDie,
    saveRoundLive,
    saveGameEnd,
    rewardGamePoint
} from "./gameFirebase.js";
import {isRoundClosed} from "./gameState.js";

const ROUND_CHOICES = {
    1:["A","B","C","D","E"],
    2:["A","B","C","D","E"],
    3:["A","B","C","D"],
    4:["A","B","C"],
    5:["A","B","C"]
};

export function getRoundChoices(round){
    return ROUND_CHOICES[Number(round)] || [];
}

export function canSelectRound(memberGame,currentRound,gameEnd){
    currentRound = Number(currentRound);

    if(gameEnd) return false;
    if(currentRound < 1 || currentRound > 5) return false;
    if(currentRound === 1) return true;
    if(!memberGame || memberGame.alive !== true) return false;
    if(memberGame[`result${currentRound - 1}`] !== true) return false;

    return true;
}

export function canSelectChoice(round,choice){
    return getRoundChoices(round).includes(choice);
}

export async function ensurePreviousRoundResults(gameKey,currentRound){
    currentRound = Number(currentRound);

    if(currentRound <= 1) return null;

    const savedEnd = await loadGameEnd(gameKey);

    if(savedEnd){
        await rewardWinners(gameKey,savedEnd);
        return savedEnd;
    }

    for(let round = 1; round < currentRound; round++){
        const result = await ensureRoundResult(gameKey,round);

        if(result?.end) return result.end;
        if(result === null) return null;
    }

    return null;
}

export async function ensureRoundResult(gameKey,round){
    round = Number(round);

    if(round < 1 || round > 5) return null;
    if(!isRoundClosed(gameKey,round)) return null;

    if(round === 5){
        const end = await settleFinalRound(gameKey);

        if(!end) return null;

        return {
            die:{},
            survivors:Object.keys(end.winners || {}),
            end
        };
    }

    const savedEnd = await loadGameEnd(gameKey);

    if(savedEnd){
        await rewardWinners(gameKey,savedEnd);

        return {
            die:{},
            survivors:Object.keys(savedEnd.winners || {}),
            end:savedEnd
        };
    }

    const roundData = await loadGameRound(gameKey,round);
    const players = roundData?.player || {};
    const choices = getRoundChoices(round);
    const playerNames = Object.keys(players).filter(nickname => {
        return choices.includes(players[nickname]);
    });

    if(playerNames.length === 0){
        const end = await saveGameEnd(gameKey,round,"noPlayer",[]);

        return {
            die:{},
            survivors:[],
            end
        };
    }

    let die = roundData?.die || {};

    if(Object.keys(die).length === 0){
        const counts = countChoices(players,choices);
        const usedCounts = choices
            .map(choice => counts[choice])
            .filter(count => count > 0);

        const allTied = usedCounts.length > 0 &&
            usedCounts.every(count => count === usedCounts[0]);

        if(playerNames.length <= 3 && allTied){
            const end = await saveGameEnd(gameKey,round,"survivor",playerNames);
            const winners = Object.keys(end?.winners || {});

            if(end?.round === round && end?.reason === "survivor"){
                await saveRoundLive(gameKey,round,winners);
            }

            await rewardWinners(gameKey,end);

            return {
                die:{},
                survivors:winners,
                end
            };
        }

        const maxCount = Math.max(...usedCounts);

        const dieChoices = choices.filter(choice => {
            return counts[choice] > 0 && counts[choice] === maxCount;
        });

        die = await saveRoundDie(gameKey,round,dieChoices);
    }

    const survivors = playerNames.filter(nickname => {
        return die[players[nickname]] !== true;
    });

    if(survivors.length <= 3){
        const end = await saveGameEnd(
            gameKey,
            round,
            survivors.length === 0 ? "noSurvivor" : "survivor",
            survivors
        );

        if(end?.round === round && end?.reason === "survivor"){
            await saveRoundLive(gameKey,round,Object.keys(end.winners || {}));
        }

        await rewardWinners(gameKey,end);

        return {
            die,
            survivors,
            end
        };
    }

    await saveRoundLive(gameKey,round,survivors);

    return {
        die,
        survivors,
        end:null
    };
}

export async function getRoundStatus(gameKey,round,nickname){
    round = Number(round);

    if(round < 1 || round > 5) return "pending";

    const roundData = await loadGameRound(gameKey,round);
    const players = roundData?.player || {};
    const die = roundData?.die || {};
    const live = roundData?.live || {};
    const choice = players[nickname];

    if(!choice) return "miss";
    if(live[nickname] === true) return "survive";

    const end = await loadGameEnd(gameKey);

    if(end?.round === round){
        return end.winners?.[nickname] === true ? "survive" : "die";
    }

    if(round === 5) return "pending";
    if(die[choice] === true) return "die";
    if(Object.keys(die).length === 0) return "pending";

    return "survive";
}

export async function settleFinalRound(gameKey){
    if(!isRoundClosed(gameKey,5)) return null;

    const savedEnd = await loadGameEnd(gameKey);

    if(savedEnd){
        await rewardWinners(gameKey,savedEnd);
        return savedEnd;
    }

    const roundData = await loadGameRound(gameKey,5);
    const players = roundData?.player || {};
    const choices = getRoundChoices(5);
    const playerNames = Object.keys(players).filter(nickname => {
        return choices.includes(players[nickname]);
    });

    if(playerNames.length === 0){
        return await saveGameEnd(gameKey,5,"noPlayer",[]);
    }

    if(playerNames.length <= 3){
        const end = await saveGameEnd(gameKey,5,"survivor",playerNames);

        if(end?.round === 5 && end?.reason === "survivor"){
            await saveRoundLive(gameKey,5,Object.keys(end.winners || {}));
        }

        await rewardWinners(gameKey,end);
        return end;
    }

    const counts = countChoices(players,choices);

    const usedCounts = choices
        .map(choice => counts[choice])
        .filter(count => count > 0);

    if(usedCounts.length === 0){
        return await saveGameEnd(gameKey,5,"noPlayer",[]);
    }

    const allTied = usedCounts.length === choices.length &&
        usedCounts.every(count => count === usedCounts[0]);

    if(allTied){
        return await saveGameEnd(gameKey,5,"noSurvivor",[]);
    }

    const minCount = Math.min(...usedCounts);

    const winChoices = choices.filter(choice => {
        return counts[choice] > 0 && counts[choice] === minCount;
    });

    const winners = playerNames.filter(nickname => {
        return winChoices.includes(players[nickname]);
    });

    const end = await saveGameEnd(gameKey,5,"round5",winners);

    if(end?.round === 5 && end?.reason === "round5"){
        await saveRoundLive(gameKey,5,Object.keys(end.winners || {}));
    }

    await rewardWinners(gameKey,end);
    return end;
}

function countChoices(players,choices){
    const result = {total:0};

    choices.forEach(choice => {
        result[choice] = 0;
    });

    Object.values(players || {}).forEach(choice => {
        if(!choices.includes(choice)) return;
        result[choice]++;
        result.total++;
    });

    return result;
}

async function rewardWinners(gameKey,end){
    const winners = Object.keys(end?.winners || {});

    if(winners.length === 0) return;

    await Promise.all(
        winners.map(nickname => rewardGamePoint(nickname,gameKey))
    );
}
