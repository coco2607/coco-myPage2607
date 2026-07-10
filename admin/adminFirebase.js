// adminFirebase.js

import {
    db,
    ref,
    get,
    update
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

// 회원 상태 저장
export async function updateMemberState(nickname, state) {

    await update(
        ref(db, `users/${nickname}`),
        {
            state
        }
    );

}