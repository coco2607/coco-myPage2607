// adpointFirebase.js

import {
    db,
    ref,
    get,
    update,
    push,
    set
} from "../firebase.js";

import {
    getCurrentDate,
    getCurrentTime
} from "../utils.js";

// ===========================
// 포인트 적용
// ===========================
export async function applyPoint(mode, pointData) {

    for (const item of pointData) {

        // ===========================
        // 유저 조회
        // ===========================
        const userRef = ref(db, `users/${item.nickname}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            console.warn(`${item.nickname} 유저 없음`);
            continue;
        }

        const user = snapshot.val();

        const currentPoint = Number(user.totalP || 0);

        const changePoint =
            mode === "plus"
                ? item.point
                : -item.point;

        // 포인트 부족
        if (mode === "minus" && currentPoint < item.point) {
            throw new Error(`${item.nickname}님의 포인트가 부족합니다.`);
        }

        const totalPoint = currentPoint + changePoint;

        // ===========================
        // totalP 업데이트
        // ===========================
        await update(userRef, {
            totalP: totalPoint
        });

        // ===========================
        // history 저장
        // ===========================
        const historyRef = push(ref(db, "history"));

        await set(historyRef, {

            date: getCurrentDate(),
            time: getCurrentTime(),

            nickname: item.nickname,
            joinDate: getCurrentDate(),

            dice: 0,

            normal: "",
            normalPoint: 0,

            special: "",
            specialPoint: 0,

            event: item.event,
            eventPoint: changePoint,

            redeem: "",
            redeemPoint: 0,

            tpoint: totalPoint,

            timestamp: Date.now()

        });

    }

}