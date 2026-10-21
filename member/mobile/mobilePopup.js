
/* mobile/mobilePopup.js */
import {initMobileUi} from "./mobileUi.js";

let currentId = "";
let alertTimer = null;
let copyTimer = null;
let resultCallback = null;
let resultClosedCallback = null;
let busy = false;

export function initMobilePopup(handlers = {}){
    initMobileUi();

    const requestModal = document.getElementById("mobileRequestModal");
    const receiveModal = document.getElementById("mobileReceiveModal");
    const resultModal = document.getElementById("mobileResultModal");

    const myPhone = document.getElementById("mobileMyPhone");
    const replyPhone = document.getElementById("mobileReplyPhone");
    const target = document.getElementById("mobileTarget");

    const sendBtn = document.getElementById("mobileSendBtn");
    const acceptBtn = document.getElementById("mobileAcceptBtn");
    const rejectBtn = document.getElementById("mobileRejectBtn");
    const copyBtn = document.getElementById("mobileCopyBtn");
    const resultOk = document.getElementById("mobileResultOk");

    function updateSendButton(){
        sendBtn.disabled = busy ||
            !validPhone(myPhone.value) ||
            !target.value.trim();
    }

    function updateReceiveButtons(){
        acceptBtn.disabled = busy ||
            !validPhone(replyPhone.value);

        rejectBtn.disabled = busy;
    }

    myPhone.addEventListener("input",() => {
        myPhone.value = formatPhone(myPhone.value);
        updateSendButton();
    });

    target.addEventListener("input",updateSendButton);

    replyPhone.addEventListener("input",() => {
        replyPhone.value = formatPhone(replyPhone.value);
        updateReceiveButtons();
    });

    document.getElementById("mobileRequestCancel").addEventListener("click",() => {
        if(busy){
            return;
        }

        closeModal(requestModal);
    });

    document.getElementById("mobileLaterBtn").addEventListener("click",() => {
        if(busy){
            return;
        }

        const id = currentId;

        closeModal(receiveModal);
        currentId = "";

        handlers.onLater?.(id);
    });

    sendBtn.addEventListener("click",async () => {
        if(busy){
            return;
        }

        const phone = myPhone.value.trim();
        const receiver = target.value.trim();

        if(!validPhone(phone)){
            showMobileAlert("올바른 연락처를 입력해주세요.");
            myPhone.focus();
            return;
        }

        if(!receiver){
            showMobileAlert("상대방 닉네임을 입력해주세요.");
            target.focus();
            return;
        }

        if(typeof handlers.onSend !== "function"){
            return;
        }

        busy = true;
        updateSendButton();

        try{
            await handlers.onSend({
                phone,
                receiver
            });

            closeModal(requestModal);
            showMobileAlert("상대방에게 연락처가 발송되었습니다.");
        }catch(error){
            showMobileAlert(
                error.message || "연락처 발송에 실패했습니다."
            );
        }finally{
            busy = false;
            updateSendButton();
        }
    });

    acceptBtn.addEventListener("click",async () => {
        if(busy){
            return;
        }

        const phone = replyPhone.value.trim();

        if(!validPhone(phone)){
            showMobileAlert("올바른 연락처를 입력해주세요.");
            replyPhone.focus();
            return;
        }

        if(typeof handlers.onAccept !== "function"){
            return;
        }

        busy = true;
        updateReceiveButtons();

        try{
            const id = currentId;
            const result = await handlers.onAccept(id,phone);

            closeModal(receiveModal);

            openMobileResult({
                title:"연락처 교환 완료",
                message:"상대방의 연락처입니다.",
                phone:result?.phone || "",
                onConfirm:result?.onConfirm,
                onClosed:result?.onClosed
            });
        }catch(error){
            showMobileAlert(
                error.message || "연락처 교환 수락에 실패했습니다."
            );
        }finally{
            busy = false;
            updateReceiveButtons();
        }
    });

    rejectBtn.addEventListener("click",async () => {
        if(busy){
            return;
        }

        if(typeof handlers.onReject !== "function"){
            return;
        }

        busy = true;
        updateReceiveButtons();

        try{
            const id = currentId;

            await handlers.onReject(id);

            closeModal(receiveModal);
            currentId = "";

            showMobileAlert("연락처 교환을 거절하였습니다.");

            handlers.onReplyClosed?.();
        }catch(error){
            showMobileAlert(
                error.message || "거절 처리에 실패했습니다."
            );
        }finally{
            busy = false;
            updateReceiveButtons();
        }
    });

    resultOk.addEventListener("click",async () => {
        if(busy){
            return;
        }

        busy = true;
        resultOk.disabled = true;

        try{
            if(typeof resultCallback === "function"){
                await resultCallback();
            }

            closeModal(resultModal);

            resultCallback = null;
            currentId = "";

            const onClosed = resultClosedCallback;
            resultClosedCallback = null;

            resetCopyButton();
            onClosed?.();
        }catch(error){
            showMobileAlert(
                error.message || "확인 처리에 실패했습니다."
            );
        }finally{
            busy = false;
            resultOk.disabled = false;
        }
    });

    copyBtn.addEventListener("click",async () => {
        const phone = document.getElementById(
            "mobileResultPhone"
        ).textContent.trim();

        if(!phone){
            return;
        }

        try{
            await navigator.clipboard.writeText(phone);

            if(copyTimer){
                clearTimeout(copyTimer);
            }

            copyBtn.textContent = "복사 완료";

            copyTimer = setTimeout(() => {
                resetCopyButton();
            },2000);
        }catch(error){
            showMobileAlert("연락처 복사에 실패했습니다.");
        }
    });

    updateSendButton();
    updateReceiveButtons();
}

