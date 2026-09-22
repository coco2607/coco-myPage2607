// adminHistory.js
import {loadHistory} from "./adminFirebase.js";

const historyModal = document.getElementById("historyModal");
const historyTitle = document.getElementById("historyTitle");
const historyList = document.getElementById("historyList");
const historyCloseBtn = document.getElementById("historyCloseBtn");

historyCloseBtn.addEventListener("click",() => {
    historyModal.classList.add("hidden");
});

export async function openHistory(nickname){
    try{
        const history = await loadHistory(nickname);
        showHistory(nickname,history);
    }catch(error){
        console.error("히스토리 불러오기 실패:",error);
        showHistory(nickname,[]);
    }
}

function showHistory(nickname,list){
    historyTitle.textContent = `${nickname} 포인트 상세내역`;
    historyList.innerHTML = "";
    const pointHistory = list.filter(data => {
        const getP = Number(data.getP) || 0;
        const useP = Number(data.useP) || 0;
        return getP !== 0 || useP !== 0;
    });
    if(pointHistory.length === 0){
        historyList.innerHTML = `
            <div class="historyItem">
                포인트 내역이 없습니다.
            </div>
        `;
        historyModal.classList.remove("hidden");
        return;
    }
    pointHistory
        .sort((a,b) => getHistoryTime(b) - getHistoryTime(a))
        .forEach(data => {
            const getP = Number(data.getP) || 0;
            const useP = Number(data.useP) || 0;
            const point = getP !== 0 ? getP : -useP;
            addHistory(
                getHistoryDate(data),
                data.type || "포인트",
                point
            );
        });
    historyModal.classList.remove("hidden");
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
                <span class="pointValue">${pointValue}P</span>
            </div>
        </div>
    `;
    historyList.appendChild(item);
}