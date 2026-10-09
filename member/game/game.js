
 // game.js
import {
    ensureMemberMiniGame,
    loadMemberGame,
    loadGameRound,
    loadGameEnd,
    saveGameChoice,
    setGameAlive
} from "./gameFirebase.js";

import {
    getRoundChoices,
    canSelectRound,
    canSelectChoice
} from "./gameRule.js";

import {
    getGameKey,
    getCurrentRound
} from "./gameState.js";

import {
    processDueGameResults,
    processPreviousGameResult,
    processMemberResults,
    findEliminationRound
} from "./gameResult.js";

import {
    createGameUI,
    setGameTitle,
    bindGameChoiceEvents,
    renderChoiceState,
    updateGameTop,
    showGameResultPopup,
    showGameRoundResultPopup
} from "./gameUi.js";

import {
    showGameRulePopup,
    showGamePlayerPopup
} from "./gamePopup.js";

import {initGameChat} from "./gameChat.js";
import {koDate} from "../../utils.js";

const nickname = sessionStorage.getItem("nickname");

let gameKey = "";
let currentRound = 1;
let memberGame = null;
let gameEnd = null;
let selectedChoice = "";
let ruleShown = false;
let gameProcessing = false;

initGame();

async function initGame(){
    if(!nickname){
        console.error("게임 사용자 정보가 없습니다.");
        return;
    }

    createGameUI();

    const date = koDate();
    gameKey = getGameKey(date);
    currentRound = getCurrentRound(date);

    bindGameChoiceEvents(selectChoice,confirmChoice);
    bindPlayerEvent();
    initGameChat(gameKey,nickname);
    bindTabEvent();

    try{
        await ensureMemberMiniGame(nickname,gameKey);
        await processDueGameResults(gameKey,currentRound);
        await loadGameState();
    }catch(error){
        console.error("게임 초기 로딩 오류:",error);
    }
}

async function loadGameState(){
    memberGame = await loadMemberGame(nickname,gameKey);
    gameEnd = await loadGameEnd(gameKey);

    const roundData = await loadGameRound(gameKey,currentRound);
    selectedChoice = roundData?.player?.[nickname] || "";

    setGameTitle(currentRound);
    renderGame();
}

async function processGameTab(){
    if(gameProcessing) return;

    gameProcessing = true;

    try{
        const previousResult = await processPreviousGameResult(
            nickname,
            gameKey,
            currentRound
        );

        if(previousResult?.message){
            await showGameResultPopup(
                previousResult.message,
                previousResult.round,
                round => showRoundResult(previousResult.gameKey,round)
            );
        }

        await processDueGameResults(gameKey,currentRound);

        memberGame = await loadMemberGame(nickname,gameKey);
        gameEnd = await loadGameEnd(gameKey);

        const results = await processMemberResults(
            nickname,
            gameKey,
            currentRound
        );

        for(const result of results){
            if(result?.message){
                await showGameResultPopup(
                    result.message,
                    result.round,
                    round => showRoundResult(gameKey,round)
                );
            }
        }

        await loadGameState();

        if(currentRound === 1 && !selectedChoice && !ruleShown){
            ruleShown = true;
            await showGameRulePopup();
        }
    }catch(error){
        console.error("게임 처리 오류:",error);
    }finally{
        gameProcessing = false;
    }
}

async function showRoundResult(targetGameKey,round){
    try{
        const roundData = await loadGameRound(targetGameKey,round);
        const players = roundData?.player || {};
        const choices = getRoundChoices(round);

        await showGameRoundResultPopup(round,players,choices);
    }catch(error){
        console.error("라운드 결과 불러오기 오류:",error);
    }
}

function selectChoice(choice){
    if(!canSelectCurrentRound()) return;
    if(!canSelectChoice(currentRound,choice)) return;

    selectedChoice = choice;

    renderChoiceState(
        selectedChoice,
        true,
        getRoundChoices(currentRound)
    );
}

async function confirmChoice(){
    if(!canSelectCurrentRound()) return;
    if(!canSelectChoice(currentRound,selectedChoice)) return;

    const button = document.getElementById("gameConfirmBtn");

    if(button){
        button.disabled = true;
    }

    try{
        const saved = await saveGameChoice(
            nickname,
            gameKey,
            currentRound,
            selectedChoice
        );

        if(!saved){
            await loadGameState();
            return;
        }

        if(currentRound === 1 && memberGame?.alive !== true){
            await setGameAlive(nickname,gameKey,true);
        }

        await loadGameState();
    }catch(error){
        console.error("게임 선택 저장 오류:",error);
    }finally{
        renderGame();
    }
}

function canSelectCurrentRound(){
    return canSelectRound(
        memberGame,
        currentRound,
        gameEnd
    );
}

function renderGame(){
    const enabled = canSelectCurrentRound();
    const activeChoices = getRoundChoices(currentRound);

    renderChoiceState(
        selectedChoice,
        enabled,
        activeChoices
    );

    updateGameTop({
        currentRound,
        memberGame,
        selectedChoice,
        eliminationRound:findEliminationRound(memberGame),
        gameEnd,
        nickname
    });

    updatePlayerButton();
}

function updatePlayerButton(){
    const playerBtn = document.getElementById("gamePlayerOpen");
    if(!playerBtn) return;

    if(gameEnd){
        const winners = Object.keys(gameEnd.winners || {});
        playerBtn.textContent = winners.length > 0 ? "우승자" : "결과";
        return;
    }

    playerBtn.textContent = "생존자";
}

function bindPlayerEvent(){
    const playerBtn = document.getElementById("gamePlayerOpen");
    if(!playerBtn) return;

    playerBtn.addEventListener("click",async () => {
        if(playerBtn.disabled) return;
        playerBtn.disabled = true;

        try{
            const latestEnd = await loadGameEnd(gameKey);
            gameEnd = latestEnd;

            if(gameEnd){
                const winners = gameEnd.winners || {};
                const hasWinners = Object.keys(winners).length > 0;

                updatePlayerButton();
                showGamePlayerPopup(
                    winners,
                    hasWinners ? "우승자 목록" : "우승자 없음"
                );
                return;
            }

            const targetRound = currentRound === 1 ? 1 : currentRound - 1;
            const roundData = await loadGameRound(gameKey,targetRound);

            const players = currentRound === 1
                ? roundData?.player || {}
                : roundData?.live || {};

            showGamePlayerPopup(players,"생존자 목록");
        }catch(error){
            console.error("생존자 목록 불러오기 오류:",error);
        }finally{
            playerBtn.disabled = false;
        }
    });
}

function bindTabEvent(){
    document.querySelectorAll(".contentTab").forEach(button => {
        button.addEventListener("click",async () => {
            if(button.dataset.tab !== "game") return;
            await processGameTab();
        });
    });
}
