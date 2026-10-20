// gameChat.js
import {
    saveGameChat,
    listenGameChat
} from "./gameFirebase.js";

import {trim} from "../../utils.js";

let stopChat = null;
let chatData = [];

export function initGameChat(gameKey,nickname){
    const chatInput = document.getElementById("gameChatInput");
    const chatBtn = document.getElementById("gameChatBtn");

    if(!chatInput || !chatBtn){
        return;
    }

    chatBtn.addEventListener("click",() => {
        saveChat(gameKey,nickname);
    });

    chatInput.addEventListener("input",resizeChatInput);

    chatInput.addEventListener("keydown",event => {
        if(event.key === "Enter"){
            event.preventDefault();
            saveChat(gameKey,nickname);
        }
    });

    startGameChat(gameKey);
}

export function startGameChat(gameKey){
    const chatList = document.getElementById("gameChatList");

    if(!chatList){
        return;
    }

    chatList.innerHTML = "";
    chatData = [];

    if(stopChat){
        stopChat();
        stopChat = null;
    }

    stopChat = listenGameChat(gameKey,data => {
        chatData.push(data);
        renderGameChat();
    });
}

async function saveChat(gameKey,nickname){
    const input = document.getElementById("gameChatInput");
    const button = document.getElementById("gameChatBtn");

    if(!input || !button){
        return;
    }

    const comment = trim(input.value);

    if(comment === ""){
        input.focus();
        return;
    }

    button.disabled = true;

    try{
        await saveGameChat(nickname,gameKey,comment);
        input.value = "";
        input.style.height = "40px";
        input.focus();
    }catch(error){
        console.error("게임 채팅 등록 오류:",error);
    }finally{
        button.disabled = false;
    }
}

function renderGameChat(){
    const list = document.getElementById("gameChatList");

    if(!list){
        return;
    }

    list.innerHTML = "";

    const sorted = [...chatData].sort((a,b) => {
        return Number(b.time) - Number(a.time);
    });

    let lastDate = "";

    sorted.forEach(data => {
        const dateKey = formatGameDateKey(data.time);

        if(dateKey !== lastDate){
            addGameChatDate(list,data.time);
            lastDate = dateKey;
        }

        addGameChat(
            list,
            data.nickname,
            data.comment,
            data.time
        );
    });

    list.scrollTop = 0;
}

function addGameChatDate(list,time){
    const dateElement = document.createElement("div");

    dateElement.className = "gameChatDate";
    dateElement.textContent = formatGameDate(time);

    list.appendChild(dateElement);
}

function addGameChat(list,nickname,comment,time){
    const item = document.createElement("div");
    const nicknameElement = document.createElement("div");
    const commentElement = document.createElement("div");
    const timeElement = document.createElement("div");

    item.className = "gameChatItem";
    nicknameElement.className = "gameChatNickname";
    commentElement.className = "gameChatComment";
    timeElement.className = "gameChatTime";

    nicknameElement.textContent = nickname;
    commentElement.textContent = comment;
    timeElement.textContent = formatGameTime(time);

    item.appendChild(nicknameElement);
    item.appendChild(commentElement);
    item.appendChild(timeElement);

    list.appendChild(item);
}

function resizeChatInput(){
    const input = document.getElementById("gameChatInput");

    if(!input){
        return;
    }

    input.style.height = "auto";
    input.style.height = `${Math.max(input.scrollHeight,40)}px`;
}

function formatGameDateKey(value){
    const date = new Date(Number(value));

    if(isNaN(date.getTime())){
        return "";
    }

    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatGameDate(value){
    const date = new Date(Number(value));

    if(isNaN(date.getTime())){
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2,"0");
    const day = String(date.getDate()).padStart(2,"0");

    return `${year}년 ${month}월 ${day}일`;
}

function formatGameTime(value){
    const date = new Date(Number(value));

    if(isNaN(date.getTime())){
        return "";
    }

    const hour = String(date.getHours()).padStart(2,"0");
    const minute = String(date.getMinutes()).padStart(2,"0");

    return `${hour}:${minute}`;
}

export function stopGameChat(){
    if(stopChat){
        stopChat();
        stopChat = null;
    }

    chatData = [];
}