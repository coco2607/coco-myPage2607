// login.js
import {
    trim,
    appVersion,
    adminName
} from "../utils.js";
import {
    login,
    saveDeviceId,
    getMemberState,
    setMemberPassword
} from "./loginFirebase.js";

const nickname = document.getElementById("nickname");
const enterBtn = document.getElementById("enterBtn");
const loginModal = document.getElementById("loginModal");
const memberPassword = document.getElementById("memberPassword");
const memberOkBtn = document.getElementById("memberOkBtn");
const memberCancelBtn = document.getElementById("memberCancelBtn");
const loginMessage = document.getElementById("loginMessage");
const pwSetModal = document.getElementById("pwSetModal");
const pwSetNickname = document.getElementById("pwSetNickname");
const newPw = document.getElementById("newPw");
const newPwCheck = document.getElementById("newPwCheck");
const pwSetMessage = document.getElementById("pwSetMessage");
const pwSetOkBtn = document.getElementById("pwSetOkBtn");
const pwSetCancelBtn = document.getElementById("pwSetCancelBtn");
const warningModal = document.getElementById("warningModal");
const warningText = document.getElementById("warningText");
const warningOk = document.getElementById("warningOk");

let loginNickname = "";

document.getElementById("version").textContent = `Ver ${appVersion}`;
document.getElementById("admin").textContent = `관리자 ${adminName}`;

enterBtn.addEventListener("click",checkMember);
memberCancelBtn.addEventListener("click",closeLoginModal);
memberOkBtn.addEventListener("click",checkPassword);
pwSetCancelBtn.addEventListener("click",closePwSetModal);
pwSetOkBtn.addEventListener("click",setPassword);

warningOk.addEventListener("click",() => {
    warningModal.classList.add("hidden");
});

function showWarning(message){
    warningText.textContent = message;
    warningModal.classList.remove("hidden");
}

async function checkMember(){
    const name = trim(nickname.value);

    if(name === ""){
        showWarning("닉네임을 입력하세요.");
        nickname.focus();
        return;
    }

    try{
        const state = await getMemberState(name);

        if(state === "NO_PASSWORD"){
            openPwSetModal(name);
            return;
        }

        openLoginModal(name);
    }catch(error){
        showWarning(error.message);
    }
}

function openLoginModal(name){
    loginNickname = name;
    memberPassword.value = "";
    loginMessage.textContent = "";
    loginModal.classList.remove("hidden");
    memberPassword.focus();
}

function closeLoginModal(){
    loginModal.classList.add("hidden");
}

function openPwSetModal(name){
    pwSetNickname.value = name;
    newPw.value = "";
    newPwCheck.value = "";
    pwSetMessage.textContent = "";
    pwSetModal.classList.remove("hidden");
    newPw.focus();
}

function closePwSetModal(){
    pwSetModal.classList.add("hidden");
}

async function checkPassword(){
    const password = trim(memberPassword.value);

    if(password === ""){
        loginMessage.textContent = "비밀번호를 입력해주세요.";
        memberPassword.focus();
        return;
    }

    try{
        const deviceId = getDeviceId();
        await login(loginNickname,password);
        await completeLogin(loginNickname,deviceId);
    }catch(error){
        loginMessage.textContent = error.message;
        memberPassword.select();
    }
}

async function setPassword(){
    const name = trim(pwSetNickname.value);
    const password = trim(newPw.value);
    const passwordCheck = trim(newPwCheck.value);

    pwSetMessage.textContent = "";

    if(name === ""){
        pwSetMessage.textContent = "닉네임을 입력하세요.";
        pwSetNickname.focus();
        return;
    }

    if(password === ""){
        pwSetMessage.textContent = "새 비밀번호를 입력하세요.";
        newPw.focus();
        return;
    }

    if(passwordCheck === ""){
        pwSetMessage.textContent = "새 비밀번호 확인을 입력하세요.";
        newPwCheck.focus();
        return;
    }

    if(password !== passwordCheck){
        pwSetMessage.textContent = "새 비밀번호가 서로 일치하지 않습니다.";
        newPwCheck.focus();
        return;
    }

    try{
        const state = await getMemberState(name);

        if(state === "PASSWORD"){
            pwSetMessage.textContent = "이미 비밀번호가 설정된 닉네임입니다.";
            pwSetNickname.focus();
            return;
        }

        const deviceId = getDeviceId();
        await setMemberPassword(name,password);
        await login(name,password);
        await completeLogin(name,deviceId);
    }catch(error){
        pwSetMessage.textContent = error.message;
    }
}

function getDeviceId(){
    const deviceId = sessionStorage.getItem("deviceId");

    if(!deviceId){
        throw new Error("디바이스 정보를 확인할 수 없습니다.");
    }

    return deviceId;
}

async function completeLogin(name,deviceId){
    await saveDeviceId(deviceId,name);
    sessionStorage.setItem("nickname",name);
    loginModal.classList.add("hidden");
    pwSetModal.classList.add("hidden");
    location.replace("../member/member.html");
}