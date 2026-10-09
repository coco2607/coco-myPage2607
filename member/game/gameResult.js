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
    currentRound = Number(currentRound);

    if(currentRound === 1){
        const previousGameKey = getPreviousGameKey(gameKey);
        const previousRound1 = await loadGameRound(previousGameKey,1);
        const previousEnd = await loadGameEnd(previousGameKey);

        if(previousEnd){
            await ensurePreviousRoundResults(previousGameKey,5);
            return previousEnd;
        }

        if(Object.keys(previousRound1?.player || {}).length === 0){
            return null;
        }

        const earlyEnd = await ensurePreviousRoundResults(previousGameKey,5);

        if(earlyEnd){
            return earlyEnd;
        }

        return await settleFinalRound(previousGameKey);
    }

    return await ensurePreviousRoundResults(gameKey,currentRound);
}

export async function processPreviousGameResult(nickname,gameKey,currentRound){
    if(Number(currentRound) !== 1) return null;

    const previousGameKey = getPreviousGameKey(gameKey);
    let memberGame = await loadMemberGame(nickname,previousGameKey);

    if(!memberGame) return null;
    if(findEliminationRound(memberGame) !== null) return null;

    const end = await loadGameEnd(previousGameKey);

    if(!end) return null;

    const endRound = Number(end.round);

    if(endRound < 1 || endRound > 5) return null;

    for(let round = 1; round <= endRound; round++){
        if(memberGame[`result${round}`] === true){
            if(memberGame.alive === false) return null;
            continue;
        }

        const roundData = await loadGameRound(previousGameKey,round);
        const choice = roundData?.player?.[nickname];
        const winner = round === endRound && end.winners?.[nickname] === true;

        if(winner){
            await saveMemberRoundResult(nickname,previousGameKey,round,true);

            return {
                type:"winner",
                round,
                gameKey:previousGameKey,
                message:"최종 생존자로 1P 획득하였습니다."
            };
        }

        if(!choice){
            await saveMemberRoundResult(nickname,previousGameKey,round,false);

            return {
                type:"miss",
                round,
                gameKey:previousGameKey,
                message:`Round${round} 미참가로 탈락하였습니다.`
            };
        }

        const status = await getRoundStatus(previousGameKey,round,nickname);

        if(status === "pending") return null;

        if(status === "die" || round === endRound){
            await saveMemberRoundResult(nickname,previousGameKey,round,false);

            return {
                type:round === 5 ? "finalFail" : "die",
                round,
                gameKey:previousGameKey,
                message:round === 5
                    ? "최종 생존에 실패했습니다."
                    : `Round${round} 생존에 실패했습니다.`
            };
        }

        if(status === "survive"){
            await saveMemberRoundResult(nickname,previousGameKey,round,true);
            memberGame = await loadMemberGame(nickname,previousGameKey);

            if(!memberGame) return null;
        }
    }

    return null;
}

export async function processMemberResults(nickname,gameKey,currentRound){
    currentRound = Number(currentRound);

    let memberGame = await loadMemberGame(nickname,gameKey);

    if(!memberGame) return [];

    const gameEnd = await loadGameEnd(gameKey);
    const endRound = gameEnd ? Number(gameEnd.round) : 5;
    const lastRound = Math.min(endRound,currentRound - 1,4);

    if(lastRound < 1) return [];

    const results = [];

    for(let round = 1; round <= lastRound; round++){
        if(memberGame[`result${round}`] === true){
            if(memberGame.alive === false) break;
            continue;
        }

        const roundData = await loadGameRound(gameKey,round);
        const choice = roundData?.player?.[nickname];
        const isEndRound = gameEnd && Number(gameEnd.round) === round;
        const winner = isEndRound && gameEnd.winners?.[nickname] === true;

        if(winner){
            await saveMemberRoundResult(nickname,gameKey,round,true);

            results.push({
                type:"winner",
                round,
                message:"최종 생존자로 1P 획득하였습니다."
            });

            break;
        }

        if(!choice){
            await saveMemberRoundResult(nickname,gameKey,round,false);

            results.push({
                type:"miss",
                round,
                message:`Round${round} 미참가로 탈락하였습니다.`
            });

            break;
        }

        const status = await getRoundStatus(gameKey,round,nickname);

        if(status === "pending") break;

        if(status === "die" || isEndRound){
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

            results.push({
                type:"survive",
                round,
                message:`생존하셨습니다.<br>Round${round + 1}에 진출합니다.`
            });

            memberGame = await loadMemberGame(nickname,gameKey);

            if(!memberGame) break;
        }
    }

    return results;
}

export function findEliminationRound(memberGame){
    if(!memberGame || memberGame.alive !== false) return null;

    for(let round = 5; round >= 1; round--){
        if(memberGame[`result${round}`] === true){
            return round;
        }
    }

    return null;
}