// mstateFirebase.js
import {
    db,
    ref,
    get,
    push,
    update
} from "../../firebase.js";
import {
    koDate,
    koClock
} from "../../utils.js";

const MEMBER = "으차방/member";
const HISTORY = "으차방/history";

export async function saveMemberState(
    nickname,
    state,
    returnDate = ""
){
    const memberRef = ref(db, `${MEMBER}/${nickname}`);
    const snapshot = await get(memberRef);

    if(!snapshot.exists()){
        return false;
    }

    const member = snapshot.val();
    const currentState = member.state || "활동";
    const point = Number(member.point) || 0;

    if(currentState === state){
        return false;
    }

    const lastUpdate = Date.now();

    if(state === "외출"){
        if(!returnDate){
            throw new Error("복귀일이 없습니다.");
        }

        await push(
            ref(db, `${HISTORY}/${nickname}`),
            {
                date:koDate(),
                time:koClock(),
                joinDate:koDate(),
                type:"외출",
                getP:0,
                useP:point
            }
        );

        await update(memberRef,{
            state:"외출",
            point:0,
            returnDate:returnDate,
            lastUpdate:lastUpdate
        });

        return true;
    }

    if(state === "활동"){
        await update(memberRef,{
            state:"활동",
            returnDate:null,
            lastUpdate:lastUpdate
        });

        return true;
    }

    return false;
}