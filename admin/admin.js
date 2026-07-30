// admin.js

import {loadUsers, loadHistory} from "./adminFirebase.js";
import { openStateModal } from "../mstate/mstate.js";
import { changeNickname } from "./changenmFirebase.js";
import "../point/adpoint.js";

// 관리자 로그인 확인
const isAdmin = sessionStorage.getItem("isAdmin");

if (isAdmin !== "true") {
    location.href = "../login/login.html";
}

const memberList = document.getElementById("memberList");

const historyModal = document.getElementById("historyModal");
const historyTitle = document.getElementById("historyTitle");
const historyList = document.getElementById("historyList");
const historyCloseBtn = document.getElementById("historyCloseBtn");
const nicknameChangeBtn = document.getElementById("nicknameChangeBtn");

const nicknameModal = document.getElementById("nicknameModal");
const nicknameInput = document.getElementById("nicknameInput");
const nicknameSaveBtn = document.getElementById("nicknameSaveBtn");
const nicknameCancelBtn = document.getElementById("nicknameCancelBtn");

const nicknameConfirmModal = document.getElementById("nicknameConfirmModal");
const nicknameConfirmText = document.getElementById("nicknameConfirmText");
const nicknameConfirmBtn = document.getElementById("nicknameConfirmBtn");
const nicknameConfirmCancelBtn = document.getElementById("nicknameConfirmCancelBtn");

const stateSelectModal = document.getElementById("stateSelectModal");
const stateSelectSave = document.getElementById("stateSelectSave");
const stateSelectCancel = document.getElementById("stateSelectCancel");

let memberData = [];
let currentStateButton = null;

let selectedNickname = "";
let selectedState = "";

let currentNickname = "";
let newNickname = "";



historyCloseBtn.addEventListener("click", () => {
    historyModal.classList.add("hidden");
});

nicknameChangeBtn.addEventListener("click", () => {

    nicknameInput.value = "";

    nicknameModal.classList.remove("hidden");

    nicknameInput.focus();
});


nicknameCancelBtn.addEventListener("click", () => {

    nicknameModal.classList.add("hidden");

});

nicknameSaveBtn.addEventListener("click", () => {

    newNickname = nicknameInput.value.trim();

    if (!newNickname) {
        nicknameConfirmText.textContent = "새 닉네임을 입력해주세요.";

        nicknameConfirmBtn.textContent = "확인";
        nicknameConfirmCancelBtn.classList.add("hidden");

        nicknameModal.classList.add("hidden");
        nicknameConfirmModal.classList.remove("hidden");
        return;
    }

    
    if (newNickname === currentNickname) {
        nicknameModal.classList.add("hidden");

        nicknameConfirmText.textContent = "기존 닉네임과 동일합니다.";

        nicknameConfirmBtn.textContent = "확인";
        nicknameConfirmCancelBtn.classList.add("hidden");
        nicknameConfirmModal.classList.remove("hidden");
        return;
    }  

    nicknameModal.classList.add("hidden");

    // 원래 상태로 복원
    nicknameConfirmBtn.textContent = "예";
    nicknameConfirmCancelBtn.classList.remove("hidden");

    nicknameConfirmText.innerHTML =
        `${currentNickname}를<br><span class="newNickname">${newNickname}</span>로 변경하시겠습니까?`;
        //`'${currentNickname}'를<br><br>'${newNickname}'로 변경하시겠습니까?`;

    nicknameConfirmModal.classList.remove("hidden");

});

nicknameConfirmCancelBtn.addEventListener("click", () => {

    nicknameConfirmModal.classList.add("hidden");

});

nicknameConfirmBtn.addEventListener("click", async () => {

    // 단순 확인 모드
    if (nicknameConfirmBtn.textContent === "확인") {

        nicknameConfirmModal.classList.add("hidden");

        nicknameConfirmBtn.textContent = "예";
        nicknameConfirmCancelBtn.classList.remove("hidden");

        // 입력창 다시 열기
        nicknameModal.classList.remove("hidden");
        nicknameInput.focus();

        return;

    }

    // 닉네임 변경 모드
    await changeNickname(currentNickname, newNickname);

    nicknameConfirmModal.classList.add("hidden");
    historyModal.classList.add("hidden");

    await init();

});

stateSelectSave.addEventListener("click", () => {

    stateSelectModal.classList.add("hidden");

    openStateModal(
        selectedNickname,
        selectedState,
        currentStateButton
    );

});


stateSelectCancel.addEventListener("click", () => {
    stateSelectModal.classList.add("hidden");
});

// 시작
init();

