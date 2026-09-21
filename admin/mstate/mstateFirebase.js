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
const DEVICE = "으차방/deviceId";

export async function saveMemberState(nickname,state){
    const memberRef = ref(db, `${MEMBER}/${nickname}`);
    const snapshot = await get(memberRef);

    if(!snapshot.exists()){
        return false;
    }

    const member = snapshot.val();
    const point = Number(member.point) || 0;

    if((member.state || "") === state){
        return false;
    }

    const lastUpdate = Date.now();

    if(state === "외출"){
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
            lastUpdate:lastUpdate
        });

        return true;
    }

    if(state === "삭제"){
        const deviceSnapshot = await get(ref(db, DEVICE));
        const updates = {
            [`${MEMBER}/${nickname}`]:null,
            [`${HISTORY}/${nickname}`]:null
        };

        if(deviceSnapshot.exists()){
            deviceSnapshot.forEach(child => {
                const data = child.val();

                if(data?.nickname === nickname){
                    updates[`${DEVICE}/${child.key}`] = null;
                }
            });
        }

        await update(ref(db),updates);
        return true;
    }

    await update(memberRef,{
        state:state,
        lastUpdate:lastUpdate
    });

    return true;
}