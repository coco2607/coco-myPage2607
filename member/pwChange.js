// pwChange.js

import {
    loadUser,
    updateMemberPassword
} from "./memberFirebase.js";


// 로그인 닉네임
const nickname = sessionStorage.getItem("nickname");


// 요소
const pwModal = document.getElementById("pwModal");

const currentPw = document.getElementById("currentPw");
const newPw = document.getElementById("newPw");
const newPwCheck = document.getElementById("newPwCheck");
const pwError = document.getElementById("pwError");

const pwOk = document.getElementById("pwOk");
const pwCancel = document.getElementById("pwCancel");

const completeModal = document.getElementById("completeModal");
const completeOk = document.getElementById("completeOk");


// 비밀번호 변경 버튼
const pwChangeBtn = document.getElementById("changePasswordBtn");

if (pwChangeBtn) {
    pwChangeBtn.addEventListener("click", openPwModal);
}


// 모달 열기
function openPwModal() {

    currentPw.value = "";
    newPw.value = "";
    newPwCheck.value = "";

    pwError.textContent = "";

    currentPw.classList.remove("inputError");
    newPw.classList.remove("inputError");
    newPwCheck.classList.remove("inputError");

    pwModal.classList.remove("hidden");

    currentPw.focus();
}


// 첫번째 취소
pwCancel.addEventListener("click", () => {
    pwModal.classList.add("hidden");
});


// 첫번째 확인
pwOk.addEventListener("click", async () => {

    const user = await loadUser(nickname);

    // 이전 에러 초기화
    pwError.textContent = "";
    currentPw.classList.remove("inputError");
    newPw.classList.remove("inputError");

    if (!user) {
        pwError.textContent = "회원정보를 찾을 수 없습니다.";
        return;
    }

    // 현재 비밀번호 확인
    if (currentPw.value !== user.memberPw) {
        currentPw.classList.add("inputError");
        pwError.textContent = "현재 비밀번호가 올바르지 않습니다.";
        pwError.style.display = "block";
        currentPw.focus();

        return;
    }

    // 새 비밀번호 입력 여부
    if (newPw.value.trim() === "") {
        newPw.classList.add("inputError");
        pwError.textContent = "새 비밀번호를 입력하세요.";
        pwError.style.display = "block";
        newPw.focus();

        return;
    }

    // 새 비밀번호 확인 입력 여부
    if (newPwCheck.value.trim() === "") {
        newPwCheck.classList.add("inputError");
        pwError.textContent = "새 비밀번호 확인을 입력하세요.";
        pwError.style.display = "block";
        newPwCheck.focus();

        return;
    }

    // 비밀번호 4자 이상 입력
    if (newPw.value.length < 4) {
        newPw.classList.add("inputError");
        pwError.textContent = "비밀번호는 4자 이상 입력하세요.";
        pwError.style.display = "block";
        newPw.focus();

        return;
    }

    // 새 비밀번호 일치 여부
    if (newPw.value !== newPwCheck.value) {
        newPw.classList.add("inputError");
        newPwCheck.classList.add("inputError");

        pwError.textContent = "새 비밀번호가 서로 일치하지 않습니다.";
        pwError.style.display = "block";
        newPwCheck.focus();

        return;
    }

    // 현재 비밀번호와 동일한지 확인
    if (newPw.value === user.memberPw) {
        newPw.classList.add("inputError");
        pwError.textContent = "현재 비밀번호와 다른 비밀번호를 입력하세요.";
        pwError.style.display = "block";
        newPw.focus();

        return;
    }

    // Firebase 저장
    await updateMemberPassword(
        nickname,
        newPw.value
    );

    // 비밀번호 변경창 닫기
    pwModal.classList.add("hidden");

    // 완료창 열기
    completeModal.classList.remove("hidden");
});


completeOk.addEventListener("click", () => {

    completeModal.classList.add("hidden");

    currentPw.value = "";
    newPw.value = "";

    pwError.textContent = "";

    currentPw.classList.remove("inputError");
    newPw.classList.remove("inputError");

    currentPw.focus();
});
