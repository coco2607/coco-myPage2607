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

    // 오늘 첫 출석 확인
    const checkRef = ref(
        db,
        `으차방/member/${nickname}/attend/${monthKey}/check/${date}`
    );

    const result = await runTransaction(
        checkRef,
        current => {

            // 값이 이미 있으면
            // 오늘 이미 첫 출석 처리가 된 상태
            if (current !== null) {
                return;
            }

            // 오늘 첫 출석
            return true;
        }
    );

    const firstAttendance =
        result.committed &&
        result.snapshot.val() === true;

    // 오늘 첫 출석인 경우에만 월 출석 +1
    if (firstAttendance) {

        const countRef = ref(
            db,
            `으차방/member/${nickname}/attend/${monthKey}/count`
        );

        await runTransaction(
            countRef,
            current => {
                return (
                    (Number(current) || 0) + 1
                );
            }
        );
    }

    return {
        firstAttendance
    };
}

// 출석 카드 결과에 따른 보상 지급
export async function saveAttendanceCardResult(
    nickname,
    date,
    rewardPoint
) {
    const monthKey = date.substring(0, 7);

    const finalReward =
        Number(rewardPoint) > 0
            ? 1
            : 0;

    /*
     * check/date는 출석 여부만 저장한다.
     * 카드 결과로 true를 1 또는 0으로 변경하지 않는다.
     */
    const checkRef = ref(
        db,
        `으차방/member/${nickname}/attend/${monthKey}/check/${date}`
    );

    const checkSnapshot =
        await get(checkRef);

    // 오늘 첫 출석이 정상적으로 완료된 경우에만 카드 보상 처리
    if (
        !checkSnapshot.exists() ||
        checkSnapshot.val() !== true
    ) {
        console.error(
            "출석 카드 보상 처리 불가:",
            {
                nickname,
                date,
                checkValue:
                    checkSnapshot.val()
            }
        );

        return {
            saved: false,
            rewardPoint: 0
        };
    }

    // 꽝이면 포인트 지급 없이 정상 종료
    if (finalReward === 0) {
        return {
            saved: true,
            rewardPoint: 0
        };
    }

    // +1P 지급
    const pointRef = ref(
        db,
        `으차방/member/${nickname}/point`
    );

    await runTransaction(
        pointRef,
        current => {
            return (
                (Number(current) || 0) + 1
            );
        }
    );

    // 히스토리 기록
    const historyRef = push(
        ref(
            db,
            `으차방/history/${nickname}`
        )
    );

    await set(
        historyRef,
        {
            getP: 1,
            type: "출석 게임 당첨"
        }
    );

    return {
        saved: true,
        rewardPoint: 1
    };
}

// 출석 보상 지급
export async function rewardAttendancePoint(
    nickname,
    monthKey,
    attendanceCount,
    date
) {
    let rewardPoint = 0;

    // 일반적인 달
    if (attendanceCount === 10) {
        rewardPoint = 1;
    } else if (attendanceCount === 20) {
        rewardPoint = 1;
    } else if (attendanceCount === 30) {
        rewardPoint = 2;
    }

    // 2월은 28회에 2점
    if (
        monthKey.endsWith("-02") &&
        attendanceCount === 28
    ) {
        rewardPoint = 2;
    }

    if (rewardPoint === 0) {
        return 0;
    }

    // 이미 지급한 보상인지 확인
    const rewardRef = ref(
        db,
        `으차방/member/${nickname}/attend/${monthKey}/reward/${attendanceCount}`
    );

    const rewardResult = await runTransaction(
        rewardRef,
        current => {

            if (current !== null) {
                return;
            }

            return date;
        }
    );

    // 이미 지급된 보상
    if (
        !rewardResult.committed ||
        rewardResult.snapshot.val() !== date
    ) {
        return 0;
    }

    // 누적 포인트 증가
    const pointRef = ref(
        db,
        `으차방/member/${nickname}/point`
    );

    await runTransaction(
        pointRef,
        current => {
            return (
                (Number(current) || 0) +
                rewardPoint
            );
        }
    );

    // 히스토리 기록
    const historyRef = push(
        ref(
            db,
            `으차방/history/${nickname}`
        )
    );

    await set(
        historyRef,
        {
            getP: rewardPoint,
            type:
                `${monthKey.substring(2).replace("-", "")}출석 ${attendanceCount}회`
        }
    );

    return rewardPoint;
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