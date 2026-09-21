// changenm.js

import {changeNickname} from "./changenmFirebase.js";

const historyModal = document.getElementById("historyModal");
const nicknameChangeBtn = document.getElementById("nicknameChangeBtn");

const nicknameModal = document.getElementById("nicknameModal");
const nicknameInput = document.getElementById("nicknameInput");
const nicknameSaveBtn = document.getElementById("nicknameSaveBtn");
const nicknameCancelBtn = document.getElementById("nicknameCancelBtn");

const nicknameConfirmModal = document.getElementById("nicknameConfirmModal");
const nicknameConfirmText = document.getElementById("nicknameConfirmText");
const nicknameConfirmBtn = document.getElementById("nicknameConfirmBtn");
const nicknameConfirmCancelBtn = document.getElementById("nicknameConfirmCancelBtn");

let currentNickname = "";
let newNickname = "";

export function setNicknameTarget(nickname){
    currentNickname = nickname || "";
}

nicknameChangeBtn.addEventListener("click",() => {
    if(!currentNickname){
        return;
    }

    nicknameInput.value = "";
    nicknameModal.classList.remove("hidden");
    nicknameInput.focus();
});

nicknameCancelBtn.addEventListener("click",() => {
    nicknameModal.classList.add("hidden");
});

nicknameSaveBtn.addEventListener("click",checkNickname);

nicknameInput.addEventListener("keydown",event => {
    if(event.key === "Enter"){
        event.preventDefault();
        checkNickname();
    }
});

nicknameConfirmCancelBtn.addEventListener("click",() => {
    nicknameConfirmModal.classList.add("hidden");
});

nicknameConfirmBtn.addEventListener("click",confirmNicknameChange);

function checkNickname(){
    newNickname = nicknameInput.value.trim();

    if(!newNickname){
        showMessage("새 닉네임을 입력해주세요.");
        return;
    }

    if(newNickname === currentNickname){
        showMessage("기존 닉네임과 동일합니다.");
        return;
    }

    nicknameModal.classList.add("hidden");

    nicknameConfirmBtn.textContent = "예";
    nicknameConfirmCancelBtn.classList.remove("hidden");

    nicknameConfirmText.innerHTML =
        `${currentNickname}를<br><span class="newNickname">${newNickname}</span>로 변경하시겠습니까?`;

    nicknameConfirmModal.classList.remove("hidden");
}

function showMessage(message){
    nicknameModal.classList.add("hidden");

    nicknameConfirmText.textContent = message;
    nicknameConfirmBtn.textContent = "확인";
    nicknameConfirmCancelBtn.classList.add("hidden");

    nicknameConfirmModal.classList.remove("hidden");
}

async function confirmNicknameChange(){
    if(nicknameConfirmBtn.textContent === "확인"){
        nicknameConfirmModal.classList.add("hidden");

        nicknameConfirmBtn.textContent = "예";
        nicknameConfirmCancelBtn.classList.remove("hidden");

        nicknameModal.classList.remove("hidden");
        nicknameInput.focus();

        return;
    }

    try{
        await changeNickname(
            currentNickname,
            newNickname
        );

        nicknameConfirmModal.classList.add("hidden");
        historyModal.classList.add("hidden");

        currentNickname = newNickname;

        document.dispatchEvent(
            new Event("memberUpdated")
        );
    }catch(error){
        console.error("닉네임 변경 실패:",error);

        nicknameConfirmText.textContent =
            "닉네임 변경 중 오류가 발생했습니다.";

        nicknameConfirmBtn.textContent = "확인";
        nicknameConfirmCancelBtn.classList.add("hidden");
    }
}