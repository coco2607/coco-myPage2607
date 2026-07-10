// utils.js

// 숫자 두 자리
export function pad(value) {
    return String(value).padStart(2, "0");
}

// 현재 날짜
export function getCurrentDate() {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// 현재 시간
export function getCurrentTime() {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// 날짜 + 시간
export function getCurrentDateTime() {
    return `${getCurrentDate()} ${getCurrentTime()}`;
}

// 공백 제거
export function trim(text) {
    return String(text).trim();
}

// UUID 생성
export function createId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now().toString() +
        Math.random().toString(36).substring(2);
}