// login.js

import { login } from "./loginFirebase.js";
import { trim } from "../utils.js";

// 요소 가져오기
const nickname = document.getElementById("nickname");
const enterBtn = document.getElementById("enterBtn");
const memberModal = document.getElementById("memberModal");
const memberPassword = document.getElementById("memberPassword");
const memberOkBtn = document.getElementById("memberOkBtn");
const memberCancelBtn = document.getElementById("memberCancelBtn");
const loginMessage = document.getElementById("loginMessage");
const alertModal = document.getElementById("alertModal");
const alertCloseBtn = document.getElementById("alertCloseBtn");


// 이벤트
enterBtn.addEventListener("click", openLoginModal);
memberCancelBtn.addEventListener("click", closeLoginModal);
memberOkBtn.addEventListener("click", checkPassword);

alertCloseBtn.addEventListener("click", () => {
    alertModal.classList.add("hidden");
});

memberPassword.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        checkPassword();
    }
});


//경고메시지
function alertMessage(message) {

    document.getElementById("alertMessage").textContent = message;
    alertModal.classList.remove("hidden");

}

// 입장하기
function openLoginModal() {

    const name = trim(nickname.value);

    if (name === "") {
        alertMessage("닉네임 입력하세요.");
        nickname.focus();
        return;
    }

    // 한글 2자만 허용
    if (!/^[가-힣]{2}$/.test(name)) {
        alertMessage("닉네임 2자를 입력하세요.");
        nickname.focus();
        nickname.select();
        return;
    }

    loginMessage.textContent = "";
    memberPassword.value = "";
    memberModal.classList.remove("hidden");
    memberPassword.focus();
}


// 로그인 모달 닫기
function closeLoginModal() {
    memberModal.classList.add("hidden");
}


// 비밀번호 확인
async function checkPassword() {

    const password = trim(memberPassword.value);

    if (password === "") {
        loginMessage.textContent = "비밀번호를 입력해주세요.";
        memberPassword.focus();
        return;
    }

    try {
        await login(trim(nickname.value), password);

        sessionStorage.setItem("nickname", trim(nickname.value));
        memberModal.classList.add("hidden");
        location.href = "../member/member.html";

    } catch (error) {
        loginMessage.textContent = error.message;
        memberPassword.select();
    }
}