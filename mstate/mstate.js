// mstate.js

import {saveMemberState} from "./mstateFirebase.js";


const modal = document.getElementById("mstateModal");
const text = document.getElementById("mstateText");

const confirmBtn = document.getElementById("mstateConfirm");
const cancelBtn = document.getElementById("mstateCancel");

let currentNickname = "";
let currentState = "";

// 모달 열기
export function openStateModal(nickname, state) {

    currentNickname = nickname;
    currentState = state;

    if (state === "삭제") {

        text.textContent =
            `${nickname}님을 "삭제" 하시겠습니까?`;

    } else {

        text.textContent =
            `${nickname}님을 "${state}" 로 변경합니다.`;

    }

    modal.classList.remove("hidden");

}

// 모달 닫기
function closeModal() {
    modal.classList.add("hidden");
}

// 예
confirmBtn.addEventListener("click", async () => {
    await saveMemberState(
        currentNickname,
        currentState
    );

    closeModal();
    location.reload();

});

// 아니오
cancelBtn.addEventListener("click", () => {
    closeModal();
});

