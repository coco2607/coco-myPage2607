// changenmFirebase.js

import {
    db,
    ref,
    get,
    update
} from "../firebase.js";

const MEMBER = "으차방/member";
const HISTORY = "으차방/history";
const DEVICE = "으차방/deviceId";
const ADMIN = "으차방/admin";

export async function changeNickname(oldNickname,newNickname){
    if(!oldNickname || !newNickname){
        throw new Error("닉네임 정보가 없습니다.");
    }

    if(oldNickname === newNickname){
        return true;
    }

    const memberSnap = await get(
        ref(db, `${MEMBER}/${oldNickname}`)
    );

    if(!memberSnap.exists()){
        throw new Error("회원이 존재하지 않습니다.");
    }

    const historySnap = await get(
        ref(db, `${HISTORY}/${oldNickname}`)
    );

    const deviceSnap = await get(
        ref(db, DEVICE)
    );

    const adminSnap = await get(
        ref(db, ADMIN)
    );

    const updates = {};

    updates[`${MEMBER}/${newNickname}`] = memberSnap.val();
    updates[`${MEMBER}/${oldNickname}`] = null;

    if(historySnap.exists()){
        updates[`${HISTORY}/${newNickname}`] = historySnap.val();
        updates[`${HISTORY}/${oldNickname}`] = null;
    }

    if(deviceSnap.exists()){
        deviceSnap.forEach(child => {
            const data = child.val();

            if(data?.nickname === oldNickname){
                updates[
                    `${DEVICE}/${child.key}/nickname`
                ] = newNickname;
            }
        });
    }

    if(adminSnap.exists()){
        const adminData = adminSnap.val();

        if(adminData.admin === oldNickname){
            updates[`${ADMIN}/admin`] = newNickname;
        }

        if(adminData.staff === oldNickname){
            updates[`${ADMIN}/staff`] = newNickname;
        }
    }

    await update(ref(db),updates);

    return true;
}