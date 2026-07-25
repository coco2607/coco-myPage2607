// staff.js

import {loadUsers} from "../admin/adminFirebase.js";
import { openStateModal } from "../mstate/mstate.js";
import "../point/adpoint.js";

// 운영진 로그인 확인
const isStaff = sessionStorage.getItem("isStaff");

if (isStaff !== "true") {
    location.href = "../login/login.html";
}

const memberList = document.getElementById("memberList");

const stateSelectModal = document.getElementById("stateSelectModal");
const stateSelectSave = document.getElementById("stateSelectSave");
const stateSelectCancel = document.getElementById("stateSelectCancel");

let currentStateButton = null;

let selectedNickname = "";
let selectedState = "";

let memberData = [];

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

                <div class="memberNick">
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

}

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

document.querySelectorAll(".stateChoice").forEach(radio => {

    radio.addEventListener("change", () => {

        if (radio.checked) {
            selectedState = radio.dataset.state;
        }

    });

});