export function openMobileRequest(){
    if(busy){
        return;
    }

    const myPhone = document.getElementById("mobileMyPhone");
    const target = document.getElementById("mobileTarget");
    const sendBtn = document.getElementById("mobileSendBtn");

    myPhone.value = "";
    target.value = "";
    sendBtn.disabled = true;

    openModal(document.getElementById("mobileRequestModal"));

    myPhone.focus();
}

export function openMobileReceive(id,sender){
    if(busy){
        return;
    }

    currentId = id;

    document.getElementById("mobileReceiveMessage").textContent =
        `${sender}님께서 연락처 교환을 신청하셨습니다.`;

    const replyPhone = document.getElementById("mobileReplyPhone");

    replyPhone.value = "";

    document.getElementById("mobileAcceptBtn").disabled = true;
    document.getElementById("mobileRejectBtn").disabled = false;

    openModal(document.getElementById("mobileReceiveModal"));
}

export function openMobileResult({
    title = "연락처 교환 결과",
    message = "",
    phone = "",
    onConfirm = null,
    onClosed = null
} = {}){
    resultCallback = onConfirm;
    resultClosedCallback = onClosed;

    document.getElementById("mobileResultTitle").textContent = title;
    document.getElementById("mobileResultMessage").textContent = message;
    document.getElementById("mobileResultPhone").textContent = phone;

    document.getElementById("mobilePhoneArea").classList.toggle(
        "hidden",
        !phone
    );

    resetCopyButton();

    openModal(document.getElementById("mobileResultModal"));
}

export function showMobileAlert(message){
    const modal = document.getElementById("mobileAlertModal");
    const text = document.getElementById("mobileAlertMessage");

    if(alertTimer){
        clearTimeout(alertTimer);
    }

    text.textContent = message;
    openModal(modal);

    alertTimer = setTimeout(() => {
        closeModal(modal);
        alertTimer = null;
    },2000);
}

function openModal(modal){
    modal.classList.remove("hidden");
}

function closeModal(modal){
    modal.classList.add("hidden");
}

function resetCopyButton(){
    if(copyTimer){
        clearTimeout(copyTimer);
        copyTimer = null;
    }

    const copyBtn = document.getElementById("mobileCopyBtn");

    if(copyBtn){
        copyBtn.textContent = "복사";
    }
}

function validPhone(phone){
    return /^01[016789]-\d{3,4}-\d{4}$/.test(
        String(phone || "")
    );
}

function formatPhone(value){
    const digits = String(value || "")
        .replace(/\D/g,"")
        .slice(0,11);

    if(digits.length <= 3){
        return digits;
    }

    const middleLength = digits.startsWith("010")
        ? 4
        : digits.length <= 10
            ? 3
            : 4;

    if(digits.length <= 3 + middleLength){
        return `${digits.slice(0,3)}-${digits.slice(3)}`;
    }

    return `${digits.slice(0,3)}-${digits.slice(3,3 + middleLength)}-${digits.slice(3 + middleLength)}`;
}
