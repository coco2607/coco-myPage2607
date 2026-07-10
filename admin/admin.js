// admin.js

import {
    loadUsers
} from "./adminFirebase.js";

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
                    class="stateSelect"
                    data-key="${user.nickname}">

                    <option value="활동"
                        ${user.state === "활동" ? "selected" : ""}>
                        활동
                    </option>

                    <option value="외출"
                        ${user.state === "외출" ? "selected" : ""}>
                        외출
                    </option>

                    <option value="탈퇴"
                        ${user.state === "탈퇴" ? "selected" : ""}>
                        탈퇴
                    </option>

                    <option value="강퇴"
                        ${user.state === "강퇴" ? "selected" : ""}>
                        강퇴
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

}