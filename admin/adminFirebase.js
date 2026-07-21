// adminFirebase.js

import {
    db,
    ref,
    get,
    update,
    push,
    set
} from "../firebase.js";

// 관리자 로그인 확인
export async function checkAdmin(password) {

    const snapshot = await get(ref(db, "admin"));

    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.val();

    if (password === data.adminPassword) {
        return "admin";
    }

    if (password === data.staffPassword) {
        return "staff";
    }

    return null;
}

// history 전체 가져오기
export async function loadHistory() {

    const snapshot = await get(ref(db, "history"));

    if (!snapshot.exists()) {
        return [];
    }

    return Object.values(snapshot.val());

}

// users 전체 가져오기
export async function loadUsers() {

    const snapshot = await get(ref(db, "users"));

    if (!snapshot.exists()) {
        return [];
    }

    const data = snapshot.val();

    return Object.entries(data).map(([nickname, value]) => ({
        nickname,
        ...value
    }));

}

// 회원 상태 저장
export async function updateMemberState(nickname, state) {

    await update(
        ref(db, `users/${nickname}`),
        {
            state,
            totalP: 0
        }
    );

}

// 엑셀 업로드 history 추가
export async function uploadHistory(historyList) {

    for (const history of historyList) {
        await set(
            push(ref(db, "history")),
            history
        );
    }
}

// 엑셀 업로드 users 업데이트
export async function uploadUsers(userList) {

    const updates = {};

    for (const user of userList) {
        const { nickname, ...data } = user;

        if (!nickname) continue;
        updates[nickname] = data;
    }
    await update(ref(db, "users"), updates);
}