// login.js
import {
    trim,
    appVersion,
    adminName,
    chuseokThemePeriod
} from "../utils.js";
import {
    getMember,
    saveMemberPassword,
    saveDeviceId,
    joinUser
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

const pageStyle = document.getElementById("pageStyle");

if(chuseokThemePeriod()){
    pageStyle.href = "login1.css";
}


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
    if(name.length < 2){
        showWarning("닉네임 2자를 입력하세요.");
        nickname.focus();
        return;
    }
    try{
        const member = await getMember(name);
        if(!member || !member.memberPw){
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
        const member = await getMember(loginNickname);
        if(!member || !member.memberPw || member.memberPw !== password){
            throw new Error("닉네임 또는 비밀번호가 올바르지 않습니다.");
        }
        const deviceId = getDeviceId();
        await joinUser(loginNickname);
        await completeLogin(loginNickname,deviceId,member);
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
    if(name.length < 2){
        pwSetMessage.textContent = "닉네임 2자를 입력하세요.";
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
        const member = await getMember(name);
        if(member && member.memberPw){
            pwSetMessage.textContent = "이미 비밀번호가 설정된 닉네임입니다.";
            pwSetNickname.focus();
            return;
        }
        const deviceId = getDeviceId();
        await saveMemberPassword(name,password);
        await joinUser(name);
        await completeLogin(name,deviceId,member);
    }catch(error){
        pwSetMessage.textContent = error.message;
    }
}

function getDeviceId(){
    let deviceId = localStorage.getItem("deviceId");
    if(!deviceId){
        deviceId = createId();
        localStorage.setItem("deviceId",deviceId);
    }
    return deviceId;
}

async function completeLogin(name,deviceId,member){
    await saveDeviceId(deviceId,name);
    sessionStorage.setItem("nickname",name);
    sessionStorage.setItem("deviceId",deviceId);

    if(member?.admin === true){
        sessionStorage.setItem("admin","true");
    }else{
        sessionStorage.removeItem("admin");
    }

    if(member?.staff === true){
        sessionStorage.setItem("staff","true");
    }else{
        sessionStorage.removeItem("staff");
    }

    loginModal.classList.add("hidden");
    pwSetModal.classList.add("hidden");
    location.replace("../member/member.html");
}