document.addEventListener("memberUpdated", async () => {
    await init();
});


async function init() {
    memberData = await loadUsers();
    render(memberData);
}

// 회원 출력
function render(list) {
    const memberCount = document.getElementById("memberCount");
    memberCount.textContent = `(${list.length}명)`;

    memberList.innerHTML = "";

    if (list.length === 0) {

        memberList.innerHTML = `
            <div class="memberItem">
                회원이 없습니다.
            </div>
        `;

        return;
    }

    list.forEach(user => {

        memberList.innerHTML += `

            <div class="memberItem">

                <div 
                    class="memberNick"
                    data-key="${user.nickname}">
                    ${user.nickname}
                </div>

                <div class="memberPoint">
                    ${user.totalP ?? 0}P
                </div>

                <div class="memberDate">
                    ${user.date ?? ""}
                </div>

                <button
                    class="stateSelect ${user.state === "외출" ? "outing" : ""}"
                    data-key="${user.nickname}">

                    ${user.state ?? "활동"}

                </button>

            </div>
        `;
    });


    // 회원명 클릭 이벤트
    document.querySelectorAll(".memberNick").forEach(nick => {

        nick.addEventListener("click", async () => {

            const nickname = nick.dataset.key;
            const history = await loadHistory();
            const userHistory = history.filter(
                item => item.nickname === nickname
            );

            showHistory(nickname, userHistory);
        });
    });    

    // 상태 버튼 이벤트
    document.querySelectorAll(".stateSelect").forEach(button => {

        button.addEventListener("click", () => {

            currentStateButton = button;
            selectedNickname = button.dataset.key;
            selectedState = button.textContent.trim();

            document.querySelectorAll(".stateChoice").forEach(radio => {
                radio.checked = (radio.dataset.state === selectedState);
            });

            stateSelectModal.classList.remove("hidden");

        });

    });

    document.querySelectorAll(".stateChoice").forEach(radio => {

        radio.addEventListener("change", () => {
            if (radio.checked) {
                selectedState = radio.dataset.state;
            }
        });
    });

    
}


// 히스토리 표시
function showHistory(nickname, list) {

    historyTitle.textContent =`${nickname} 포인트 내역`;
    currentNickname = nickname;

    historyList.innerHTML = "";

    if (list.length === 0) {

        historyList.innerHTML =
            `
            <div class="historyItem">
                포인트 내역이 없습니다.
            </div>
            `;

    }
    else {

        list
        .sort((a, b) => b.timestamp - a.timestamp)
        .forEach(data => {

            if (data.normal || data.special) {

                addHistory(
                    data.joinDate,
                    "벙참 보드게임 참여",
                    data.tpoint
                );
            }

            if (data.event) {

                addHistory(
                    data.joinDate,
                    data.event,
                    data.eventPoint
                );
            }

            if (data.redeem) {

                addHistory(
                    data.joinDate,
                    data.redeem,
                    data.redeemPoint
                );
            }
        });
    }

    historyModal.classList.remove("hidden");
}


// 날짜 형식
function formatDate(value) {

    if (value == null || value === "") {
        return "";
    }

    // 문자열 날짜
    if (typeof value === "string") {

        const date = new Date(value);

        if (!isNaN(date.getTime())) {

            return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}`;

        }

        return value;

    }


    // 엑셀 날짜 숫자
    if (typeof value === "number") {

        const date = new Date(
            Math.round((value - 25569) * 86400000)
        );

        return `${date.getUTCFullYear()}. ${String(date.getUTCMonth() + 1).padStart(2, "0")}. ${String(date.getUTCDate()).padStart(2, "0")}`;

    }

    return "";

}


//히스토리 보이기
function addHistory(date, memo, point) {

    const item = document.createElement("div");

    item.className = "historyItem";

    item.innerHTML = `
        <div class="historyRow">

            <div class="historyDate">
                ${formatDate(date)}
            </div>

            <div class="historyMemo">
                ${memo}
            </div>

            <div class="historyPoint ${point >= 0 ? "plus" : "minus"}">

                <span class="sign">
                    ${point >= 0 ? "+" : "-"}
                </span>

                <span class="pointValue">
                    ${Math.abs(point)}P
                </span>
            </div>
        </div>
    `;
    historyList.appendChild(item);
}

function updateFooterHeight() {
    const footer = document.querySelector(".footerInfo");
    if (!footer) return;

    document.documentElement.style.setProperty(
        "--footer-height",
        `${footer.offsetHeight}px`
    );
}

window.addEventListener("load", updateFooterHeight);
window.addEventListener("resize", updateFooterHeight);