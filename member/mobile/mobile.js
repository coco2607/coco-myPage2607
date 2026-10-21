/* mobile/mobile.js */
import {loadMobileList,loadMobileMail,sendMobile,acceptMobile,rejectMobile,confirmMobile} from "./mobileFirebase.js";
import {initMobileUi,updateMobileNew,renderMobileList} from "./mobileUi.js";
import {initMobilePopup,openMobileRequest,openMobileReceive,openMobileResult,showMobileAlert} from "./mobilePopup.js";

const nickname = sessionStorage.getItem("nickname");
const mobileUseBtn = document.getElementById("mobileUseBtn");
let mobileMails = [];
let popupOpen = false;
let visibleId = "";
const postponed = new Set();

if(nickname) initMobile();

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
    mobileUseBtn.addEventListener("click",openMobileRequest);
    document.addEventListener("showMobile",() => {
        postponed.clear();
        refreshMobileList();
        showNextMail();
    });
    loadMobileMail(nickname,mails => {
        mobileMails = mails;
        updateMobileNew(mails.length > 0);
        if(!document.getElementById("mobileContent").classList.contains("hidden")){
            showNextMail();
        }
    });
}

async function refreshMobileList(){
    try{
        renderMobileList(await loadMobileList());
    }catch(error){
        console.error("전번교환권 목록 불러오기 실패:",error);
        showMobileAlert("사용 내역을 불러오지 못했습니다.");
    }
}

function showNextMail(){
    if(popupOpen) return;
    const mail = mobileMails.find(item => !postponed.has(item.id));
    if(!mail) return;
    popupOpen = true;
    visibleId = mail.id;
    if(mail.type === "receive"){
        openMobileReceive(mail.id,mail.sender);
        return;
    }
    if(mail.type === "result"){
        const accepted = mail.exchange === true;
        openMobileResult({
            title:"연락처 교환 결과",
            message:accepted
                ? `${mail.receiver}님께서 연락처 교환을 수락하셨습니다.`
                : `${mail.receiver}님께서 연락처 교환을 거절하셨습니다.`,
            phone:accepted ? mail.receiverPhone : "",
            onConfirm:async () => {
                await confirmMobile(nickname,mail.id);
                mobileMails = mobileMails.filter(item => item.id !== mail.id);
                updateMobileNew(mobileMails.length > 0);
            },
            onClosed:finishPopup
        });
    }
}

function finishPopup(){
    popupOpen = false;
    visibleId = "";
    queueMicrotask(showNextMail);
}

async function handleSend({phone,receiver}){
    if(receiver === nickname) throw new Error("본인에게는 사용할 수 없습니다.");
    await sendMobile({sender:nickname,receiver,senderPhone:phone});
    document.dispatchEvent(new Event("memberUpdated"));
    await refreshMobileList();
}

async function handleAccept(id,phone){
    const result = await acceptMobile({id,receiver:nickname,receiverPhone:phone});
    mobileMails = mobileMails.filter(item => item.id !== id);
    updateMobileNew(mobileMails.length > 0);
    return {
        phone:result.senderPhone,
        onConfirm:async () => {},
        onClosed:finishPopup
    };
}

async function handleReject(id){
    await rejectMobile({id,receiver:nickname});
    mobileMails = mobileMails.filter(item => item.id !== id);
    updateMobileNew(mobileMails.length > 0);
}
