// check.js
import {
    appVersion,
    adminName,
    specialDayPeriod
} from "../utils.js";
import {findMemberByDeviceId} from "./checkFirebase.js";

const pageStyle = document.getElementById("pageStyle");

if(specialDayPeriod()){
    pageStyle.addEventListener("load",() => {
        document.documentElement.style.visibility = "visible";
    },{
        once:true
    });

    pageStyle.href = "check할로윈.css";
}else{
    document.documentElement.style.visibility = "visible";
}

const minimumDisplayTime = 2400;

document.getElementById("version").textContent = `Ver ${appVersion}`;
document.getElementById("admin").textContent = `관리자 ${adminName}`;

function getDeviceId(){
    let deviceId = localStorage.getItem("deviceId");

    if(!deviceId){
        deviceId = crypto.randomUUID();
        localStorage.setItem("deviceId",deviceId);
    }

    sessionStorage.setItem("deviceId",deviceId);

    return deviceId;
}

function wait(ms){
    return new Promise(resolve => setTimeout(resolve,ms));
}

async function waitMinimumTime(startTime){
    const elapsed = Date.now() - startTime;
    const remaining = minimumDisplayTime - elapsed;

    if(remaining > 0){
        await wait(remaining);
    }
}

async function check(){
    const startTime = Date.now();

    try{
        const deviceId = getDeviceId();
        const member = await findMemberByDeviceId(deviceId);

        await waitMinimumTime(startTime);

        if(!member || !member.nickname){
            location.replace("login.html");
            return;
        }

        sessionStorage.setItem("nickname",member.nickname);

        if(member.admin === true){
            sessionStorage.setItem("admin","true");
        }else{
            sessionStorage.removeItem("admin");
        }

        if(member.staff === true){
            sessionStorage.setItem("staff","true");
        }else{
            sessionStorage.removeItem("staff");
        }

        location.replace("../member/member.html");
    }catch(error){
        console.error("자동 로그인 확인 실패:",error);

        await waitMinimumTime(startTime);

        location.replace("login.html");
    }
}

check();