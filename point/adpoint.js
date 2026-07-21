// point/adpoint.js

import { applyPoint } from "./adpointFirebase.js";
import { createDropdown } from "./dropdown.js";


// DOM
const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");

const pointModal = document.getElementById("pointModal");
const pointTitle = document.getElementById("pointTitle");
const pointRows = document.getElementById("pointRows");

const pointScroll = document.querySelector(".pointScroll");

const pointApplyBtn = document.getElementById("pointApplyBtn");
const pointCancelBtn = document.getElementById("pointCancelBtn");

const pointConfirmModal = document.getElementById("pointConfirmModal");
const pointConfirmList = document.getElementById("pointConfirmList");
const pointConfirmBtn = document.getElementById("pointConfirmBtn");
const pointConfirmCancelBtn = document.getElementById("pointConfirmCancelBtn");

const alertModal = document.getElementById("alertModal");
const alertMessage = document.getElementById("alertMessage");
const alertCloseBtn = document.getElementById("alertCloseBtn");


// 상태
const START_ROW = 5;

const minusPointMap = {
    "마패권 교환": 5,
    "일벙권 교환": 20,
    "일방권 교환": 15,
    "쉴드권 교환": 10,
    "폭탄권 교환": 10,
    "아메리카노 교환": 25,
    "닉꾸아이템 교환": 40,
};

const plusEventList = [
    "벙참 랭킹 보상",
    "채팅 랭킹 보상"
];

let mode = "plus";
let pointData = [];


function showAlert(message) {

    alertMessage.textContent = message;
    alertModal.classList.remove("hidden");
}


// 적립
plusBtn.addEventListener("click", () => {

    mode = "plus";
    openPointModal();
});


// 사용
minusBtn.addEventListener("click", () => {

    mode = "minus";
    openPointModal();
});


// 알림 확인
alertCloseBtn.addEventListener("click", () => {

    alertModal.classList.add("hidden");

});


// 모달 열기
function openPointModal() {

    if (mode === "plus") {

        pointTitle.textContent = "포인트 적립";
        pointTitle.className = "plus";
    } else {

        pointTitle.textContent = "포인트 사용";
        pointTitle.className = "minus";
    }

    pointRows.innerHTML = "";

    for (let i = 0; i < START_ROW; i++) {
        addRow();
    }
    pointModal.classList.remove("hidden");
}


function hideAllDropdown() {

    [...pointRows.children].forEach(row => {

        row.nicknameDropdown?.hide();
        row.eventDropdown?.hide();

    });

}

// 행 생성
function addRow() {

    const row = document.createElement("div");
    row.className = "pointRow";

    // 닉네임
    const nickname = createDropdown({
        items: [],          // 회원목록 넣기
        placeholder: "닉네임"
    });

    // 내용
    const event = createDropdown({
        items: mode === "plus"
            ? plusEventList
            : Object.keys(minusPointMap),
        placeholder: "내용",

        onInput(value) {
            updatePointByEvent(value);
        },

        onSelect(item) {
            updatePointByEvent(item);
        }
    });

    row.nicknameDropdown = nickname;
    row.eventDropdown = event;

    // 포인트
    const point = document.createElement("input");
    point.type = "number";
    point.placeholder = "포인트";
    point.min = 1;
    point.step = 1;


    function updatePointByEvent(value) {

        if (mode !== "minus") return;

        if (minusPointMap[value] !== undefined) {
            point.value = minusPointMap[value];
            point.readOnly = true;
        } else {
            point.value = "";
            point.readOnly = false;
        }
    } 


    const eventInput = event.element.querySelector(".dropdownInput");

    row.appendChild(nickname.element);
    row.appendChild(event.element);
    row.appendChild(point);

    pointRows.appendChild(row);

    requestAnimationFrame(() => {
        if (pointRows.children.length > START_ROW) {
            pointScroll.scrollTop = pointScroll.scrollHeight;
        }

    });

    // 마지막 줄 자동 추가
    const nicknameInput =
        nickname.element.querySelector(".dropdownInput");

    nicknameInput.addEventListener("input", () => {

        const rows = [...pointRows.children];

        if (
            rows[rows.length - 1] === row &&
            nickname.value !== ""
        ) {
            addRow();
        }

    });

    // 기존 코드와 호환되도록 value 제공
    Object.defineProperty(row.children[0], "value", {
        get() {
            return nickname.value;
        }
    });

    Object.defineProperty(row.children[1], "value", {
        get() {
            return event.value;
        }
    });

}


// 취소
pointCancelBtn.addEventListener("click", () => {

    hideAllDropdown();
    pointModal.classList.add("hidden");
});


// 적용
pointApplyBtn.addEventListener("click", () => {

    pointData = [];
    pointConfirmList.innerHTML = "";

    const rows = [...pointRows.children];

    let hasError = false;

    rows.forEach(row => {

        const nickname = row.children[0].value.trim();
        const event = row.children[1].value;
        const point = Number(row.children[2].value);

        // 완전히 빈 줄은 무시
        if (!nickname && !event && !point) {
            return;
        }

        // 하나라도 빠져 있으면 오류
        if (!nickname || !event || !point || point <= 0) {
            hasError = true;
            return;
        }

        pointData.push({
            nickname,
            event,
            point
        });

    });

    
    if (hasError) {
        showAlert("닉네임, 내용, 포인트\n모두 입력해주세요.");
        return;
    }

    if (pointData.length === 0) {
        return;
    }

    pointData.forEach(item => {

        const row = document.createElement("div");
        row.className = "pointConfirmRow";

        row.innerHTML = `
            <span>${item.nickname}</span>
            <span>${item.event}</span>
            <span>${item.point}P</span>
        `;

        pointConfirmList.appendChild(row);

    });

    pointModal.classList.add("hidden");
    pointConfirmModal.classList.remove("hidden");
});


// 아니오
pointConfirmCancelBtn.addEventListener("click", () => {

    hideAllDropdown();

    pointConfirmModal.classList.add("hidden");
    pointModal.classList.remove("hidden");
});


// 예
pointConfirmBtn.addEventListener("click", async () => {

    try {

        await applyPoint(mode, pointData);

        pointConfirmModal.classList.add("hidden");

    } catch (err) {

        (err.message);
    }
});