// member.js
import {
    loadUser,
    loadHistory
} from "./memberFirebase.js";
import {
    appVersion,
    adminName
} from "../utils.js";

const nickname = sessionStorage.getItem("nickname");
const memberNickname = document.getElementById("memberNickname");
const pointLabel = document.getElementById("pointLabel");
const totalPoint = document.getElementById("totalPoint");
const historyList = document.getElementById("historyList");
const boardPosition = document.getElementById("boardPosition");
const contentTabs = document.querySelectorAll(".contentTab");
const tabContents = document.querySelectorAll(".tabContent");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminModal = document.getElementById("adminModal");
const adminPassword = document.getElementById("adminPassword");
const adminMessage = document.getElementById("adminMessage");
const adminCancelBtn = document.getElementById("adminCancelBtn");

let memberUser = null;

document.getElementById("version").textContent = `Ver ${appVersion}`;
document.getElementById("admin").textContent = `관리자 ${adminName}`;

if(!nickname){
    location.replace("../login/login.html");
}else{
    memberNickname.textContent = `${nickname}님`;
    checkManager();
    loadMember();
}

adminLoginBtn.addEventListener("click",openAdminLogin);
adminCancelBtn.addEventListener("click",closeAdminLogin);

function checkManager(){
    const admin = sessionStorage.getItem("admin") === "true";
    const staff = sessionStorage.getItem("staff") === "true";
    if(admin || staff){
        adminLoginBtn.classList.remove("hidden");
        return;
    }
    adminLoginBtn.classList.add("hidden");
}

function openAdminLogin(){
    adminPassword.value = "";
    adminMessage.textContent = "";
    adminModal.classList.remove("hidden");
    adminPassword.focus();
}

function closeAdminLogin(){
    adminModal.classList.add("hidden");
    adminPassword.value = "";
    adminMessage.textContent = "";
}

async function loadMember(){
    try{
        memberUser = await loadUser(nickname);
        if(memberUser){
            boardPosition.textContent = `(보드게임 현 위치 ${memberUser.last ?? 0})`;
        }else{
            boardPosition.textContent = "(보드게임 현 위치 0)";
        }
    }catch(error){
        console.error("회원정보 불러오기 실패:",error);
    }
}

contentTabs.forEach(tab => {
    tab.addEventListener("click",() => {
        changeTab(tab);
    });
});

async function changeTab(tab){
    contentTabs.forEach(item => {
        item.classList.remove("active");
    });
    tabContents.forEach(content => {
        content.classList.add("hidden");
    });
    tab.classList.add("active");
    const tabName = tab.dataset.tab;
    if(tabName === "attendance"){
        await showAttendance();
        return;
    }
    if(tabName === "point"){
        await showPointHistory();
    }
}

async function showAttendance(){
    const attendanceContent = document.getElementById("attendanceContent");
    const month = new Date().getMonth() + 1;
    attendanceContent.classList.remove("hidden");
    pointLabel.textContent = `${month}월 출석`;
    if(window.loadAttendance){
        await window.loadAttendance();
    }
}

async function showPointHistory(){
    const pointContent = document.getElementById("pointContent");
    pointContent.classList.remove("hidden");
    pointLabel.textContent = "누적포인트";
    totalPoint.textContent = `${memberUser?.totalP ?? 0}점`;
    await loadPointHistory();
}

async function loadPointHistory(){
    try{
        const history = await loadHistory(nickname);
        historyList.innerHTML = "";
        history.sort((a,b) => getHistoryTime(b) - getHistoryTime(a));
        let hasHistory = false;
        history.forEach(data => {
            const getP = Number(data.getP) || 0;
            const useP = Number(data.useP) || 0;
            if(getP === 0 && useP === 0){
                return;
            }
            const point = getP !== 0 ? getP : -useP;
            addHistory(
                getHistoryDate(data),
                data.type || "포인트",
                point
            );
            hasHistory = true;
        });
        if(!hasHistory){
            historyList.innerHTML = "<div class='historyItem'>포인트 내역이 없습니다.</div>";
        }
    }catch(error){
        console.error("포인트 내역 불러오기 실패:",error);
        historyList.innerHTML = "<div class='historyItem'>포인트 내역을 불러오지 못했습니다.</div>";
    }
}

function getHistoryTime(data){
    if(data.joinDate){
        const time = new Date(data.joinDate).getTime();
        if(!isNaN(time)){
            return time;
        }
    }
    return getPushKeyTimestamp(data.key);
}

function getHistoryDate(data){
    if(data.joinDate){
        const date = new Date(data.joinDate);
        if(!isNaN(date.getTime())){
            return data.joinDate;
        }
    }
    const timestamp = getPushKeyTimestamp(data.key);
    return timestamp > 0 ? timestamp : "";
}

function getPushKeyTimestamp(key){
    if(!key || key.length < 8){
        return 0;
    }
    const chars = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
    let timestamp = 0;
    for(let i = 0; i < 8; i++){
        const index = chars.indexOf(key.charAt(i));
        if(index === -1){
            return 0;
        }
        timestamp = timestamp * 64 + index;
    }
    return timestamp;
}

function formatDate(value){
    if(value == null || value === ""){
        return "";
    }
    const date = new Date(value);
    if(isNaN(date.getTime())){
        return typeof value === "string" ? value : "";
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2,"0");
    const day = String(date.getDate()).padStart(2,"0");
    return `${year}. ${month}. ${day}`;
}

function addHistory(date,memo,point){
    const item = document.createElement("div");
    const pointClass = point >= 0 ? "plus" : "minus";
    const sign = point >= 0 ? "+" : "-";
    const pointValue = Math.abs(point);
    item.className = "historyItem";
    item.innerHTML = `
        <div class="historyRow">
            <div class="historyDate">
                ${formatDate(date)}
            </div>
            <div class="historyMemo">
                ${memo}
            </div>
            <div class="historyPoint ${pointClass}">
                <span class="sign">${sign}</span>
                <span class="pointValue">${pointValue}점</span>
            </div>
        </div>
    `;
    historyList.appendChild(item);
}