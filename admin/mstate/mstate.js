// mstate.js

import {saveMemberState} from "./mstateFirebase.js";

const stateSelectModal = document.getElementById("stateSelectModal");
const stateSelectSave = document.getElementById("stateSelectSave");
const stateSelectCancel = document.getElementById("stateSelectCancel");
const stateChoices = document.querySelectorAll(".stateChoice");

const mstateModal = document.getElementById("mstateModal");
const mstateText = document.getElementById("mstateText");
const mstateConfirm = document.getElementById("mstateConfirm");
const mstateCancel = document.getElementById("mstateCancel");

let currentNickname = "";
let currentState = "";
let selectedState = "";

export function openStateSelect(nickname,state){
    currentNickname = nickname;
    currentState = state;
    selectedState = state;

    stateChoices.forEach(radio => {
        radio.checked =
            radio.dataset.state === state;
    });

    stateSelectModal.classList.remove("hidden");
}

stateChoices.forEach(radio => {
    radio.addEventListener("change",() => {
        if(radio.checked){
            selectedState = radio.dataset.state;
        }
    });
});

stateSelectSave.addEventListener("click",() => {
    stateSelectModal.classList.add("hidden");

    if(selectedState === currentState){
        return;
    }

    openStateConfirm();
});

stateSelectCancel.addEventListener("click",() => {
    stateSelectModal.classList.add("hidden");
});

function openStateConfirm(){
    if(selectedState === "삭제"){
        mstateText.textContent =
            `${currentNickname}님을 "삭제" 하시겠습니까?`;
    }else{
        mstateText.textContent =
            `${currentNickname}님을 "${selectedState}" 로 변경하시겠습니까?`;
    }

    mstateModal.classList.remove("hidden");
}

function closeStateConfirm(){
    mstateModal.classList.add("hidden");
}

mstateConfirm.addEventListener("click",async () => {
    try{
        const changed = await saveMemberState(
            currentNickname,
            selectedState
        );

        closeStateConfirm();

        if(!changed){
            return;
        }

        currentState = selectedState;

        document.dispatchEvent(
            new Event("memberUpdated")
        );
    }catch(error){
        console.error("회원 상태 변경 실패:",error);
    }
});

mstateCancel.addEventListener("click",() => {
    closeStateConfirm();
});