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

const MEMBER = "으차방/member";
const HISTORY = "으차방/history";
const ATTEND = "으차방/attend";

export async function loadTodayAttendance(date){
    const snapshot = await get(ref(db, `${ATTEND}/${date}`));
    if(!snapshot.exists()){
        return [];
    }
    const list = [];
    snapshot.forEach(child => {
        const data = child.val();
        if(!data || typeof data !== "object"){
            return;
        }
        list.push({
            key:child.key,
            nickname:data.nickname ?? "",
            comment:data.comment ?? "",
            time:data.time ?? 0
        });
    });
    return list;
}

export async function saveTodayAttendance(nickname,date,comment){
    const monthKey = date.substring(0,7);
    const attendanceRef = push(ref(db, `${ATTEND}/${date}`));
    await set(attendanceRef,{
        nickname:nickname,
        comment:comment,
        time:serverTimestamp()
    });

    const checkRef = ref(
        db,
        `${MEMBER}/${nickname}/attend/${monthKey}/check/${date}`
    );

    const result = await runTransaction(checkRef,current => {
        if(current !== null){
            return;
        }
        return true;
    });

    const firstAttendance =
        result.committed &&
        result.snapshot.val() === true;

    if(firstAttendance){
        const countRef = ref(
            db,
            `${MEMBER}/${nickname}/attend/${monthKey}/count`
        );

        await runTransaction(countRef,current => {
            return (Number(current) || 0) + 1;
        });

        await set(
            ref(db, `${MEMBER}/${nickname}/lastUpdate`),
            serverTimestamp()
        );
    }

    return {
        firstAttendance
    };
}

export async function saveAttendanceCardResult(
    nickname,
    date,
    rewardPoint
){
    const monthKey = date.substring(0,7);
    const finalReward = Number(rewardPoint) > 0 ? 1 : 0;
    const checkRef = ref(
        db,
        `${MEMBER}/${nickname}/attend/${monthKey}/check/${date}`
    );

    const checkSnapshot = await get(checkRef);

    if(
        !checkSnapshot.exists() ||
        checkSnapshot.val() !== true
    ){
        console.error("출석 카드 보상 처리 불가:",{
            nickname,
            date,
            checkValue:checkSnapshot.val()
        });

        return {
            saved:false,
            rewardPoint:0
        };
    }

    if(finalReward === 0){
        return {
            saved:true,
            rewardPoint:0
        };
    }

    const pointRef = ref(
        db,
        `${MEMBER}/${nickname}/point`
    );

    await runTransaction(pointRef,current => {
        return (Number(current) || 0) + 1;
    });

    const historyRef = push(
        ref(db, `${HISTORY}/${nickname}`)
    );

    await set(historyRef,{
        getP:1,
        type:"출석 게임 당첨"
    });

    return {
        saved:true,
        rewardPoint:1
    };
}

export async function rewardAttendancePoint(
    nickname,
    monthKey,
    attendanceCount,
    date
){
    let rewardPoint = 0;

    if(attendanceCount === 10){
        rewardPoint = 1;
    }else if(attendanceCount === 20){
        rewardPoint = 1;
    }else if(attendanceCount === 30){
        rewardPoint = 2;
    }

    if(
        monthKey.endsWith("-02") &&
        attendanceCount === 28
    ){
        rewardPoint = 2;
    }

    if(rewardPoint === 0){
        return 0;
    }

    const rewardRef = ref(
        db,
        `${MEMBER}/${nickname}/attend/${monthKey}/reward/${attendanceCount}`
    );

    const rewardResult = await runTransaction(
        rewardRef,
        current => {
            if(current !== null){
                return;
            }
            return date;
        }
    );

    if(
        !rewardResult.committed ||
        rewardResult.snapshot.val() !== date
    ){
        return 0;
    }

    const pointRef = ref(
        db,
        `${MEMBER}/${nickname}/point`
    );

    await runTransaction(pointRef,current => {
        return (Number(current) || 0) + rewardPoint;
    });

    const historyRef = push(
        ref(db, `${HISTORY}/${nickname}`)
    );

    await set(historyRef,{
        getP:rewardPoint,
        type:`${monthKey.substring(2).replace("-","")}출석 ${attendanceCount}회`
    });

    return rewardPoint;
}

export async function loadMonthlyAttendance(
    nickname,
    monthKey
){
    const snapshot = await get(
        ref(
            db,
            `${MEMBER}/${nickname}/attend/${monthKey}/count`
        )
    );

    if(!snapshot.exists()){
        return 0;
    }

    return Number(snapshot.val()) || 0;
}