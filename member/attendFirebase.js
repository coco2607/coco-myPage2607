// attendFirebase.js

import {
    db,
    ref,
    get,
    set,
    serverTimestamp,
    runTransaction,
    push,
    query,
    orderByChild,
    equalTo
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
        `으차방/member/${nickname}/attend/${monthKey}/check/${date}`
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
        const countRef = ref(
            db,
            `으차방/member/${nickname}/attend/${monthKey}/count`
        );

        const countResult = await runTransaction(
            countRef,
            current => {
                return (Number(current) || 0) + 1;
            }
        );

        const attendanceCount = Number(
            countResult.snapshot.val()
        ) || 0;

        await rewardAttendancePoint(
            nickname,
            monthKey,
            attendanceCount
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

// 출석 보상 자동 지급
async function rewardAttendancePoint(
    nickname,
    monthKey,
    attendanceCount
) {
    let rewardPoint = 0;

    if (attendanceCount === 10) {
        rewardPoint = 1;
    } else if (attendanceCount === 20) {
        rewardPoint = 1;
    } else if (attendanceCount === 30) {
        rewardPoint = 2;
    } else if (
        monthKey.endsWith("-02") &&
        attendanceCount === 28
    ) {
        rewardPoint = 2;
    }

    if (rewardPoint === 0) {
        return;
    }

    const type = `${monthKey.substring(2).replace("-", "")}출석 ${attendanceCount}회`;

    // 이미 지급된 보상인지 확인
    const historyQuery = query(
        ref(db, `으차방/history/${nickname}`),
        orderByChild("type"),
        equalTo(type)
    );

    const historySnapshot = await get(historyQuery);

    if (historySnapshot.exists()) {
        return;
    }

    // 회원 누적 포인트 증가
    const pointRef = ref(
        db,
        `으차방/member/${nickname}/point`
    );

    await runTransaction(
        pointRef,
        current => {
            return (Number(current) || 0) + rewardPoint;
        }
    );

    // 포인트 히스토리 기록
    const historyRef = push(
        ref(db, `으차방/history/${nickname}`)
    );

    await set(
        historyRef,
        {
            getP: rewardPoint,
            type: type
        }
    );
}

// 월별 누적 출석 횟수
export async function loadMonthlyAttendance(
    nickname,
    monthKey
) {
    const snapshot = await get(
        ref(
            db,
            `으차방/member/${nickname}/attend/${monthKey}/count`
        )
    );

    if (!snapshot.exists()) {
        return 0;
    }

    return Number(snapshot.val()) || 0;
}