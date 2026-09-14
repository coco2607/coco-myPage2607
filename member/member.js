// member.js

import {
    loadUser,
    loadHistory
} from "./memberFirebase.js";

import {
    getVersion
} from "../utils.js";

// 로그인 닉네임
const nickname = sessionStorage.getItem("nickname");

// 요소
const memberNickname = document.getElementById("memberNickname");
const pointLabel = document.getElementById("pointLabel");
const totalPoint = document.getElementById("totalPoint");
const historyList = document.getElementById("historyList");
const boardPosition = document.getElementById("boardPosition");
const contentTabs = document.querySelectorAll(".contentTab");
const tabContents = document.querySelectorAll(".tabContent");
const version = document.getElementById("version");

// 회원정보
let memberUser = null;

memberNickname.textContent = `${nickname}님`;
version.textContent = `Ver ${getVersion()}`;

// 시작
loadMember();

// 회원정보
async function loadMember() {
    memberUser = await loadUser(nickname);

    if (memberUser) {
        boardPosition.textContent = `(보드게임 현 위치 ${memberUser.last ?? 0})`;
    } else {
        boardPosition.textContent = "(보드게임 현 위치 0)";
    }
}

// 탭 전환
contentTabs.forEach(tab => {
    tab.addEventListener("click", async () => {
        contentTabs.forEach(item => {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        tabContents.forEach(content => {
            content.classList.add("hidden");
        });

        const tabName = tab.dataset.tab;

        if (tabName === "attendance") {
            document.getElementById("attendanceContent").classList.remove("hidden");

            if (window.loadAttendance) {
                await window.loadAttendance();
            }
        }

        if (tabName === "point") {
            document.getElementById("pointContent").classList.remove("hidden");

            pointLabel.textContent = "누적포인트";
            totalPoint.textContent = `${memberUser?.totalP ?? 0}점`;

            await loadPointHistory();
        }
    });
});

// 포인트내역
async function loadPointHistory() {
    const history = await loadHistory(nickname);

    historyList.innerHTML = "";

    // 최신순 정렬
    history.sort((a, b) => {
        const aTime = getHistoryTime(a);
        const bTime = getHistoryTime(b);

        return bTime - aTime;
    });

    let hasHistory = false;

    history.forEach(data => {
        const getP = Number(data.getP) || 0;
        const useP = Number(data.useP) || 0;

        // 획득도 없고 사용도 없으면 표시하지 않음
        if (getP === 0 && useP === 0) {
            return;
        }

        const point = getP !== 0 ? getP : -useP;

        addHistory(
            getHistoryDate(data),
            data.type || "포인트",
            point
        );

        hasHistory = true;
    });

    if (!hasHistory) {
        historyList.innerHTML = "<div class='historyItem'>포인트 내역이 없습니다.</div>";
    }
}

// 히스토리 정렬용 시간
function getHistoryTime(data) {
    if (data.joinDate) {
        const time = new Date(data.joinDate).getTime();

        if (!isNaN(time)) {
            return time;
        }
    }

    return getPushKeyTimestamp(data.key);
}

// 히스토리 날짜
function getHistoryDate(data) {
    if (data.joinDate) {
        const date = new Date(data.joinDate);

        if (!isNaN(date.getTime())) {
            return data.joinDate;
        }
    }

    const timestamp = getPushKeyTimestamp(data.key);

    if (timestamp > 0) {
        return timestamp;
    }

    return "";
}

// Firebase push key의 생성 시간 추출
function getPushKeyTimestamp(key) {
    if (!key || key.length < 8) {
        return 0;
    }

    const PUSH_CHARS = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
    let timestamp = 0;

    for (let i = 0; i < 8; i++) {
        const index = PUSH_CHARS.indexOf(key.charAt(i));

        if (index === -1) {
            return 0;
        }

        timestamp = timestamp * 64 + index;
    }

    return timestamp;
}

// 날짜 형식
function formatDate(value) {
    if (value == null || value === "") {
        return "";
    }

    // timestamp
    if (typeof value === "number") {
        const date = new Date(value);

        if (isNaN(date.getTime())) {
            return "";
        }

        return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}`;
    }

    // 문자열 날짜
    if (typeof value === "string") {
        const date = new Date(value);

        if (!isNaN(date.getTime())) {
            return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}`;
        }

        return value;
    }

    return "";
}

// 히스토리 출력
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
                    ${Math.abs(point)}점
                </span>
            </div>
        </div>
    `;

    historyList.appendChild(item);
}