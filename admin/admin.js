// admin.js

import {loadUsers} from "./adminFirebase.js";
import { openStateModal } from "../mstate/mstate.js";

// 관리자 로그인 확인
const isAdmin = sessionStorage.getItem("isAdmin");

if (isAdmin !== "true") {
    location.href = "../login/login.html";
}

const memberList = document.getElementById("memberList");

let memberData = [];

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

                <div class="memberNick">
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


    // 저장 버튼 이벤트
    document.querySelectorAll(".saveBtn").forEach(button => {

        button.addEventListener("click", () => {

            const nickname = button.dataset.key;
            const state = button
                .parentElement
                .querySelector(".stateSelect")
                .value;
            openStateModal(nickname, state);
        });
    });
}