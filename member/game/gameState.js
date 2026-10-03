// gameState.js
export function getGameKey(date){
    const target = parseDate(date);
    const day = target.getUTCDay();
    const diff = day === 6 ? 0 : day + 1;

    target.setUTCDate(
        target.getUTCDate() - diff
    );

    return formatDate(target);
}

export function getPreviousGameKey(gameKey){
    const target = parseDate(gameKey);

    target.setUTCDate(
        target.getUTCDate() - 7
    );

    return formatDate(target);
}

export function getCurrentRound(date){
    const target = parseDate(date);
    const day = target.getUTCDay();

    if(day === 6 || day === 0 || day === 1){
        return 1;
    }

    if(day === 2){
        return 2;
    }

    if(day === 3){
        return 3;
    }

    if(day === 4){
        return 4;
    }

    return 5;
}

export function isRoundDay(date,round){
    return getCurrentRound(date) === Number(round);
}

export function getRoundLabel(round){
    return `Round ${Number(round)}`;
}

function parseDate(date){
    const [year,month,day] = String(date)
        .split("-")
        .map(Number);

    return new Date(
        Date.UTC(year,month - 1,day)
    );
}

function formatDate(date){
    const year = date.getUTCFullYear();
    const month = String(
        date.getUTCMonth() + 1
    ).padStart(2,"0");
    const day = String(
        date.getUTCDate()
    ).padStart(2,"0");

    return `${year}-${month}-${day}`;
}