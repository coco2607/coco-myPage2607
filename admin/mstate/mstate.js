// mstate.js
import {saveMemberState} from "./mstateFirebase.js";

const outingModal = document.getElementById("outingModal");
const returnDate = document.getElementById("returnDate");
const outingSaveBtn = document.getElementById("outingSaveBtn");
const outingCancelBtn = document.getElementById("outingCancelBtn");

const mstateModal = document.getElementById("mstateModal");
const mstateText = document.getElementById("mstateText");
const mstateConfirm = document.getElementById("mstateConfirm");
const mstateCancel = document.getElementById("mstateCancel");

let currentNickname = "";
let currentState = "";

export function openStateSelect(nickname,state){
    currentNickname = nickname;
    currentState = state;

    if(state === "외출"){
        openActivityConfirm();
        return;
    }

    openOutingModal();
}

function openOutingModal(){
    returnDate.value = "";
    returnDate.required = true;
    outingModal.classList.remove("hidden");
}

function closeOutingModal(){
    outingModal.classList.add("hidden");
    returnDate.value = "";
}

function openActivityConfirm(){
    mstateText.textContent =
        `${currentNickname}님을 활동 상태로\n변경하시겠습니까?`;
    mstateModal.classList.remove("hidden");
}

function closeActivityConfirm(){
    mstateModal.classList.add("hidden");
}

outingSaveBtn.addEventListener("click",async () => {
    if(!returnDate.value){
        returnDate.reportValidity();
        return;
    }

    try{
        const changed = await saveMemberState(
            currentNickname,
            "외출",
            returnDate.value
        );

        if(!changed){
            return;
        }

        currentState = "외출";
        closeOutingModal();
        document.dispatchEvent(new Event("memberUpdated"));
    }catch(error){
        console.error("외출 상태 변경 실패:",error);
    }
});

outingCancelBtn.addEventListener("click",() => {
    closeOutingModal();
});

mstateConfirm.addEventListener("click",async () => {
    try{
        const changed = await saveMemberState(
            currentNickname,
            "활동"
        );

        if(!changed){
            return;
        }

        currentState = "활동";
        closeActivityConfirm();
        document.dispatchEvent(new Event("memberUpdated"));
    }catch(error){
        console.error("활동 상태 변경 실패:",error);
    }
});

mstateCancel.addEventListener("click",() => {
    closeActivityConfirm();
});