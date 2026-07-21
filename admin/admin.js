// admin.js

import {loadUsers, loadHistory} from "./adminFirebase.js";
import { openStateModal } from "../mstate/mstate.js";
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

let memberData = [];

historyCloseBtn.addEventListener("click", () => {

    historyModal.classList.add("hidden");

});

// 시작
init();

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

                <select
                    class="stateSelect ${user.state === "외출" ? "outing" : ""}"
                    data-key="${user.nickname}">

                    <option value="활동"
                        ${user.state === "활동" ? "selected" : ""}>
                        활동
                    </option>

                    <option value="외출"
                        ${user.state === "외출" ? "selected" : ""}>
                        외출
                    </option>

                    <option value="삭제"
                        ${user.state === "삭제" ? "selected" : ""}>
                        삭제
                    </option>

                </select>

                <button
                    class="saveBtn"
                    data-key="${user.nickname}">
                    저장
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


    // 저장 버튼 이벤트
    document.querySelectorAll(".saveBtn").forEach(button => {

        button.addEventListener("click", () => {

            const nickname = button.dataset.key;
            const state = button
                .parentElement
                .querySelector(".stateSelect")
                .value;
            openStateModal(nickname, state, button);
        });
    });
}


// 히스토리 표시
function showHistory(nickname, list) {

    historyTitle.textContent =
        `${nickname} 포인트 내역`;

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