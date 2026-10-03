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
    showGameRulePopup
} from "./gameUi.js";

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

    setGameTitle(
        currentRound,
        Number(roundData?.count) || 0
    );

    renderGame();
}

async function processGameTab(){
    if(gameProcessing){
        return;
    }

    gameProcessing = true;

    try{
        const previousResult = await processPreviousGameResult(
            nickname,
            gameKey,
            currentRound
        );

        if(previousResult?.message){
            await showGameResultPopup(previousResult.message);
        }

        await processDueGameResults(
            gameKey,
            currentRound
        );

        memberGame = await loadMemberGame(
            nickname,
            gameKey
        );

        gameEnd = await loadGameEnd(
            gameKey
        );

        const results = await processMemberResults(
            nickname,
            gameKey,
            currentRound
        );

        for(const result of results){
            if(result?.message){
                await showGameResultPopup(
                    result.message
                );
            }
        }

        await loadGameState();

        if(
            currentRound === 1 &&
            !selectedChoice &&
            !ruleShown
        ){
            ruleShown = true;
            await showGameRulePopup();
        }
    }catch(error){
        console.error("게임 처리 오류:",error);
    }finally{
        gameProcessing = false;
    }
}

function selectChoice(choice){
    if(!canSelectCurrentRound()){
        return;
    }

    if(!canSelectChoice(currentRound,choice)){
        return;
    }

    selectedChoice = choice;

    renderChoiceState(
        selectedChoice,
        true,
        getRoundChoices(currentRound)
    );
}

async function confirmChoice(){
    if(!canSelectCurrentRound()){
        return;
    }

    if(!canSelectChoice(currentRound,selectedChoice)){
        return;
    }

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

        if(
            currentRound === 1 &&
            memberGame?.alive !== true
        ){
            await setGameAlive(
                nickname,
                gameKey,
                true
            );
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
        gameEnd
    });
}

function bindTabEvent(){
    document.querySelectorAll(".contentTab").forEach(button => {
        button.addEventListener("click",async () => {
            if(button.dataset.tab !== "game"){
                return;
            }

            await processGameTab();
        });
    });
}