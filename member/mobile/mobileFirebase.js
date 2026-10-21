
/* mobile/mobileFirebase.js */
import {
    db,
    ref,
    get,
    update,
    push,
    onValue,
    runTransaction
} from "../../firebase.js";

const ROOT = "으차방";
const MEMBER = `${ROOT}/member`;
const MOBILE = `${ROOT}/mobile`;
const HISTORY = `${ROOT}/history`;
const COST = 30;

export async function loadMobileList(){
    const snapshot = await get(
        ref(db,`${MOBILE}/list`)
    );

    if(!snapshot.exists()){
        return [];
    }

    const list = [];

    snapshot.forEach(child => {
        list.push({
            key:child.key,
            ...child.val()
        });
    });

    return list;
}

export function watchMobileList(callback){
    const listRef = ref(
        db,
        `${MOBILE}/list`
    );

    return onValue(
        listRef,
        snapshot => {
            const list = [];

            if(snapshot.exists()){
                snapshot.forEach(child => {
                    list.push({
                        key:child.key,
                        ...child.val()
                    });
                });
            }

            callback(list);
        },
        error => {
            console.error(
                "전번교환 목록 실시간 조회 실패:",
                error
            );
        }
    );
}

export function loadMobileMail(nickname,callback){
    let version = 0;

    return onValue(
        ref(db,`${MEMBER}/${nickname}/mobile`),
        async snapshot => {
            const currentVersion = ++version;

            const entries = snapshot.exists()
                ? Object.entries(snapshot.val())
                : [];

            const pending = entries.filter(([,value]) => {
                return value?.mail1 === true ||
                    value?.mail2 === true;
            });

            try{
                const mails = await Promise.all(
                    pending.map(async ([id,flags]) => {
                        const detail = await get(
                            ref(db,`${MOBILE}/${id}`)
                        );

                        if(!detail.exists()){
                            return null;
                        }

                        const data = detail.val();

                        if(
                            flags.mail1 === true &&
                            data.receiver === nickname &&
                            typeof data.exchange !== "boolean"
                        ){
                            return {
                                id,
                                type:"receive",
                                sender:data.sender,
                                timestamp:data.timestamp
                            };
                        }

                        if(
                            flags.mail2 === true &&
                            data.sender === nickname &&
                            typeof data.exchange === "boolean"
                        ){
                            return {
                                id,
                                type:"result",
                                receiver:data.receiver,
                                receiverPhone:data.exchange === true
                                    ? data.receiverPhone
                                    : "",
                                exchange:data.exchange,
                                timestamp:data.timestamp
                            };
                        }

                        return null;
                    })
                );

                if(currentVersion !== version){
                    return;
                }

                const result = mails
                    .filter(Boolean)
                    .sort((a,b) => {
                        return Number(a.timestamp || 0) -
                            Number(b.timestamp || 0);
                    });

                callback(result);
            }catch(error){
                console.error(
                    "전번교환 알림 조회 실패:",
                    error
                );
            }
        },
        error => {
            console.error(
                "전번교환 알림 감시 실패:",
                error
            );
        }
    );
}

export async function sendMobile({
    sender,
    receiver,
    senderPhone
}){
    sender = String(sender || "").trim();
    receiver = String(receiver || "").trim();

    if(!sender || !receiver){
        throw new Error("회원정보를 확인해주세요.");
    }

    if(sender === receiver){
        throw new Error("본인에게는 사용할 수 없습니다.");
    }

    if(!validPhone(senderPhone)){
        throw new Error("올바른 연락처를 입력해주세요.");
    }

    const receiverSnapshot = await get(
        ref(db,`${MEMBER}/${receiver}`)
    );

    if(!receiverSnapshot.exists()){
        throw new Error("존재하지 않는 닉네임입니다.");
    }

    const senderSnapshot = await get(
        ref(db,`${MEMBER}/${sender}`)
    );

    if(!senderSnapshot.exists()){
        throw new Error("회원정보를 찾을 수 없습니다.");
    }

    const currentPoint = Number(
        senderSnapshot.val().point || 0
    );

    if(currentPoint < COST){
        throw new Error("포인트가 부족합니다.");
    }

    const now = Date.now();
    const uniqueKey = push(
        ref(db,`${MOBILE}/list`)
    ).key;

    const id = `${getDateKey(now)}-${uniqueKey}`;

    const pointRef = ref(
        db,
        `${MEMBER}/${sender}/point`
    );

    const transaction = await runTransaction(
        pointRef,
        current => {
            if(current === null){
                return null;
            }

            const point = Number(current);

            if(!Number.isFinite(point) || point < COST){
                return;
            }

            return point - COST;
        },
        {
            applyLocally:false
        }
    );

    if(!transaction.committed){
        throw new Error("포인트 차감 처리에 실패했습니다.");
    }

    const historyKey = push(
        ref(db,`${HISTORY}/${sender}`)
    ).key;

    const updates = {};

    updates[`${MOBILE}/${id}`] = {
        sender,
        receiver,
        senderPhone,
        receiverPhone:"",
        exchange:"",
        timestamp:now
    };

    updates[`${MOBILE}/list/${id}`] = {
        sender,
        receiver,
        timestamp:now
    };

    updates[`${MEMBER}/${receiver}/mobile/${id}/mail1`] = true;
    updates[`${MEMBER}/${sender}/lastUpdate`] = now;

    updates[`${HISTORY}/${sender}/${historyKey}`] = {
        type:"전번교환권 사용",
        useP:COST
    };

    try{
        await update(ref(db),updates);
    }catch(error){
        console.error(
            "전번교환 신청 저장 실패:",
            error
        );

        throw new Error(
            "신청 저장에 실패했습니다.\n포인트 차감 여부를 확인해주세요."
        );
    }

    return id;
}

