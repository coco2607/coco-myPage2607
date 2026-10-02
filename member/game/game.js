// game.js
import {
    loadMemberGame,
    loadGameRound,
    loadGameDie,
    saveGameChoice,
    saveRoundDie,
    saveGameResultCheck,
    saveGameElimination
} from "./gameFirebase.js";

import {
    createGameUI,
    setGameTitle,
    bindGameChoiceEvents,
    renderChoiceState,
    updateGameTop,
    showGameResultPopup,
    showGameRulePopup
} from "./gameUi.js";

import {
    initGameChat
} from "./gameChat.js";

import {koDate} from "../../utils.js";

const nickname = sessionStorage.getItem("nickname");

let monthKey = "";
let currentRound = 1;
let memberGame = null;
let selectedChoice = "";
let ruleShown = false;

initGame();
async function initGame(){
    createGameUI();

    const date = koDate();

    monthKey = date.substring(0,7);
    currentRound = getCurrentRound(date);

    setGameTitle(currentRound);

    bindGameChoiceEvents(
        selectChoice,
        confirmChoice
    );

    initGameChat(
        monthKey,
        nickname
    );

    bindTabEvent();

    await loadGame();
}

async function loadGame(){
    try{
        await ensurePreviousResults();

        memberGame = await loadMemberGame(
            nickname,
            monthKey
        );

        await checkMemberStatus();

        memberGame = await loadMemberGame(
            nickname,
            monthKey
        );

        selectedChoice =
            memberGame?.[`r${currentRound}`] || "";

        renderGame();
    }catch(error){
        console.error(
            "게임 로딩 오류:",
            error
        );
    }
}

function getCurrentRound(date){
    const day =
        Number(date.substring(8,10));

    if(day <= 6){
        return 1;
    }

    if(day <= 12){
        return 2;
    }

    if(day <= 18){
        return 3;
    }

    if(day <= 24){
        return 4;
    }

    return 5;
}

async function ensurePreviousResults(){
    for(
        let round = 1;
        round < currentRound;
        round++
    ){
        await ensureRoundResult(round);
    }
}

async function ensureRoundResult(round){
    if(round > 4){
        return;
    }

    const savedDie =
        await loadGameDie(
            monthKey,
            round
        );

    if(
        Object.keys(savedDie).length > 0
    ){
        return;
    }

    const roundData =
        await loadGameRound(
            monthKey,
            round
        );

    const result =
        countChoices(roundData);

    if(result.total === 0){
        return;
    }

    const max = Math.max(
        result.A,
        result.B,
        result.C,
        result.D,
        result.E
    );

    const dieChoices = [];

    ["A","B","C","D","E"]
        .forEach(choice => {
            if(
                result[choice] === max &&
                max > 0
            ){
                dieChoices.push(choice);
            }
        });

    await saveRoundDie(
        monthKey,
        round,
        dieChoices
    );
}

function countChoices(data){
    const result = {
        A:0,
        B:0,
        C:0,
        D:0,
        E:0,
        total:0
    };

    Object.values(data || {})
        .forEach(choice => {
            if(
                choice === "A" ||
                choice === "B" ||
                choice === "C" ||
                choice === "D" ||
                choice === "E"
            ){
                result[choice]++;
                result.total++;
            }
        });

    return result;
}

async function checkMemberStatus(){
    if(!memberGame){
        return;
    }

    if(memberGame.alive === false){
        return;
    }

    for(
        let round = 1;
        round < currentRound;
        round++
    ){
        const choice =
            memberGame[`r${round}`];

        const checked =
            memberGame[`check${round}`];

        if(checked === true){
            continue;
        }

        if(!choice){
            await saveGameElimination(
                nickname,
                monthKey
            );

            await showGameResultPopup(
                `Round ${round} 결과`,
                `Round ${round} 미참가로 탈락하였습니다.`
            );

            await saveGameResultCheck(
                nickname,
                monthKey,
                round
            );

            memberGame =
                await loadMemberGame(
                    nickname,
                    monthKey
                );

            return;
        }

        const die =
            await loadGameDie(
                monthKey,
                round
            );

        if(
            Object.keys(die).length === 0
        ){
            return;
        }

        if(die[choice]){
            await saveGameElimination(
                nickname,
                monthKey
            );

            await showGameResultPopup(
                `Round ${round} 결과`,
                "탈락하셨습니다."
            );

            await saveGameResultCheck(
                nickname,
                monthKey,
                round
            );

            memberGame =
                await loadMemberGame(
                    nickname,
                    monthKey
                );

            return;
        }

        await showGameResultPopup(
            `Round ${round} 결과`,
            `생존하셨습니다. Round ${round + 1}에 진출합니다.`
        );

        await saveGameResultCheck(
            nickname,
            monthKey,
            round
        );

        memberGame =
            await loadMemberGame(
                nickname,
                monthKey
            );
    }
}

function selectChoice(choice){
    if(!canSelectCurrentRound()){
        return;
    }

    selectedChoice = choice;

    renderChoiceState(
        selectedChoice,
        true
    );
}

async function confirmChoice(){
    if(!canSelectCurrentRound()){
        return;
    }

    if(selectedChoice === ""){
        return;
    }

    const button =
        document.getElementById(
            "gameConfirmBtn"
        );

    if(button){
        button.disabled = true;
    }

    try{
        await saveGameChoice(
            nickname,
            monthKey,
            currentRound,
            selectedChoice
        );

        memberGame =
            await loadMemberGame(
                nickname,
                monthKey
            );

        selectedChoice =
            memberGame?.[
                `r${currentRound}`
            ] || "";

        renderGame();
    }catch(error){
        console.error(
            "게임 선택 저장 오류:",
            error
        );
    }finally{
        if(button){
            button.disabled = false;
        }

        renderGame();
    }
}

function canSelectCurrentRound(){
    if(
        memberGame?.alive === false
    ){
        return false;
    }

    if(currentRound === 1){
        return true;
    }

    if(!memberGame){
        return false;
    }

    if(
        Number(memberGame.round) <
        currentRound - 1
    ){
        return false;
    }

    if(
        memberGame[
            `check${currentRound - 1}`
        ] !== true
    ){
        return false;
    }

    return true;
}

function renderGame(){
    const enabled =
        canSelectCurrentRound();

    renderChoiceState(
        selectedChoice,
        enabled
    );

    updateGameTop({
        currentRound,
        memberGame,
        eliminationRound:
            findEliminationRound()
    });
}

function findEliminationRound(){
    if(
        !memberGame ||
        memberGame.alive !== false
    ){
        return null;
    }

    for(
        let round = 5;
        round >= 1;
        round--
    ){
        if(
            memberGame[
                `check${round}`
            ] === true
        ){
            return round;
        }
    }

    return (
        Number(memberGame.round) || 1
    );
}

function bindTabEvent(){
    document.querySelectorAll(".contentTab").forEach(button => {
        button.addEventListener("click",async () => {
            if(button.dataset.tab !== "game"){
                return;
            }

            updateGameTop({
                currentRound,
                memberGame,
                eliminationRound:findEliminationRound()
            });

            if(
                currentRound === 1 &&
                !memberGame?.r1 &&
                !ruleShown
            ){
                ruleShown = true;
                await showGameRulePopup();
            }
        });
    });
}