/* mobile/mobileFirebase.js */
import {
    db,
    ref,
    get,
    onValue
} from "../../firebase.js";

const ROOT = "으차방";
const MEMBER = `${ROOT}/member`;
const MOBILE = `${ROOT}/mobile`;

function isManager(){
    const admin = sessionStorage.getItem("admin") === "true";
    const staff = sessionStorage.getItem("staff") === "true";
    return admin || staff;
}

async function resolvePrivateReceivers(list){
    if(!isManager()){
        return list;
    }

    await Promise.all(list.map(async item => {
        if(item.receiver !== "비공개"){
            return;
        }

        try{
            const snapshot = await get(
                ref(db,`${MOBILE}/${item.key}`)
            );

            if(snapshot.exists()){
                const receiver = snapshot.val().receiver;

                item.receiver = receiver
                    ? `${receiver}(비공개)`
                    : "비공개";
            }
        }catch(error){
            console.error(
                "비공개 닉네임 조회 실패:",
                error
            );
        }
    }));

    return list;
}

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

    return resolvePrivateReceivers(list);
}

export function watchMobileList(callback){
    let version = 0;

    return onValue(
        ref(db,`${MOBILE}/list`),
        async snapshot => {
            const currentVersion = ++version;
            const list = [];

            if(snapshot.exists()){
                snapshot.forEach(child => {
                    list.push({
                        key:child.key,
                        ...child.val()
                    });
                });
            }

            try{
                await resolvePrivateReceivers(list);

                if(currentVersion !== version){
                    return;
                }

                callback(list);
            }catch(error){
                console.error(
                    "전번교환 목록 처리 실패:",
                    error
                );
            }
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