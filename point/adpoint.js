// point/adpoint.js

import { applyPoint } from "./adpointFirebase.js";
import { createDropdown } from "./dropdown.js";

// ===========================
// DOM
// ===========================
const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");

const pointModal = document.getElementById("pointModal");
const pointTitle = document.getElementById("pointTitle");
const pointRows = document.getElementById("pointRows");

const pointApplyBtn = document.getElementById("pointApplyBtn");
const pointCancelBtn = document.getElementById("pointCancelBtn");

const pointConfirmModal = document.getElementById("pointConfirmModal");
const pointConfirmList = document.getElementById("pointConfirmList");
const pointConfirmBtn = document.getElementById("pointConfirmBtn");
const pointConfirmCancelBtn = document.getElementById("pointConfirmCancelBtn");

// ===========================
// 상태
// ===========================
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

let mode = "plus";
let pointData = [];

// ===========================
// 적립
// ===========================
plusBtn.addEventListener("click", () => {

    mode = "plus";
    openPointModal();

});

// ===========================
// 사용
// ===========================
minusBtn.addEventListener("click", () => {

    mode = "minus";
    openPointModal();

});

// ===========================
// 모달 열기
// ===========================
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

// ===========================
// 행 생성
// ===========================
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
            ? []            // 적립 목록 넣기
            : Object.keys(minusPointMap),
        placeholder: "내용",
        onSelect(item) {

            if (mode !== "minus") return;

            if (minusPointMap[item] !== undefined) {
                point.value = minusPointMap[item];
                point.readOnly = true;
            } else {
                point.readOnly = false;
            }

        }
    });

    // 포인트
    const point = document.createElement("input");
    point.type = "number";
    point.placeholder = "포인트";
    point.min = 1;
    point.step = 1;

    row.appendChild(nickname.element);
    row.appendChild(event.element);
    row.appendChild(point);

    pointRows.appendChild(row);

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

// ===========================
// 취소
// ===========================
pointCancelBtn.addEventListener("click", () => {

    pointModal.classList.add("hidden");

});


// ===========================
// 적용
// ===========================
pointApplyBtn.addEventListener("click", () => {

    pointData = [];
    pointConfirmList.innerHTML = "";

    const rows = [...pointRows.children];

    rows.forEach(row => {

        const nickname = row.children[0].value.trim();
        const event = row.children[1].value;
        const point = Number(row.children[2].value);

        if (!nickname) return;
        if (!event) return;
        if (!point || point <= 0) return;

        pointData.push({
            nickname,
            event,
            point
        });

    });

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

// ===========================
// 아니오
// ===========================
pointConfirmCancelBtn.addEventListener("click", () => {

    pointConfirmModal.classList.add("hidden");
    pointModal.classList.remove("hidden");

});


// ===========================
// 예
// ===========================
pointConfirmBtn.addEventListener("click", async () => {

    try {

        await applyPoint(mode, pointData);

        pointConfirmModal.classList.add("hidden");

    } catch (err) {

        alert(err.message);

    }

});