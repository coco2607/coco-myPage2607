// gameRule.js
import {
    loadGameRound,
    loadGameEnd,
    saveRoundDie,
    saveGameEnd,
    rewardGamePoint
} from "./gameFirebase.js";

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
    if(gameEnd){
        return false;
    }

    if(currentRound < 1 || currentRound > 5){
        return false;
    }

    if(currentRound === 1){
        return true;
    }

    if(!memberGame || memberGame.alive !== true){
        return false;
    }

    if(memberGame[`result${currentRound - 1}`] !== true){
        return false;
    }

    return true;
}

export function canSelectChoice(round,choice){
    return getRoundChoices(round).includes(choice);
}

export async function ensurePreviousRoundResults(gameKey,currentRound){
    if(currentRound <= 1){
        return null;
    }

    let end = await loadGameEnd(gameKey);

    if(end){
        await rewardWinners(gameKey,end);
        return end;
    }

    for(let round = 1; round < currentRound; round++){
        const result = await ensureRoundResult(
            gameKey,
            round
        );

        if(result?.end){
            return result.end;
        }
    }

    return null;
}

export async function ensureRoundResult(gameKey,round){
    round = Number(round);

    if(round < 1 || round > 4){
        return null;
    }

    const savedEnd = await loadGameEnd(gameKey);

    if(savedEnd){
        await rewardWinners(gameKey,savedEnd);

        return {
            die:{},
            survivors:[],
            end:savedEnd
        };
    }

    const roundData = await loadGameRound(
        gameKey,
        round
    );

    const players = roundData?.player || {};
    const choices = getRoundChoices(round);

    if(Object.keys(players).length === 0){
        const end = await saveGameEnd(
            gameKey,
            round,
            "noPlayer",
            []
        );

        return {
            die:{},
            survivors:[],
            end
        };
    }

    let die = roundData?.die || {};

    if(Object.keys(die).length === 0){
        const counts = countChoices(
            players,
            choices
        );

        const maxCount = Math.max(
            ...choices.map(choice => {
                return counts[choice] || 0;
            })
        );

        const dieChoices = choices.filter(choice => {
            return (
                maxCount > 0 &&
                counts[choice] === maxCount
            );
        });

        die = await saveRoundDie(
            gameKey,
            round,
            dieChoices
        );
    }

    const survivors = Object.entries(players)
        .filter(([,choice]) => {
            return (
                choices.includes(choice) &&
                die[choice] !== true
            );
        })
        .map(([nickname]) => nickname);

    if(survivors.length <= 3){
        const end = await saveGameEnd(
            gameKey,
            round,
            survivors.length === 0
                ? "noSurvivor"
                : "survivor",
            survivors
        );

        await rewardWinners(gameKey,end);

        return {
            die,
            survivors,
            end
        };
    }

    return {
        die,
        survivors,
        end:null
    };
}

export async function getRoundStatus(
    gameKey,
    round,
    nickname
){
    const roundData = await loadGameRound(
        gameKey,
        round
    );

    const players = roundData?.player || {};
    const die = roundData?.die || {};
    const choice = players[nickname];

    if(!choice){
        return "miss";
    }

    if(Object.keys(die).length === 0){
        return "pending";
    }

    if(die[choice] === true){
        return "die";
    }

    return "survive";
}

export async function settleFinalRound(gameKey){
    const savedEnd = await loadGameEnd(gameKey);

    if(savedEnd){
        await rewardWinners(gameKey,savedEnd);
        return savedEnd;
    }

    const roundData = await loadGameRound(
        gameKey,
        5
    );

    const players = roundData?.player || {};
    const choices = getRoundChoices(5);

    if(Object.keys(players).length === 0){
        return await saveGameEnd(
            gameKey,
            5,
            "noPlayer",
            []
        );
    }

    const counts = countChoices(
        players,
        choices
    );

    const usedCounts = choices
        .map(choice => counts[choice])
        .filter(count => count > 0);

    if(usedCounts.length === 0){
        return await saveGameEnd(
            gameKey,
            5,
            "noPlayer",
            []
        );
    }

    const minCount = Math.min(...usedCounts);

    const winChoices = choices.filter(choice => {
        return (
            counts[choice] > 0 &&
            counts[choice] === minCount
        );
    });

    const winners = Object.entries(players)
        .filter(([,choice]) => {
            return winChoices.includes(choice);
        })
        .map(([nickname]) => nickname);

    const end = await saveGameEnd(
        gameKey,
        5,
        "round5",
        winners
    );

    await rewardWinners(gameKey,end);

    return end;
}

function countChoices(players,choices){
    const result = {
        total:0
    };

    choices.forEach(choice => {
        result[choice] = 0;
    });

    Object.values(players || {}).forEach(choice => {
        if(!choices.includes(choice)){
            return;
        }

        result[choice]++;
        result.total++;
    });

    return result;
}

async function rewardWinners(gameKey,end){
    const winners = Object.keys(
        end?.winners || {}
    );

    if(winners.length === 0){
        return;
    }

    await Promise.all(
        winners.map(nickname => {
            return rewardGamePoint(
                nickname,
                gameKey
            );
        })
    );
}