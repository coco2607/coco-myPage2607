// loginFirebase.js

import {
    db,
    ref,
    get,
    set,
    update,
    onDisconnect,
    runTransaction
} from "../firebase.js";

import { trim, createId } from "../utils.js";

const USERS = "users";
const myConnectionId = createId();
let myNickname = "";


// 로그인
export async function login(nickname, password) {

    nickname = trim(nickname);
    password = trim(password);

    if (nickname.length < 2) {
        throw new Error("닉네임 2자를 입력하세요.");
    }

    if (password === "") {
        throw new Error("비밀번호를 입력해주세요.");
    }

    const ok = await checkMemberPassword(nickname, password);

    if (!ok) {
        throw new Error("닉네임 또는 비밀번호가 올바르지 않습니다.");
    }

    await joinUser(nickname);

    return true;
}


// 회원 확인 및 비밀번호 확인
async function checkMemberPassword(nickname, password) {

    const userRef = ref(db, `${USERS}/${nickname}`);
    const snapshot = await get(userRef);

    // 회원이 없으면
    if (!snapshot.exists()) {

        // 초기 비밀번호는 1234만 허용
        if (password !== "1234") {
            return false;
        }

        // 자동 회원 생성
        await set(userRef, {
            memberPw: "1234"
        });

        return true;
    }

    // 회원이 있으면 비밀번호 확인
    const data = snapshot.val();

    // memberPw가 없으면 최초 로그인으로 간주하고 생성
    if (!data.memberPw) {

        await update(userRef, {
            memberPw: password
        });

        return true;
    }

    // memberPw가 있으면 비교
    return data.memberPw === password;
}


// 닉네임 중복 확인
async function joinUser(nickname) {

    myNickname = nickname;

    const nicknameRef = ref(db, `nicknames/${nickname}`);

    const result = await runTransaction(
        nicknameRef,
        current => {

            if (current === null) {
                return myConnectionId;
            }

            return;

        }
    );

    if (!result.committed) {
        throw new Error("이미 사용 중인 닉네임입니다.");
    }

    onDisconnect(nicknameRef).remove();

}