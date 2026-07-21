// memberFirebase.js

import {
    db,
    ref,
    get,
    update,
    query,
    orderByChild,
    equalTo
} from "../firebase.js";


// 회원정보
export async function loadUser(nickname) {

    const snapshot = await get(ref(db, `users/${nickname}`));

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val();

}


// 히스토리
export async function loadHistory(nickname) {

    const historyRef = query(
        ref(db, "history"),
        orderByChild("nickname"),
        equalTo(nickname)
    );

    const snapshot = await get(historyRef);

    if (!snapshot.exists()) {
        return [];
    }

    const list = [];

    snapshot.forEach(child => {
        list.push(child.val());
    });

    // 최신순
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return list;
}


// 비밀번호 변경
export async function updateMemberPassword(nickname, newPassword) {

    await update(
        ref(db, `users/${nickname}`),
        {
            memberPw: newPassword
        }
    );

}