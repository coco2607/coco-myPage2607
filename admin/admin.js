// admin.js
import {loadMembers} from "./adminFirebase.js";
import {openHistory} from "./adminHistory.js";
import {setNicknameTarget} from "./changenm.js";
import {openStateSelect} from "./mstate/mstate.js";
import "./point/adpoint.js";
import {
    appVersion,
    adminName
} from "../utils.js";

const managerRole = sessionStorage.getItem("managerRole");

if(managerRole !== "admin"){
    location.replace("../login/login.html");
}

const memberList = document.getElementById("memberList");
const memberCount = document.getElementById("memberCount");
const version = document.getElementById("version");
const admin = document.getElementById("admin");

if(version){
    version.textContent = `Ver ${appVersion}`;
}

if(admin){
    admin.textContent = `관리자 ${adminName}`;
}

init();

document.addEventListener("memberUpdated",async () => {
    await init();
});

async function init(){
    try{
        const members = await loadMembers();
        render(members);
    }catch(error){
        console.error("회원정보 불러오기 실패:",error);
        render([]);
    }
}

function render(list){
    memberCount.textContent = `(${list.length}명)`;
    memberList.innerHTML = "";

    if(list.length === 0){
        memberList.innerHTML = `
            <div class="memberItem">
                회원이 없습니다.
            </div>
        `;
        return;
    }

    list.forEach(member => {
        memberList.innerHTML += `
            <div class="memberItem">
                <div
                    class="memberNick"
                    data-key="${member.nickname}">
                    ${member.nickname}
                </div>

                <div class="memberPoint">
                    ${Number(member.point) || 0}P
                </div>

                <div class="memberDate">
                    ${formatLastUpdate(member.lastUpdate)}
                </div>

                <button
                    class="stateSelect ${member.state === "외출" ? "outing" : ""}"
                    data-key="${member.nickname}">
                    ${member.state || "활동"}
                </button>
            </div>
        `;
    });

    document.querySelectorAll(".memberNick").forEach(nick => {
        nick.addEventListener("click",async () => {
            const nickname = nick.dataset.key;
            setNicknameTarget(nickname);
            await openHistory(nickname);
        });
    });

    document.querySelectorAll(".stateSelect").forEach(button => {
        button.addEventListener("click",() => {
            openStateSelect(
                button.dataset.key,
                button.textContent.trim()
            );
        });
    });
}

function formatLastUpdate(value){
    const timestamp = Number(value);

    if(!Number.isFinite(timestamp) || timestamp <= 0){
        return "";
    }

    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2,"0");
    const day = String(date.getDate()).padStart(2,"0");

    return `${year}.${month}.${day}`;
}