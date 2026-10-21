
/* mobile/mobileUi.js */

const mobileList = document.getElementById("mobileList");
const mobileNew = document.getElementById("mobileNew");

export function initMobileUi(){
    if(document.getElementById("mobileRequestModal")){
        return;
    }

    const container = document.createElement("div");
    container.id = "mobilePopupContainer";

    container.innerHTML = `
        <div id="mobileRequestModal" class="mobileModal hidden">
            <div class="mobileModalBox">
                <h2>전번교환권 사용하기</h2>

                <label for="mobileMyPhone">
                    내 연락처를 입력하세요.
                </label>
                <input
                    type="tel"
                    id="mobileMyPhone"
                    maxlength="13"
                    inputmode="tel"
                    autocomplete="tel"
                    placeholder="숫자만 입력">

                <label for="mobileTarget">
                    연락처를 교환할 상대방을 알려주세요.
                </label>
                <input
                    type="text"
                    id="mobileTarget"
                    autocomplete="off"
                    placeholder="받는 이">

                <div class="mobileNotice">
                    <strong>안내</strong>
                    <p>발송 후 30포인트가 즉시 차감됩니다.</p>
                    <p>어떤 경우라도 포인트는 환불이 불가합니다.</p>
                    <p>상대방이 거절할 경우 내 연락처를 알 수 없습니다.</p>
                </div>

                <div class="mobileModalButtons">
                    <button type="button" id="mobileSendBtn">
                        연락처 전달하기
                    </button>
                    <button type="button" id="mobileRequestCancel">
                        취소
                    </button>
                </div>
            </div>
        </div>

        <div id="mobileReceiveModal" class="mobileModal hidden">
            <div class="mobileModalBox">
                <h2>연락처 교환 신청</h2>

                <p id="mobileReceiveMessage"></p>
                <p>
                    연락처 교환을 원하시면 내 연락처를 입력하세요.
                </p>

                <input
                    type="tel"
                    id="mobileReplyPhone"
                    maxlength="13"
                    inputmode="tel"
                    autocomplete="tel"
                    placeholder="숫자만 입력">

                <div class="mobileNotice">
                    <strong>안내</strong>
                    <p>거절하실 경우 서로의 연락처는 알 수 없습니다.</p>
                </div>

                <div class="mobileModalButtons">
                    <button type="button" id="mobileAcceptBtn">
                        수락
                    </button>
                    <button type="button" id="mobileRejectBtn">
                        거절
                    </button>
                    <button type="button" id="mobileLaterBtn">
                        나중에
                    </button>
                </div>
            </div>
        </div>

        <div id="mobileResultModal" class="mobileModal hidden">
            <div class="mobileModalBox">
                <h2 id="mobileResultTitle">연락처 교환 결과</h2>

                <p id="mobileResultMessage"></p>

                <div id="mobilePhoneArea" class="mobilePhoneArea hidden">
                    <span id="mobileResultPhone"></span>
                    <button type="button" id="mobileCopyBtn">
                        복사
                    </button>
                </div>

                <div id="mobileResultNotice" class="mobileNotice hidden">
                    <strong>주의</strong>
                    <p>연락처는 재조회 및 재발송이 불가합니다.</p>
                </div>

                <div class="mobileModalButtons">
                    <button type="button" id="mobileResultOk">
                        확인
                    </button>
                </div>
            </div>
        </div>

        <div id="mobileAlertModal" class="mobileModal hidden">
            <div class="mobileModalBox mobileAlertBox">
                <p id="mobileAlertMessage"></p>
            </div>
        </div>
    `;

    document.body.appendChild(container);
}

export function updateMobileNew(visible){
    mobileNew.classList.toggle("hidden",!visible);
}

export function renderMobileList(list){
    mobileList.replaceChildren();

    if(!Array.isArray(list) || list.length === 0){
        const empty = document.createElement("div");
        empty.className = "mobileEmpty";
        empty.textContent = "첫 전번교환권 사용자가 되어주세요.";
        mobileList.appendChild(empty);
        return;
    }

    const sorted = [...list].sort((a,b) => {
        return getMobileTime(b) - getMobileTime(a);
    });

    const fragment = document.createDocumentFragment();

    sorted.forEach(data => {
        const item = document.createElement("div");
        item.className = "mobileItem";

        const date = document.createElement("div");
        date.className = "mobileDate";
        date.textContent = formatMobileDate(
            data.timestamp || data.key
        );

        const detail = document.createElement("div");
        detail.className = "mobileDetail";

        const sender = document.createElement("span");
        sender.className = "mobileSender";
        sender.textContent = data.sender || "";

        const arrow1 = document.createElement("span");
        arrow1.className = "mobileArrow";
        arrow1.textContent = "→";

        const mail = document.createElement("span");
        mail.className = "mobileMailIcon";
        mail.textContent = "✉️";

        const arrow2 = document.createElement("span");
        arrow2.className = "mobileArrow";
        arrow2.textContent = "→";

        const receiver = document.createElement("span");
        receiver.className = "mobileReceiver";
        receiver.textContent = "비공개";

        detail.append(
            sender,
            arrow1,
            mail,
            arrow2,
            receiver
        );

        item.append(date,detail);
        fragment.appendChild(item);
    });

    mobileList.appendChild(fragment);
}

function getMobileTime(data){
    const value = data.timestamp;

    if(typeof value === "number"){
        return value;
    }

    if(typeof value === "string" && value.trim()){
        const numeric = Number(value);

        if(Number.isFinite(numeric) && numeric > 0){
            return numeric;
        }

        const parsed = new Date(value).getTime();

        if(Number.isFinite(parsed)){
            return parsed;
        }
    }

    const key = String(data.key || "");
    const match = key.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if(match){
        return new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        ).getTime();
    }

    return 0;
}

function formatMobileDate(value){
    if(value === "" || value == null){
        return "";
    }

    const keyMatch = String(value).match(
        /^(\d{4})-(\d{2})-(\d{2})/
    );

    if(keyMatch){
        return `${keyMatch[1]}.${keyMatch[2]}.${keyMatch[3]}`;
    }

    const numeric = Number(value);
    const date = Number.isFinite(numeric) && numeric > 0
        ? new Date(numeric)
        : new Date(value);

    if(Number.isNaN(date.getTime())){
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2,"0");
    const day = String(date.getDate()).padStart(2,"0");

    return `${year}.${month}.${day}`;
}
