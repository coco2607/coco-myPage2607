// member.js

import {
    loadUser,
    loadHistory
} from "./memberFirebase.js";


// 로그인 확인
const nickname = sessionStorage.getItem("nickname");

if (!nickname) {
    location.href = "../login/login.html";
}


// 요소
const memberNickname = document.getElementById("memberNickname");
const totalPoint = document.getElementById("totalPoint");
const historyList = document.getElementById("historyList");
const boardPosition = document.getElementById("boardPosition");

memberNickname.textContent = `${nickname}님`;



// 시작
loadMember();

async function loadMember() {

    const [user, history] = await Promise.all([
        loadUser(nickname),
        loadHistory(nickname)
    ]);

    // 회원정보
    if (user) {

        totalPoint.textContent = `${user.totalP ?? 0}점`;
        boardPosition.textContent = `(보드게임 현 위치 ${user.last ?? 0})`;

    } else {

        totalPoint.textContent = "0점";
        boardPosition.textContent = "(보드게임 현 위치 0)";

    }

    // 히스토리
    historyList.innerHTML = "";

    if (history.length === 0) {

        historyList.innerHTML =
            "<div class='historyItem'>포인트 내역이 없습니다.</div>";

        return;

    }

    history.forEach(data => {

        if (data.normal || data.special) {

            addHistory(
                data.joinDate,
                "벙참 보드게임 참가",
                data.tpoint,
                true
            );

        }

        if (data.event) {

            addHistory(
                data.joinDate,
                data.event,
                data.eventPoint,
                true
            );

        }

        if (data.redeem) {

            addHistory(
                data.joinDate,
                data.redeem,
                data.redeemPoint,
                false
            );

        }

    });

}


// 날짜 형식
function formatDate(value) {

    if (value == null || value === "") return "";

    // 문자열 날짜
    if (typeof value === "string") {

        const date = new Date(value);

        if (!isNaN(date.getTime())) {

            return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}`;

        }

        return value;

    }

    // 엑셀 날짜
    if (typeof value === "number") {

        const date = new Date(
            Math.round((value - 25569) * 86400000)
        );

        return `${date.getUTCFullYear()}. ${String(date.getUTCMonth() + 1).padStart(2, "0")}. ${String(date.getUTCDate()).padStart(2, "0")}`;

    }

    return "";

}


// 히스토리 출력
function addHistory(date, memo, point, plus) {

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
                <span class="sign">${point >= 0 ? "+" : "-"}</span>
                <span class="pointValue">${Math.abs(point)}점</span>
            </div>

        </div>
    `;

    historyList.appendChild(item);

}