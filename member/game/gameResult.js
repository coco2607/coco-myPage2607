// gameResult.js
import {
    loadMemberGame,
    loadGameRound,
    loadGameEnd,
    saveMemberRoundResult
} from "./gameFirebase.js";

import {
    ensurePreviousRoundResults,
    getRoundStatus,
    settleFinalRound
} from "./gameRule.js";

import {getPreviousGameKey} from "./gameState.js";

export async function processDueGameResults(gameKey,currentRound){
    if(currentRound === 1){
        const previousGameKey = getPreviousGameKey(gameKey);
        const previousEnd = await loadGameEnd(previousGameKey);

        if(previousEnd){
            return previousEnd;
        }

        const previousRound1 = await loadGameRound(previousGameKey,1);

        if(Object.keys(previousRound1).length === 0){
            return null;
        }

        return await settleFinalRound(previousGameKey);
    }

    return await ensurePreviousRoundResults(gameKey,currentRound);
}

export async function processPreviousGameResult(nickname,gameKey,currentRound){
    if(currentRound !== 1){
        return null;
    }

    const previousGameKey = getPreviousGameKey(gameKey);
    const previousGame = await loadMemberGame(nickname,previousGameKey);

    if(!previousGame){
        return null;
    }

    const end = await loadGameEnd(previousGameKey);

    if(!end){
        return null;
    }

    const round = Number(end.round);

    if(previousGame[`result${round}`] === true){
        return null;
    }

    const winner = end.winners?.[nickname] === true;

    if(winner){
        await saveMemberRoundResult(nickname,previousGameKey,round,true);

        return {
            type:"winner",
            round,
            gameKey:previousGameKey,
            message:"최종 생존자로 1P 획득하였습니다."
        };
    }

    if(round === 5){
        await saveMemberRoundResult(nickname,previousGameKey,round,false);

        const roundData = await loadGameRound(previousGameKey,5);
        const choice = roundData?.player?.[nickname];

        if(!choice){
            return {
                type:"miss",
                round,
                gameKey:previousGameKey,
                message:"Round5 미참가로 탈락하였습니다."
            };
        }

        return {
            type:"finalFail",
            round,
            gameKey:previousGameKey,
            message:"최종 생존에 실패했습니다."
        };
    }

    const status = await getRoundStatus(previousGameKey,round,nickname);

    await saveMemberRoundResult(nickname,previousGameKey,round,false);

    if(status === "miss"){
        return {
            type:"miss",
            round,
            gameKey:previousGameKey,
            message:`Round${round} 미참가로 탈락하였습니다.`
        };
    }

    return {
        type:"die",
        round,
        gameKey:previousGameKey,
        message:`Round${round} 생존에 실패했습니다.`
    };
}

export async function processMemberResults(nickname,gameKey,currentRound){
    let memberGame = await loadMemberGame(nickname,gameKey);

    if(!memberGame){
        return [];
    }

    const gameEnd = await loadGameEnd(gameKey);
    const lastRound = gameEnd
        ? Math.min(Number(gameEnd.round),currentRound - 1,4)
        : Math.min(currentRound - 1,4);

    if(lastRound < 1){
        return [];
    }

    const results = [];

    for(let round = 1; round <= lastRound; round++){
        const resultChecked = memberGame[`result${round}`] === true;

        if(resultChecked){
            if(memberGame.alive === false){
                break;
            }

            continue;
        }

        const status = await getRoundStatus(gameKey,round,nickname);

        if(status === "pending"){
            break;
        }

        const winner = gameEnd && Number(gameEnd.round) === round && gameEnd.winners?.[nickname] === true;

        if(winner){
            await saveMemberRoundResult(nickname,gameKey,round,true);

            results.push({
                type:"winner",
                round,
                message:"최종 생존자로 1P 획득하였습니다."
            });

            break;
        }

        if(status === "miss"){
            await saveMemberRoundResult(nickname,gameKey,round,false);

            results.push({
                type:"miss",
                round,
                message:`Round${round} 미참가로 탈락하였습니다.`
            });

            break;
        }

        if(status === "die"){
            await saveMemberRoundResult(nickname,gameKey,round,false);

            results.push({
                type:"die",
                round,
                message:`Round${round} 생존에 실패했습니다.`
            });

            break;
        }

        if(status === "survive"){
            await saveMemberRoundResult(nickname,gameKey,round,true);

            if(gameEnd && Number(gameEnd.round) === round){
                results.push({
                    type:"winner",
                    round,
                    message:"최종 생존자로 1P 획득하였습니다."
                });

                break;
            }

            results.push({
                type:"survive",
                round,
                message:`생존하셨습니다.<br>Round${round + 1}에 진출합니다.`
            });

            memberGame = await loadMemberGame(nickname,gameKey);
        }
    }

    return results;
}

export function findEliminationRound(memberGame){
    if(!memberGame || memberGame.alive !== false){
        return null;
    }

    for(let round = 5; round >= 1; round--){
        if(memberGame[`result${round}`] === true){
            return round;
        }
    }

    return null;
}