 // gamePopup.js
const gameRules = [
    {
        subtitle:"게임 진행",
        text:"매주 총 5라운드로 진행됩니다.<br>토~월은 1라운드로 진행되며,<br>이후 매일 다음 라운드가 진행됩니다."
    },
    {
        subtitle:"참가 방법",
        text:"A~E 중 하나를 선택하세요.<br>(선택을 변경할 수 있습니다.)"
    },
    {
        subtitle:"1~4 라운드",
        text:"가장 많이 선택된 칸이 탈락합니다.<br>(동률 칸일 경우 모두 탈락)"
    },
    {
        subtitle:"5 라운드",
        text:"가장 적게 선택된 칸이 우승합니다.<br>(모든 칸이 동률 일 경우 우승자 없음)"
    },    {
        subtitle:"참가 규칙1",
        text:"1라운드에 미참여 시<br>해당 주에는 참여할 수 없습니다."
    },
    {
        subtitle:"참가 규칙2",
        text:"이전 라운드에서 생존했더라도<br>다음 라운드에 미참여 시 탈락합니다."
    },
    {
        subtitle:"최종 우승",
        text:"5라운드 종료까지 최종 생존 또는<br>각 라운드에서 생존자 3명 이하일 경우<br>게임종료!<br>생존자는 1P를 획득합니다."
    }
];

export function createGamePopup(){
    createGameRuleModal();
    createGamePlayerModal();
}

export function showGameRulePopup(){
    return new Promise(resolve => {
        const modal = document.getElementById("gameRuleModal");
        const step = document.getElementById("gameRuleStep");
        const subtitle = document.getElementById("gameRuleSubtitle");
        const text = document.getElementById("gameRuleText");
        const prevBtn = document.getElementById("gameRulePrev");
        const nextBtn = document.getElementById("gameRuleNext");
        const startBtn = document.getElementById("gameRuleStart");
        const closeBtn = document.getElementById("gameRuleClose");

        if(!modal || !step || !subtitle || !text || !prevBtn || !nextBtn || !startBtn || !closeBtn){
            resolve();
            return;
        }

        let index = 0;

        function close(){
            modal.classList.add("hidden");
            resolve();
        }

        function showRule(){
            const rule = gameRules[index];

            step.textContent = `${index + 1} / ${gameRules.length}`;
            subtitle.textContent = rule.subtitle;
            text.innerHTML = rule.text;
            prevBtn.disabled = index === 0;

            nextBtn.classList.toggle("hidden",index === gameRules.length - 1);
            startBtn.classList.toggle("hidden",index !== gameRules.length - 1);
        }

        prevBtn.onclick = () => {
            if(index > 0){
                index--;
                showRule();
            }
        };

        nextBtn.onclick = () => {
            if(index < gameRules.length - 1){
                index++;
                showRule();
            }
        };

        startBtn.onclick = close;
        closeBtn.onclick = close;

        showRule();
        modal.classList.remove("hidden");
    });
}

export function showGamePlayerPopup(players,title = "생존자 목록"){
    const modal = document.getElementById("gamePlayerModal");
    const heading = modal?.querySelector("h2");
    const list = document.getElementById("gamePlayerList");
    const closeBtn = document.getElementById("gamePlayerClose");

    if(!modal || !list || !closeBtn) return;

    if(heading) heading.textContent = title;

    const nicknames = Object.keys(players || {}).sort((a,b) => {
        return a.localeCompare(b,"ko");
    });

    list.replaceChildren();

    if(nicknames.length === 0){
        const empty = document.createElement("div");
        empty.className = "gamePlayerEmpty";
        empty.textContent = title === "우승자 없음"
            ? "우승자가 없습니다."
            : "표시할 생존자가 없습니다.";
        list.appendChild(empty);
    }else{
        nicknames.forEach(nickname => {
            const item = document.createElement("div");
            item.className = "gamePlayerItem";
            item.textContent = nickname;
            list.appendChild(item);
        });
    }

    closeBtn.onclick = () => {
        modal.classList.add("hidden");
    };

    modal.classList.remove("hidden");
}

function createGameRuleModal(){
    if(document.getElementById("gameRuleModal")) return;

    const modal = document.createElement("div");
    modal.id = "gameRuleModal";
    modal.className = "modal hidden";

    modal.innerHTML = `
        <div class="modalBox gameRuleBox">
            <button type="button" id="gameRuleClose" class="gameRuleClose">×</button>
            <div id="gameRuleStep" class="gameRuleStep"></div>
            <h2>주간 미니 게임 설명서</h2>
            <div id="gameRuleSubtitle" class="gameRuleSubtitle"></div>
            <div id="gameRuleText" class="gameRuleText"></div>
            <div class="gameRuleNav">
                <button type="button" id="gameRulePrev">&lt;</button>
                <button type="button" id="gameRuleNext">&gt;</button>
                <button type="button" id="gameRuleStart" class="hidden">게임 시작</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function createGamePlayerModal(){
    if(document.getElementById("gamePlayerModal")) return;

    const modal = document.createElement("div");
    modal.id = "gamePlayerModal";
    modal.className = "modal hidden";

    modal.innerHTML = `
        <div class="modalBox gamePlayerBox">
            <button type="button" id="gamePlayerClose" class="gameResultClose">×</button>
            <h2>생존자 목록</h2>
            <div id="gamePlayerList" class="gamePlayerList"></div>
        </div>
    `;

    document.body.appendChild(modal);
}
