// check.js
import {
    appVersion,
    adminName} from "../utils.js";
import {findMemberByDeviceId} from "./checkFirebase.js";

const checkDots = document.getElementById("checkDots");

document.getElementById("version").textContent = `Ver ${appVersion}`;
document.getElementById("admin").textContent = `관리자 ${adminName}`;

let dotCount = 0;
let firstCycleDone = false;

setInterval(() => {
    dotCount++;

    if(dotCount > 3){
        dotCount = 0;
        firstCycleDone = true;
    }

    checkDots.textContent = ".".repeat(dotCount);
},700);

function getDeviceId(){
    let deviceId = localStorage.getItem("deviceId");

    if(!deviceId){
        deviceId = crypto.randomUUID();
        localStorage.setItem("deviceId",deviceId);
    }

    sessionStorage.setItem("deviceId",deviceId);
    return deviceId;
}

function waitFirstCycle(){
    return new Promise(resolve => {
        const timer = setInterval(() => {
            if(firstCycleDone){
                clearInterval(timer);
                resolve();
            }
        },50);
    });
}

async function check(){
    try{
        const deviceId = getDeviceId();
        const member = await findMemberByDeviceId(deviceId);

        await waitFirstCycle();

        if(!member){
            location.replace("login.html");
            return;
        }

        sessionStorage.setItem("nickname",member.nickname);
        location.replace("../member/member.html");
    }catch(error){
        console.error("자동 로그인 확인 실패:",error);
        await waitFirstCycle();
        location.replace("login.html");
    }
}

check();