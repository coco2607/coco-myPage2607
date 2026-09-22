// adminLoginFirebase.js
import {
    db,
    ref,
    get
} from "../firebase.js";

export async function getAdminPasswords(){
    const snapshot = await get(ref(db, "으차방/admin"));
    if(!snapshot.exists()){
        return null;
    }
    const data = snapshot.val();
    return {
        adminPw:data.adminPw,
        staffPw:data.staffPw
    };
}