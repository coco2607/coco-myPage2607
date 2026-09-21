// attend.js
import {
    loadTodayAttendance,
    saveTodayAttendance,
    loadMonthlyAttendance,
    rewardAttendancePoint
} from "./attendFirebase.js";
import {showAttendanceCard} from "./attendCard.js";
import {koDate,trim} from "../utils.js";

const nickname = sessionStorage.getItem("nickname");
const attendanceDate = document.getElementById("attendanceDate");
const attendanceInput = document.getElementById("attendanceInput");
const attendanceBtn = document.getElementById("attendanceBtn");
const attendanceList = document.getElementById("attendanceList");
const pointLabel = document.getElementById("pointLabel");
const totalPoint = document.getElementById("totalPoint");
const attendanceRewardModal = document.getElementById("attendanceRewardModal");
const attendanceRewardPoint = document.getElementById("attendanceRewardPoint");
const attendanceRewardOk = document.getElementById("attendanceRewardOk");

loadAttendance();

attendanceBtn.addEventListener("click",saveAttendance);

attendanceInput.addEventListener("input",resizeAttendanceInput);

attendanceInput.addEventListener("keydown",event => {
    if(event.key === "Enter"){
        event.preventDefault();
        saveAttendance();
    }
});

attendanceRewardOk.addEventListener("click",() => {
    attendanceRewardModal.classList.add("hidden");
});

function resizeAttendanceInput(){
    attendanceInput.style.height = "auto";
    attendanceInput.style.height = `${Math.max(attendanceInput.scrollHeight,40)}px`;
}

async function loadAttendance(){
    try{
        const date = koDate();
        const monthKey = date.substring(0,7);
        const month = Number(date.substring(5,7));

        attendanceDate.textContent = `[${date}]`;

        const attendanceCount = await loadMonthlyAttendance(nickname,monthKey);
        pointLabel.textContent = `${month}월 출석`;
        totalPoint.textContent = `${attendanceCount}회`;

        const rewardPoint = await rewardAttendancePoint(
            nickname,
            monthKey,
            attendanceCount,
            date
        );

        if(rewardPoint > 0){
            showAttendanceRewardPopup(rewardPoint);
        }

        const list = await loadTodayAttendance(date);
        attendanceList.innerHTML = "";

        if(list.length === 0){
            attendanceList.innerHTML = "<div class='attendanceEmpty'>오늘 출석한 회원이 없습니다.</div>";
            return;
        }

        list.sort((a,b) => Number(b.time || 0) - Number(a.time || 0));

        list.forEach(data => {
            addAttendance(data.nickname,data.comment,data.time);
        });
    }catch(error){
        console.error("출석 정보 로딩 오류:",error);
    }
}

async function saveAttendance(){
    const comment = trim(attendanceInput.value);

    if(comment === ""){
        attendanceInput.focus();
        return;
    }

    attendanceBtn.disabled = true;

    try{
        const date = koDate();
        const result = await saveTodayAttendance(nickname,date,comment);

        attendanceInput.value = "";
        attendanceInput.style.height = "40px";

        if(result?.firstAttendance){
            await wait(500);
            await showAttendanceCard(nickname,date);
        }

        await loadAttendance();
    }catch(error){
        console.error("출석 등록 오류:",error);
    }finally{
        attendanceBtn.disabled = false;
    }
}

function showAttendanceRewardPopup(point){
    attendanceRewardPoint.textContent = `+${point}P`;
    attendanceRewardModal.classList.remove("hidden");
}

function addAttendance(nickname,comment,time){
    const item = document.createElement("div");
    item.className = "attendanceItem";
    item.innerHTML = `
        <div class="attendanceNickname">${nickname}</div>
        <div class="attendanceComment">${comment}</div>
        <div class="attendanceTime">${formatAttendanceTime(time)}</div>
    `;
    attendanceList.appendChild(item);
}

function formatAttendanceTime(value){
    if(!value){
        return "";
    }

    const date = new Date(Number(value));

    if(isNaN(date.getTime())){
        return "";
    }

    return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
}

function wait(ms){
    return new Promise(resolve => setTimeout(resolve,ms));
}

window.loadAttendance = loadAttendance;