async function answerMobile({
    id,
    receiver,
    receiverPhone,
    accepted
}){
    const mobileRef = ref(
        db,
        `${MOBILE}/${id}`
    );

    const snapshot = await new Promise((resolve,reject) => {
        onValue(
            mobileRef,
            resolve,
            reject,
            {
                onlyOnce:true
            }
        );
    });

    if(!snapshot.exists()){
        throw new Error("신청 내역이 없습니다.");
    }

    const data = snapshot.val();

    if(data.receiver !== receiver){
        throw new Error("신청 대상자가 아닙니다.");
    }

    if(typeof data.exchange === "boolean"){
        throw new Error("이미 처리된 신청입니다.");
    }

    const result = await runTransaction(
        mobileRef,
        current => {
            const value = current === null
                ? data
                : current;

            if(
                value.receiver !== receiver ||
                typeof value.exchange === "boolean"
            ){
                return;
            }

            return {
                ...value,
                receiverPhone:accepted ? receiverPhone : "",
                exchange:accepted
            };
        },
        {
            applyLocally:false
        }
    );

    if(!result.committed){
        const latest = await get(mobileRef);

        if(
            latest.exists() &&
            typeof latest.val().exchange === "boolean"
        ){
            throw new Error("이미 처리된 신청입니다.");
        }

        throw new Error(
            "처리에 실패했습니다.\n잠시 후 다시 시도해주세요."
        );
    }

    const saved = result.snapshot.val();

    if(
        !saved ||
        saved.receiver !== receiver ||
        saved.exchange !== accepted
    ){
        throw new Error(
            "처리 결과를 확인하지 못했습니다.\n신청 상태를 확인해주세요."
        );
    }

    const updates = {};

    updates[`${MEMBER}/${receiver}/mobile/${id}/mail1`] = false;
    updates[`${MEMBER}/${data.sender}/mobile/${id}/mail2`] = true;

    await update(ref(db),updates);

    return {
        senderPhone:saved.senderPhone
    };
}

export async function acceptMobile({
    id,
    receiver,
    receiverPhone
}){
    if(!validPhone(receiverPhone)){
        throw new Error("올바른 연락처를 입력해주세요.");
    }

    return answerMobile({
        id,
        receiver,
        receiverPhone,
        accepted:true
    });
}

export async function rejectMobile({
    id,
    receiver
}){
    await answerMobile({
        id,
        receiver,
        receiverPhone:"",
        accepted:false
    });

    return true;
}

export async function confirmMobile(nickname,id){
    const mobileRef = ref(
        db,
        `${MOBILE}/${id}`
    );

    const snapshot = await get(mobileRef);

    if(!snapshot.exists()){
        throw new Error("신청 내역이 없습니다.");
    }

    const data = snapshot.val();

    if(data.sender !== nickname){
        throw new Error("신청자가 아닙니다.");
    }

    if(typeof data.exchange !== "boolean"){
        throw new Error("아직 처리되지 않은 신청입니다.");
    }

    const updates = {};

    updates[`${MEMBER}/${nickname}/mobile/${id}/mail2`] = false;
    updates[`${MOBILE}/${id}/senderPhone`] = null;
    updates[`${MOBILE}/${id}/receiverPhone`] = null;

    await update(ref(db),updates);

    return true;
}

function validPhone(phone){
    return /^01[016789]-\d{3,4}-\d{4}$/.test(
        String(phone || "")
    );
}

function getDateKey(timestamp){
    const parts = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:"Asia/Seoul",
            year:"numeric",
            month:"2-digit",
            day:"2-digit"
        }
    ).formatToParts(new Date(timestamp));

    const getPart = type => {
        return parts.find(item => {
            return item.type === type;
        })?.value;
    };

    return [
        getPart("year"),
        getPart("month"),
        getPart("day")
    ].join("-");
}
