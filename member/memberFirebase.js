// memberFirebase.js
import {
    db,
    ref,
    get,
    update
} from "../firebase.js";

export async function loadUser(nickname){
    const snapshot = await get(
        ref(db, `으차방/member/${nickname}`)
    );

    if(!snapshot.exists()){
        return null;
    }

    const data = snapshot.val();

    return {
        totalP:data.point !== undefined && data.point !== ""
            ? Number(data.point)
            : 0,
        last:data.lastPosition !== undefined
            ? Number(data.lastPosition)
            : 0,
        memberPw:data.memberPw ?? "",
        state:data.state ?? ""
    };
}

export async function loadHistory(nickname){
    const snapshot = await get(
        ref(db, `으차방/history/${nickname}`)
    );

    if(!snapshot.exists()){
        return [];
    }

    const list = [];

    snapshot.forEach(child => {
        list.push({
            key:child.key,
            ...child.val()
        });
    });

    return list;
}

export async function loadAdminInfo(){
    const snapshot = await get(
        ref(db, "으차방/admin")
    );

    if(!snapshot.exists()){
        return {
            admin:"",
            staff:""
        };
    }

    const data = snapshot.val();

    return {
        admin:data.admin ?? "",
        staff:data.staff ?? ""
    };
}

export async function updateMemberPassword(nickname,newPassword){
    await update(
        ref(db, `으차방/member/${nickname}`),
        {
            memberPw:newPassword
        }
    );
}