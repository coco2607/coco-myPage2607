// point/adpointFirebase.js
import {
    db,
    ref,
    get,
    update,
    push,
    set
} from "../../firebase.js";

const MEMBER = "으차방/member";
const HISTORY = "으차방/history";

export async function applyPoint(mode,pointData){
    for(const item of pointData){
        const memberRef = ref(
            db,
            `${MEMBER}/${item.nickname}`
        );

        const snapshot = await get(memberRef);
        const member = snapshot.exists()
            ? snapshot.val()
            : {};

        const currentPoint = Number(member.point) || 0;
        const point = Number(item.point) || 0;

        if(point <= 0){
            continue;
        }

        const totalPoint = mode === "plus"
            ? currentPoint + point
            : currentPoint - point;

        const now = Date.now();

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

        const history = {
            type:item.event
        };

        if(mode === "plus"){
            history.getP = point;
        }else{
            history.useP = point;
        }

        await set(
            historyRef,
            history
        );
    }

    return true;
}