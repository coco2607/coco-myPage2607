import {
    db,
    ref,
    get,
    set,
    update,
    remove
} from "../firebase.js";

export async function changeNickname(oldNickname, newNickname) {

    // 기존 회원 읽기
    const userRef = ref(db, `users/${oldNickname}`);
    const userSnap = await get(userRef);

    if (!userSnap.exists()) {
        throw new Error("회원이 존재하지 않습니다.");
    }

    const userData = userSnap.val();

    // 새 닉네임으로 저장
    await set(
        ref(db, `users/${newNickname}`),
        userData
    );

    // history 수정
    const historyRef = ref(db, "history");
    const historySnap = await get(historyRef);

    if (historySnap.exists()) {

        const history = historySnap.val();
        const updates = {};

        Object.entries(history).forEach(([key, value]) => {

            if (value.nickname === oldNickname) {

                updates[`${key}/nickname`] = newNickname;

            }

        });

        if (Object.keys(updates).length > 0) {
            await update(historyRef, updates);
        }
    }

    // 기존 회원 삭제
    await remove(userRef);

}