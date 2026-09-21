// adpointFirebase.js

import {
    db,
    ref,
    get,
    update,
    push,
    set
} from "../../firebase.js";

import {
    koDate,
    koClock
} from "../../utils.js";

const MEMBER = "으차방/member";
const HISTORY = "으차방/history";

export async function applyPoint(mode,pointData){
    for(const item of pointData){
        const memberRef = ref(
            db,
            `${MEMBER}/${item.nickname}`
        );

        const snapshot = await get(memberRef);

        if(!snapshot.exists()){
            console.warn(`${item.nickname} 회원 없음`);
            continue;
        }

        const member = snapshot.val();
        const currentPoint = Number(member.point) || 0;
        const point = Number(item.point) || 0;

        if(point <= 0){
            continue;
        }

        if(
            mode === "minus" &&
            currentPoint < point
        ){
            throw new Error(
                `${item.nickname}님의 포인트가 부족합니다.`
            );
        }

        const changePoint =
            mode === "plus"
                ? point
                : -point;

        const totalPoint =
            currentPoint + changePoint;

        const now = Date.now();
        const date = koDate();
        const time = koClock();

        await update(
            memberRef,
            {
                point:totalPoint,
                lastUpdate:now
            }
        );

        const historyRef = push(
            ref(
                db,
                `${HISTORY}/${item.nickname}`
            )
        );

        await set(
            historyRef,
            {
                date:date,
                time:time,
                joinDate:date,
                type:item.event || (
                    mode === "plus"
                        ? "포인트 적립"
                        : "포인트 사용"
                ),
                getP:mode === "plus"
                    ? point
                    : 0,
                useP:mode === "minus"
                    ? point
                    : 0,
                tpoint:totalPoint,
                timestamp:now
            }
        );
    }

    return true;
}