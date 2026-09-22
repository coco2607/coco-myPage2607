// staff.js

import {loadMembers} from "./adminFirebase.js";
import {openStateSelect} from "./mstate/mstate.js";
import "./point/adpoint.js";
import {
    appVersion,
    adminName
} from "../utils.js";

const memberList = document.getElementById("memberList");
const memberCount = document.getElementById("memberCount");
const version = document.getElementById("version");
const admin = document.getElementById("admin");

const managerRole = sessionStorage.getItem("managerRole");

if(managerRole !== "staff"){
    location.replace("../login/login.html");
}

version.textContent = `Ver ${appVersion}`;
admin.textContent = `운영자 ${adminName}`;

init();

document.addEventListener("memberUpdated",() => {
    init();
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
        const nickname = member.nickname;
        const point = Number(member.point) || 0;
        const state = member.state || "활동";
        const lastUpdate = formatLastUpdate(
            member.lastUpdate
        );
        const returnDate = formatReturnDate(
            member.returnDate
        );

        memberList.innerHTML += `
            <div class="memberItem">
                <div
                    class="memberNick"
                    data-key="${nickname}">
                    ${nickname}
                    <span class="memberPoint">
                        (${point})
                    </span>
                </div>

                <div class="memberDate">
                    ${lastUpdate}
                </div>

                <button
                    class="stateSelect ${state === "외출" ? "outing" : ""}"
                    data-key="${nickname}"
                    data-state="${state}">
                    ${state}
                </button>

                <div class="memberReturnDate">
                    ${returnDate}
                </div>

                <button
                    class="memberDeleteBtn"
                    data-key="${nickname}">
                    삭제
                </button>
            </div>
        `;
    });

    bindMemberEvents();
}

function bindMemberEvents(){
    document.querySelectorAll(".stateSelect").forEach(button => {
        button.addEventListener("click",() => {
            const nickname = button.dataset.key;
            const state = button.dataset.state;

            openStateSelect(
                nickname,
                state
            );
        });
    });
}

function formatLastUpdate(value){
    const timestamp = Number(value);

    if(
        !Number.isFinite(timestamp) ||
        timestamp <= 0
    ){
        return "";
    }

    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2,"0");
    const day = String(
        date.getDate()
    ).padStart(2,"0");

    return `${year}.${month}.${day}`;
}

function formatReturnDate(value){
    if(!value){
        return "";
    }

    if(
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ){
        return value.replaceAll("-",".");
    }

    const date = new Date(value);

    if(Number.isNaN(date.getTime())){
        return "";
    }

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2,"0");
    const day = String(
        date.getDate()
    ).padStart(2,"0");

    return `${year}.${month}.${day}`;
}