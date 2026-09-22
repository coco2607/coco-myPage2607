// point/adpoint.js
import {applyPoint} from "./adpointFirebase.js";
import {createDropdown} from "./dropdown.js";

const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");
const pointModal = document.getElementById("pointModal");
const pointTitle = document.getElementById("pointTitle");
const pointRows = document.getElementById("pointRows");
const pointScroll = document.querySelector(".pointScroll");
const pointApplyBtn = document.getElementById("pointApplyBtn");
const pointCancelBtn = document.getElementById("pointCancelBtn");
const pointConfirmModal = document.getElementById("pointConfirmModal");
const pointConfirmList = document.getElementById("pointConfirmList");
const pointConfirmBtn = document.getElementById("pointConfirmBtn");
const pointConfirmCancelBtn = document.getElementById("pointConfirmCancelBtn");
const alertModal = document.getElementById("alertModal");
const alertMessage = document.getElementById("alertMessage");

const START_ROW = 5;

const minusPointMap = {
    "마패권 교환":5,
    "일벙권 교환":35,
    "일방권 교환":50,
    "쉴드권 교환":20,
    "폭탄권 교환":30,
    "아메리카노 교환":50,
    "닉꾸아이템 교환":30
};

const plusEventList = [
    "벙참 랭킹 보상",
    "채팅 랭킹 보상"
];

let mode = "plus";
let pointData = [];
let alertTimer = null;

plusBtn.addEventListener("click",() => {
    mode = "plus";
    openPointModal();
});

minusBtn.addEventListener("click",() => {
    mode = "minus";
    openPointModal();
});

pointCancelBtn.addEventListener("click",() => {
    hideAllDropdown();
    pointModal.classList.add("hidden");
});

pointApplyBtn.addEventListener("click",preparePoint);

pointConfirmCancelBtn.addEventListener("click",() => {
    hideAllDropdown();
    pointConfirmModal.classList.add("hidden");
    pointModal.classList.remove("hidden");
});

pointConfirmBtn.addEventListener("click",applyPointData);

function showAlert(message){
    if(alertTimer){
        clearTimeout(alertTimer);
    }

    alertMessage.textContent = message;
    alertModal.classList.remove("hidden");

    alertTimer = setTimeout(() => {
        alertModal.classList.add("hidden");
        alertTimer = null;
    },2000);
}

function openPointModal(){
    if(mode === "plus"){
        pointTitle.textContent = "포인트 적립";
        pointTitle.className = "plus";
    }else{
        pointTitle.textContent = "포인트 사용";
        pointTitle.className = "minus";
    }

    pointRows.innerHTML = "";

    for(let i = 0; i < START_ROW; i++){
        addRow();
    }

    pointModal.classList.remove("hidden");
}

function hideAllDropdown(){
    [...pointRows.children].forEach(row => {
        row.eventDropdown?.hide();
    });
}

function addRow(){
    const row = document.createElement("div");
    row.className = "pointRow";

    const nickname = document.createElement("input");
    nickname.type = "text";
    nickname.placeholder = "닉네임";

    const event = createDropdown({
        items:mode === "plus"
            ? plusEventList
            : Object.keys(minusPointMap),
        placeholder:"내용",
        onInput(value){
            updatePointByEvent(value);
        },
        onSelect(item){
            updatePointByEvent(item);
        }
    });

    const point = document.createElement("input");
    point.type = "number";
    point.placeholder = "포인트";
    point.min = 1;
    point.step = 1;

    row.nicknameInput = nickname;
    row.eventDropdown = event;
    row.pointInput = point;

    function updatePointByEvent(value){
        if(mode !== "minus"){
            return;
        }

        if(minusPointMap[value] !== undefined){
            point.value = minusPointMap[value];
            point.readOnly = true;
        }else{
            point.value = "";
            point.readOnly = false;
        }
    }

    row.appendChild(nickname);
    row.appendChild(event.element);
    row.appendChild(point);
    pointRows.appendChild(row);

    requestAnimationFrame(() => {
        if(pointRows.children.length > START_ROW){
            pointScroll.scrollTop = pointScroll.scrollHeight;
        }
    });

    nickname.addEventListener("input",() => {
        const rows = [...pointRows.children];

        if(
            rows[rows.length - 1] === row &&
            nickname.value.trim() !== ""
        ){
            addRow();
        }
    });
}

function preparePoint(){
    pointData = [];
    pointConfirmList.innerHTML = "";

    const rows = [...pointRows.children];
    let hasError = false;

    rows.forEach(row => {
        const nickname = row.nicknameInput.value.trim();
        const event = row.eventDropdown.value;
        const point = Number(row.pointInput.value);

        if(!nickname && !event && !point){
            return;
        }

        if(
            !nickname ||
            !event ||
            !Number.isFinite(point) ||
            point <= 0
        ){
            hasError = true;
            return;
        }

        pointData.push({
            nickname,
            event,
            point
        });
    });

    if(hasError){
        showAlert(
            "닉네임, 내용, 포인트\n모두 입력해주세요."
        );
        return;
    }

    if(pointData.length === 0){
        return;
    }

    pointData.forEach(item => {
        const row = document.createElement("div");
        row.className = "pointConfirmRow";
        row.innerHTML = `
            <span>${item.nickname}</span>
            <span>${item.event}</span>
            <span>${item.point}P</span>
        `;
        pointConfirmList.appendChild(row);
    });

    hideAllDropdown();
    pointModal.classList.add("hidden");
    pointConfirmModal.classList.remove("hidden");
}

async function applyPointData(){
    try{
        await applyPoint(
            mode,
            pointData
        );

        pointConfirmModal.classList.add("hidden");

        document.dispatchEvent(
            new Event("memberUpdated")
        );

        showAlert(
            mode === "plus"
                ? "포인트 적립이 완료되었습니다."
                : "포인트 사용이 완료되었습니다."
        );
    }catch(error){
        console.error("포인트 적용 실패:",error);
        pointConfirmModal.classList.add("hidden");
        showAlert(
            error.message ||
            "포인트 적용 중 오류가 발생했습니다."
        );
    }
}