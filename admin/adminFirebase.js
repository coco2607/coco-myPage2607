// adminFirebase.js

import {
    db,
    ref,
    get,
    remove
} from "../firebase.js";

// 관리자 로그인 확인
export async function checkAdmin(password) {

    const snapshot = await get(ref(db, "admin/password"));

    if (!snapshot.exists()) {
        return false;
    }

    return snapshot.val() === password;
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


// 개별 삭제
export async function deleteHistory(key) {
    await remove(ref(db, `users/${key}`));
}


// 회원 삭제
export async function deleteUser(nickname) {
    await remove(ref(db, `users/${nickname}`));
}


// 월별 삭제
export async function deleteHistoryByMonth(month) {

    const snapshot = await get(ref(db, "history"));

    if (!snapshot.exists()) {
        return 0;
    }

    const data = snapshot.val();

    let count = 0;

    for (const key in data) {
        
        const item = data[key];

        if (item.date && item.date.startsWith(month)) {
            await remove(ref(db, `history/${key}`));
            count++;
        }
    }
    return count;
}