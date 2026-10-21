
/* mobile/mobile.js */
import {
    watchMobileList,
    loadMobileMail,
    sendMobile,
    acceptMobile,
    rejectMobile,
    confirmMobile
} from "./mobileFirebase.js";

import {
    initMobileUi,
    updateMobileNew,
    renderMobileList
} from "./mobileUi.js";

import {
    initMobilePopup,
    openMobileRequest,
    openMobileReceive,
    openMobileResult
} from "./mobilePopup.js";

const nickname = sessionStorage.getItem("nickname");
const mobileUseBtn = document.getElementById("mobileUseBtn");
const mobileContent = document.getElementById("mobileContent");

let mobileMails = [];
let popupOpen = false;
let visibleId = "";

const postponed = new Set();

if(nickname){
    initMobile();
}

function initMobile(){
    initMobileUi();

    initMobilePopup({
        onSend:handleSend,
        onAccept:handleAccept,
        onReject:handleReject,
        onLater:id => {
            postponed.add(id);
            finishPopup();
        },
        onReplyClosed:finishPopup
    });

    mobileUseBtn.addEventListener(
        "click",
        openMobileRequest
    );

    document.addEventListener("showMobile",() => {
        postponed.clear();
        showNextMail();
    });

    watchMobileList(list => {
        renderMobileList(list);
    });

    loadMobileMail(nickname,mails => {
        mobileMails = mails;

        updateMobileNew(mails.length > 0);

        if(!mobileContent.classList.contains("hidden")){
            showNextMail();
        }
    });
}

function showNextMail(){
    if(popupOpen){
        return;
    }

    if(mobileContent.classList.contains("hidden")){
        return;
    }

    const mail = mobileMails.find(item => {
        return !postponed.has(item.id);
    });

    if(!mail){
        return;
    }

    popupOpen = true;
    visibleId = mail.id;

    if(mail.type === "receive"){
        openMobileReceive(
            mail.id,
            mail.sender
        );

        return;
    }

    if(mail.type === "result"){
        const accepted = mail.exchange === true;

        openMobileResult({
            title:"연락처 교환 결과",
            message:accepted
                ? `${mail.receiver}님께서 연락처 교환을 수락하셨습니다.`
                : `${mail.receiver}님께서 연락처 교환을 거절하셨습니다.`,
            phone:accepted
                ? mail.receiverPhone
                : "",
            onConfirm:async () => {
                await confirmMobile(
                    nickname,
                    mail.id
                );

                removeMail(mail.id);
            },
            onClosed:finishPopup
        });
    }
}

function finishPopup(){
    popupOpen = false;
    visibleId = "";

    queueMicrotask(() => {
        showNextMail();
    });
}

function removeMail(id){
    mobileMails = mobileMails.filter(item => {
        return item.id !== id;
    });

    postponed.delete(id);

    updateMobileNew(mobileMails.length > 0);
}

async function handleSend({
    phone,
    receiver
}){
    if(receiver === nickname){
        throw new Error(
            "본인에게는 사용할 수 없습니다."
        );
    }

    await sendMobile({
        sender:nickname,
        receiver,
        senderPhone:phone
    });

    document.dispatchEvent(
        new Event("memberUpdated")
    );
}

async function handleAccept(id,phone){
    const result = await acceptMobile({
        id,
        receiver:nickname,
        receiverPhone:phone
    });

    removeMail(id);

    return {
        phone:result.senderPhone,
        onConfirm:async () => {},
        onClosed:finishPopup
    };
}

async function handleReject(id){
    await rejectMobile({
        id,
        receiver:nickname
    });

    removeMail(id);
}
