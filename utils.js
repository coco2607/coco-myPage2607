// utils.js
export const appVersion = "2.3.0";
export const adminName = "코코";

function koTime(){
    const parts = new Intl.DateTimeFormat("en-US",{
        timeZone:"Asia/Seoul",
        year:"numeric",
        month:"2-digit",
        day:"2-digit",
        hour:"2-digit",
        minute:"2-digit",
        second:"2-digit",
        hour12:false
    }).formatToParts(new Date());

    const result = {};

    for(const part of parts){
        if(part.type !== "literal"){
            result[part.type] = part.value;
        }
    }

    return result;
}

export function koDate(){
    const now = koTime();
    return `${now.year}-${now.month}-${now.day}`;
}

export function koClock(){
    const now = koTime();
    return `${now.hour}:${now.minute}:${now.second}`;
}

export function koDateTime(){
    return `${koDate()} ${koClock()}`;
}

export function trim(text){
    return String(text ?? "").trim();
}

export function createId(){
    if(window.crypto && crypto.randomUUID){
        return crypto.randomUUID();
    }

    return Date.now().toString() +
        Math.random().toString(36).substring(2);
}

export function getDeviceId(){
    let deviceId = localStorage.getItem("deviceId");

    if(!deviceId){
        deviceId = createId();
        localStorage.setItem("deviceId",deviceId);
    }

    return deviceId;
}