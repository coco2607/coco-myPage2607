// attendFirebase.js

import {
    db,
    ref,
    get,
    set,
    serverTimestamp,
    runTransaction,
    push
} from "../firebase.js";

// 오늘 출석 조회
export async function loadTodayAttendance(date) {
    const snapshot = await get(
        ref(db, `으차방/attend/${date}`)
    );

    if (!snapshot.exists()) {
        return [];
    }

    const list = [];

    snapshot.forEach(child => {
        const data = child.val();

        if (!data || typeof data !== "object") {
            return;
        }

        list.push({
            key: child.key,
            nickname: data.nickname ?? "",
            comment: data.comment ?? "",
            time: data.time ?? 0
        });
    });

    return list;
}

// 오늘 출석 등록
export async function saveTodayAttendance(
    nickname,
    date,
    comment
) {
    const monthKey = date.substring(0, 7);
    const checkRef = ref(
        db,
        `으차방/member/${nickname}/attend/check/${date}`
    );

    const result = await runTransaction(
        checkRef,
        current => {
            if (current === true) {
                return;
            }

            return true;
        }
    );

    // 오늘 첫 출석인 경우에만 월 출석 +1
    if (result.committed && result.snapshot.val() === true) {
        const monthRef = ref(
            db,
            `으차방/member/${nickname}/attend/${monthKey}`
        );

        await runTransaction(
            monthRef,
            current => {
                const count = Number(current) || 0;
                return count + 1;
            }
        );
    }

    // 댓글은 매번 별도 기록
    const attendanceRef = push(
        ref(db, `으차방/attend/${date}`)
    );

    await set(
        attendanceRef,
        {
            nickname: nickname,
            comment: comment,
            time: serverTimestamp()
        }
    );

    return true;
}

// 월별 누적 출석 횟수
export async function loadMonthlyAttendance(
    nickname,
    monthKey
) {
    const snapshot = await get(
        ref(
            db,
            `으차방/member/${nickname}/attend/${monthKey}`
        )
    );

    if (!snapshot.exists()) {
        return 0;
    }

    return Number(snapshot.val()) || 0;
}