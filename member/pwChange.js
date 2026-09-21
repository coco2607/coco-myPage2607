// pwChange.js
import {
    loadUser,
    updateMemberPassword
} from "./memberFirebase.js";
import {trim} from "../utils.js";

const nickname = sessionStorage.getItem("nickname");
const pwModal = document.getElementById("pwModal");
const currentPw = document.getElementById("currentPw");
const newPw = document.getElementById("newPw");
const newPwCheck = document.getElementById("newPwCheck");
const pwError = document.getElementById("pwError");
const pwOk = document.getElementById("pwOk");
const pwCancel = document.getElementById("pwCancel");
const completeModal = document.getElementById("completeModal");
const pwChangeBtn = document.getElementById("changePasswordBtn");

pwChangeBtn.addEventListener("click",openPwModal);
pwCancel.addEventListener("click",closePwModal);
pwOk.addEventListener("click",changePassword);

function resetPwForm(){
    currentPw.value = "";
    newPw.value = "";
    newPwCheck.value = "";
    pwError.textContent = "";
    currentPw.classList.remove("inputError");
    newPw.classList.remove("inputError");
    newPwCheck.classList.remove("inputError");
}

function openPwModal(){
    resetPwForm();
    pwModal.classList.remove("hidden");
    currentPw.focus();
}

function closePwModal(){
    pwModal.classList.add("hidden");
    resetPwForm();
}

function showError(input,message){
    input.classList.add("inputError");
    pwError.textContent = message;
    input.focus();
}

async function changePassword(){
    const currentPassword = trim(currentPw.value);
    const newPassword = trim(newPw.value);
    const newPasswordCheck = trim(newPwCheck.value);

    pwError.textContent = "";
    currentPw.classList.remove("inputError");
    newPw.classList.remove("inputError");
    newPwCheck.classList.remove("inputError");

    if(currentPassword === ""){
        showError(currentPw,"현재 비밀번호를 입력하세요.");
        return;
    }

    if(newPassword === ""){
        showError(newPw,"새 비밀번호를 입력하세요.");
        return;
    }

    if(newPasswordCheck === ""){
        showError(newPwCheck,"새 비밀번호 확인을 입력하세요.");
        return;
    }

    try{
        pwOk.disabled = true;

        const user = await loadUser(nickname);

        if(!user){
            pwError.textContent = "회원정보를 찾을 수 없습니다.";
            return;
        }

        if(currentPassword !== user.memberPw){
            showError(currentPw,"현재 비밀번호가 올바르지 않습니다.");
            return;
        }

        if(newPassword !== newPasswordCheck){
            newPw.classList.add("inputError");
            showError(newPwCheck,"새 비밀번호가 서로 일치하지 않습니다.");
            return;
        }

        if(newPassword === user.memberPw){
            showError(newPw,"현재 비밀번호와 다른 비밀번호를 입력하세요.");
            return;
        }

        await updateMemberPassword(nickname,newPassword);
        pwModal.classList.add("hidden");
        resetPwForm();
        showCompleteModal();
    }catch(error){
        console.error("비밀번호 변경 오류:",error);
        pwError.textContent = "비밀번호 변경 중 오류가 발생했습니다.";
    }finally{
        pwOk.disabled = false;
    }
}

function showCompleteModal(){
    completeModal.classList.remove("hidden");

    setTimeout(() => {
        completeModal.classList.add("hidden");
    },2000);
}