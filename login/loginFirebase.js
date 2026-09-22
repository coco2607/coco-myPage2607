// loginFirebase.js
import {
    db,
    ref,
    get,
    update,
    onDisconnect,
    runTransaction
} from "../firebase.js";
import {createId} from "../utils.js";

const MEMBER = "으차방/member";
const ACCESS = "으차방/access";
const DEVICE = "으차방/deviceId";
const myConnectionId = createId();

export async function getMember(nickname){
    const snapshot = await get(ref(db, `${MEMBER}/${nickname}`));
    if(!snapshot.exists()){
        return null;
    }
    return snapshot.val();
}

export async function saveMemberPassword(nickname,password){
    await update(ref(db, `${MEMBER}/${nickname}`),{
        memberPw:password
    });
}

export async function saveDeviceId(deviceId,nickname){
    const snapshot = await get(ref(db, `${MEMBER}/${nickname}`));
    if(!snapshot.exists()){
        throw new Error("회원 정보가 없습니다.");
    }
    const memberData = snapshot.val();
    const oldDeviceId = memberData.deviceId || "";
    const updates = {};
    if(oldDeviceId && oldDeviceId !== deviceId){
        updates[`${DEVICE}/${oldDeviceId}`] = null;
    }
    updates[`${DEVICE}/${deviceId}`] = {
        nickname:nickname
    };
    updates[`${MEMBER}/${nickname}/deviceId`] = deviceId;
    await update(ref(db),updates);
}

export async function joinUser(nickname){
    const accessRef = ref(db, `${ACCESS}/${nickname}`);
    const result = await runTransaction(accessRef,current => {
        if(current === null){
            return myConnectionId;
        }
        return;
    });
    if(!result.committed){
        throw new Error("이미 사용 중인 닉네임입니다.");
    }
    onDisconnect(accessRef).remove();
}