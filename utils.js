// utils.js

// 푸터 버전
export function getVersion() {
    return "2.0.0";
}

// 숫자 두 자리
export function pad(value) {
    return String(value).padStart(2, "0");
}

// 현재 한국 시간의 구성값
function getKoreaParts() {
    const parts = new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    ).formatToParts(new Date());

    const result = {};

    for (const part of parts) {
        if (part.type !== "literal") {
            result[part.type] = part.value;
        }
    }

    return result;
}

// 현재 한국 날짜
export function getCurrentDate() {
    const now = getKoreaParts();

    return `${now.year}-${now.month}-${now.day}`;
}

// 현재 한국 시간
export function getCurrentTime() {
    const now = getKoreaParts();

    return `${now.hour}:${now.minute}:${now.second}`;
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