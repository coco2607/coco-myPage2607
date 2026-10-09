 // gameState.js
import {koDate} from "../../utils.js";

export function getGameKey(date = koDate()){
    const target = parseDate(date);
    if(!target) return "";

    const day = target.getUTCDay();
    const diff = day === 6 ? 0 : day + 1;

    target.setUTCDate(target.getUTCDate() - diff);
    return formatDate(target);
}

export function getPreviousGameKey(gameKey){
    const target = parseDate(gameKey);
    if(!target) return "";

    target.setUTCDate(target.getUTCDate() - 7);
    return formatDate(target);
}

export function getCurrentRound(date = koDate()){
    const target = parseDate(date);
    if(!target) return 0;

    const day = target.getUTCDay();

    if(day === 6 || day === 0 || day === 1) return 1;
    if(day === 2) return 2;
    if(day === 3) return 3;
    if(day === 4) return 4;
    return 5;
}

export function isRoundDay(date = koDate(),round){
    return getCurrentRound(date) === Number(round);
}

export function getRoundLabel(round){
    return `Round ${Number(round)}`;
}

export function isRoundClosed(gameKey,round,date = new Date()){
    round = Number(round);
    if(!Number.isInteger(round) || round < 1 || round > 5) return false;

    const start = parseDate(gameKey);
    if(!start || start.getUTCDay() !== 6) return false;

    const closeDay = round === 1 ? 3 : round + 2;
    const closeTime = start.getTime() + closeDay * 86400000 - 9 * 3600000;
    const now = date instanceof Date ? date : new Date(date);

    return !Number.isNaN(now.getTime()) && now.getTime() >= closeTime;
}

function parseDate(date){
    const value = String(date);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

    const [year,month,day] = value.split("-").map(Number);
    const target = new Date(Date.UTC(year,month - 1,day));

    if(target.getUTCFullYear() !== year) return null;
    if(target.getUTCMonth() !== month - 1) return null;
    if(target.getUTCDate() !== day) return null;

    return target;
}

function formatDate(date){
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2,"0");
    const day = String(date.getUTCDate()).padStart(2,"0");

    return `${year}-${month}-${day}`;
}
