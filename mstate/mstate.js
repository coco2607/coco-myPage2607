// mstate.js

import {saveMemberState} from "./mstateFirebase.js";


const modal = document.getElementById("mstateModal");
const text = document.getElementById("mstateText");

const confirmBtn = document.getElementById("mstateConfirm");
const cancelBtn = document.getElementById("mstateCancel");

let currentNickname = "";
let currentState = "";
let currentButton = null;

// 모달 열기
export function openStateModal(nickname, state, button) {

    currentNickname = nickname;
    currentState = state;
    currentButton = button;

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

    const changed = await saveMemberState(
        currentNickname,
        currentState
    );

    closeModal();

    // 변경된 것이 없으면 종료
    if (!changed) {
        return;
    }

    const item = currentButton.parentElement;

    // 삭제
    if (currentState === "삭제") {

        item.remove();

        // 회원 수 갱신
        const memberCount = document.getElementById("memberCount");
        const count = document.querySelectorAll(".memberItem").length;
        memberCount.textContent = `(${count}명)`;

        return;
    }

    // 상태 선택박스
    const select = item.querySelector(".stateSelect");

    select.value = currentState;

    if (currentState === "외출") {
        select.classList.add("outing");
        item.querySelector(".memberPoint").textContent = "0P";
    } else {
        select.classList.remove("outing");
    }
});

// 아니오
cancelBtn.addEventListener("click", () => {
    closeModal();
});

