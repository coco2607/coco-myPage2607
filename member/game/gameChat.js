// gameChat.js
import {
    saveGameChat,
    listenGameChat
} from "./gameFirebase.js";

import {trim} from "../../utils.js";

let stopChat = null;

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

    if(stopChat){
        stopChat();
        stopChat = null;
    }

    stopChat = listenGameChat(gameKey,data => {
        addGameChat(
            data.nickname,
            data.comment,
            data.time
        );
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

function addGameChat(nickname,comment,time){
    const list = document.getElementById("gameChatList");

    if(!list){
        return;
    }

    const nearBottom = isNearBottom(list);

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

    if(nearBottom){
        list.scrollTop = list.scrollHeight;
    }
}

function isNearBottom(list){
    return list.scrollHeight - list.scrollTop - list.clientHeight <= 60;
}

function resizeChatInput(){
    const input = document.getElementById("gameChatInput");

    if(!input){
        return;
    }

    input.style.height = "auto";
    input.style.height = `${Math.max(input.scrollHeight,40)}px`;
}

function formatGameTime(value){
    if(!value){
        return "";
    }

    const date = new Date(Number(value));

    if(isNaN(date.getTime())){
        return "";
    }

    return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
}

export function stopGameChat(){
    if(stopChat){
        stopChat();
        stopChat = null;
    }
}