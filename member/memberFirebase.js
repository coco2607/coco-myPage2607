// memberFirebase.js

import {
    db,
    ref,
    get,
    update
} from "../firebase.js";


// 회원정보
export async function loadUser(nickname) {

    const snapshot = await get(
        ref(db, `으차방/member/${nickname}`)
    );

    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.val();

    return {
        totalP: data.point !== undefined && data.point !== ""
            ? Number(data.point)
            : 0,
        last: data.lastPosition !== undefined
            ? Number(data.lastPosition)
            : 0,
        memberPw: data.memberPw ?? "",
        state: data.state ?? ""
    };
}


// 히스토리
export async function loadHistory(nickname) {

    const snapshot = await get(
        ref(db, `으차방/history/${nickname}`)
    );

    if (!snapshot.exists()) {
        return [];
    }

    const list = [];

    snapshot.forEach(child => {

        list.push({
            key: child.key,
            ...child.val()
        });

    });

    // 최신순
    list.sort((a, b) => {

        return String(b.joinDate || "").localeCompare(
            String(a.joinDate || "")
        );

    });

    return list;
}


// 비밀번호 변경
export async function updateMemberPassword(
    nickname,
    newPassword
) {

    await update(
        ref(db, `으차방/member/${nickname}`),
        {
            memberPw: newPassword
        }
    );

}