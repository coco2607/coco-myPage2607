// loginFirebase.js
import {
    db,
    ref,
    get,
    update,
    onDisconnect,
    runTransaction
} from "../firebase.js";
import {
    trim,
    createId
} from "../utils.js";

const MEMBER = "으차방/member";
const ACCESS = "으차방/access";
const DEVICE = "으차방/deviceId";
const myConnectionId = createId();

export async function getMemberState(nickname){
    nickname = trim(nickname);
    if(nickname.length < 2){
        throw new Error("닉네임 2자를 입력하세요.");
    }
    const snapshot = await get(ref(db, `${MEMBER}/${nickname}`));
    if(!snapshot.exists()){
        return "NO_PASSWORD";
    }
    const data = snapshot.val();
    if(!data.memberPw){
        return "NO_PASSWORD";
    }
    return "PASSWORD";
}

export async function setMemberPassword(nickname,password){
    nickname = trim(nickname);
    password = trim(password);
    if(nickname.length < 2){
        throw new Error("닉네임 2자를 입력하세요.");
    }
    if(password === ""){
        throw new Error("새 비밀번호를 입력하세요.");
    }
    await update(ref(db, `${MEMBER}/${nickname}`),{
        memberPw:password
    });
    return true;
}

export async function login(nickname,password){
    nickname = trim(nickname);
    password = trim(password);
    if(nickname.length < 2){
        throw new Error("닉네임 2자를 입력하세요.");
    }
    if(password === ""){
        throw new Error("비밀번호를 입력해주세요.");
    }
    const ok = await checkMemberPassword(nickname,password);
    if(!ok){
        throw new Error("닉네임 또는 비밀번호가 올바르지 않습니다.");
    }
    await joinUser(nickname);
    return true;
}

export async function saveDeviceId(deviceId,nickname){
    deviceId = trim(deviceId);
    nickname = trim(nickname);
    if(deviceId === ""){
        throw new Error("디바이스 정보가 없습니다.");
    }
    if(nickname === ""){
        throw new Error("닉네임 정보가 없습니다.");
    }
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
    return true;
}

async function checkMemberPassword(nickname,password){
    const snapshot = await get(ref(db, `${MEMBER}/${nickname}`));
    if(!snapshot.exists()){
        return false;
    }
    const data = snapshot.val();
    if(!data.memberPw){
        return false;
    }
    return data.memberPw === password;
}

async function joinUser(nickname){
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