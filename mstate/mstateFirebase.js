// mstateFirebase.js

import {
    db,
    ref,
    get,
    push,
    update,
    remove
} from "../firebase.js";

// 상태 저장
export async function saveMemberState(nickname, state) {

    const snapshot = await get(ref(db, `users/${nickname}`));

    if (!snapshot.exists()) {
        return;
    }

    const user = snapshot.val();
    const point = user.totalP ?? 0;

    // 이미 외출 상태이면 중복 저장하지 않음
    if ((user.state || "") === state) {
        return false;
    }    

    const now = new Date();

    const date =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const time = now.toLocaleTimeString("ko-KR", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    if (state === "외출") {

        await push(
            ref(db, "history"),
            {
                date,
                time,
                nickname,
                joinDate: date,
                dice: 0,
                start: 0,
                end: 0,
                normal: "",
                normalPoint: 0,
                special: "",
                specialPoint: 0,
                event: "",
                eventPoint: 0,
                redeem: "외출",
                redeemPoint: -point,
                tpoint: 0,
                timestamp: Date.now()
            }
        );

        await update(
            ref(db, `users/${nickname}`),
            {
                joinDate: date,
                state: "외출",
                totalP: 0
            }
        );
        return true;
    }

    // 삭제
    if (state === "삭제") {

        // history 가져오기
        const historySnapshot = await get(ref(db, "history"));

        if (historySnapshot.exists()) {

            const history = historySnapshot.val();

            for (const key in history) {

                if (history[key].nickname === nickname) {
                    await remove(ref(db, `history/${key}`));
                }
            }
        }

        // users 삭제
        await remove(ref(db, `users/${nickname}`));

        return true;
    }    

    // 활동
    await update(
        ref(db, `users/${nickname}`),
        {
            state
        }
    );

    return true;
}