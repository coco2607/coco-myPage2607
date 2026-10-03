// gameUi.js
const roundMessages = {
    1:"다수를 피하라!",
    2:"본격 눈치게임이다.",
    3:"살아남은 자의 선택!",
    4:"끝까지 몰리지 마라!",
    5:"결국엔 소수가 승리한다."
};

const gameRules = [
    {
        subtitle:"게임 진행",
        text:"매주 토요일부터 금요일까지 총 5라운드로 진행됩니다.<br>토·일·월은 1라운드이며 이후 매일 다음 라운드가 진행됩니다."
    },
    {
        subtitle:"선택 방법",
        text:"매 라운드에서 활성화된 칸 중 하나를 선택하세요.<br>라운드 종료 전까지 선택을 변경할 수 있습니다."
    },
    {
        subtitle:"1~4 라운드",
        text:"가장 많은 사람이 선택한 칸이 탈락합니다.<br>최다 선택이 동률이면 해당 칸이 모두 탈락합니다."
    },
    {
        subtitle:"선택 칸",
        text:"1·2라운드는 A~E를 사용합니다.<br>3라운드는 E, 4·5라운드는 D·E가 비활성화됩니다."
    },
    {
        subtitle:"참가 규칙",
        text:"1라운드에 참여하지 않으면 이후 참여할 수 없습니다.<br>생존했더라도 다음 라운드에 참여하지 않으면 탈락합니다."
    },
    {
        subtitle:"최종 우승",
        text:"1~4라운드 종료 후 생존자가 3명 이하이면 즉시 공동 우승합니다.<br>5라운드는 실제 선택된 칸 중 가장 적게 선택한 칸이 우승합니다.<br>우승자는 +1P를 받습니다."
    }
];

export function createGameUI(){
    const miniGame = document.getElementById("miniGame");

    if(!miniGame){
        return;
    }

    miniGame.innerHTML = `
        <div class="gameTitleRow">
            <button type="button" id="gameRuleOpen" class="gameRuleOpen">?</button>
            <div id="gameTitle" class="gameTitle"></div>
        </div>

        <div class="gameChoiceArea">
            <button type="button" class="gameChoice" data-choice="A">A</button>
            <button type="button" class="gameChoice" data-choice="B">B</button>
            <button type="button" class="gameChoice" data-choice="C">C</button>
            <button type="button" class="gameChoice" data-choice="D">D</button>
            <button type="button" class="gameChoice" data-choice="E">E</button>
            <button type="button" id="gameConfirmBtn">선택</button>
        </div>

        <div class="gameChatWrite">
            <textarea id="gameChatInput" maxlength="100" rows="1" placeholder="실시간 채팅창"></textarea>
            <button type="button" id="gameChatBtn">등록</button>
        </div>

        <div id="gameChatList" class="gameChatList"></div>
    `;

    createGameResultModal();
    createGameRuleModal();

    const ruleOpenBtn = document.getElementById("gameRuleOpen");

    if(ruleOpenBtn){
        ruleOpenBtn.addEventListener("click",() => {
            showGameRulePopup();
        });
    }
}

export function setGameTitle(round){
    const gameTitle = document.getElementById("gameTitle");

    if(!gameTitle){
        return;
    }

    gameTitle.textContent = `Round ${round} : ${roundMessages[round] || ""}`;
}

export function bindGameChoiceEvents(onChoice,onConfirm){
    const choiceButtons = document.querySelectorAll(".gameChoice");
    const confirmBtn = document.getElementById("gameConfirmBtn");

    choiceButtons.forEach(button => {
        button.addEventListener("click",() => {
            onChoice(button.dataset.choice);
        });
    });

    if(confirmBtn){
        confirmBtn.addEventListener("click",onConfirm);
    }
}

export function renderChoiceState(selectedChoice,enabled,activeChoices = []){
    const choiceButtons = document.querySelectorAll(".gameChoice");
    const confirmBtn = document.getElementById("gameConfirmBtn");

    choiceButtons.forEach(button => {
        const choice = button.dataset.choice;
        const active = activeChoices.includes(choice);

        button.classList.toggle("selected",choice === selectedChoice);
        button.disabled = !enabled || !active;
    });

    if(confirmBtn){
        confirmBtn.disabled = !enabled || !activeChoices.includes(selectedChoice);
    }
}

export function updateGameTop({
    currentRound,
    memberGame,
    selectedChoice = "",
    eliminationRound = null,
    gameEnd = null
}){
    const gameContent = document.getElementById("gameContent");
    const pointLabel = document.getElementById("pointLabel");
    const totalPoint = document.getElementById("totalPoint");

    if(!gameContent || !pointLabel || !totalPoint || gameContent.classList.contains("hidden")){
        return;
    }

    if(gameEnd){
        pointLabel.textContent = `Round ${gameEnd.round}`;
        totalPoint.textContent = gameEnd.winners ? "게임 종료" : "우승자 없음";
        return;
    }

    if(!memberGame){
        pointLabel.textContent = `Round ${currentRound}`;
        totalPoint.textContent = currentRound === 1 ? "선택 대기" : "미참가";
        return;
    }

    if(memberGame.alive === false){
        if(currentRound === 1 && !memberGame.result1){
            pointLabel.textContent = "Round 1";
            totalPoint.textContent = "선택 대기";
            return;
        }

        pointLabel.textContent = `Round ${eliminationRound || currentRound}`;
        totalPoint.textContent = "탈락";
        return;
    }

    if(selectedChoice){
        pointLabel.textContent = `R${currentRound} 선택`;
        totalPoint.textContent = selectedChoice;
        return;
    }

    pointLabel.textContent = `Round ${currentRound}`;
    totalPoint.textContent = "선택 대기";
}

export function showGameResultPopup(message){
    return new Promise(resolve => {
        const modal = document.getElementById("gameResultModal");
        const messageElement = document.getElementById("gameResultMessage");
        const okBtn = document.getElementById("gameResultOk");

        if(!modal || !messageElement || !okBtn){
            resolve();
            return;
        }

        messageElement.innerHTML = message;
        modal.classList.remove("hidden");

        okBtn.onclick = () => {
            modal.classList.add("hidden");
            resolve();
        };
    });
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

        function showRule(){
            const rule = gameRules[index];

            step.textContent = `${index + 1} / ${gameRules.length}`;
            subtitle.textContent = rule.subtitle;
            text.innerHTML = rule.text;
            prevBtn.disabled = index === 0;

            if(index === gameRules.length - 1){
                nextBtn.classList.add("hidden");
                startBtn.classList.remove("hidden");
            }else{
                nextBtn.classList.remove("hidden");
                startBtn.classList.add("hidden");
            }
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

        startBtn.onclick = () => {
            modal.classList.add("hidden");
            resolve();
        };

        closeBtn.onclick = () => {
            modal.classList.add("hidden");
            resolve();
        };

        showRule();
        modal.classList.remove("hidden");
    });
}

function createGameRuleModal(){
    if(document.getElementById("gameRuleModal")){
        return;
    }

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

function createGameResultModal(){
    if(document.getElementById("gameResultModal")){
        return;
    }

    const modal = document.createElement("div");
    modal.id = "gameResultModal";
    modal.className = "modal hidden";

    modal.innerHTML = `
        <div class="modalBox gameResultBox">
            <p id="gameResultMessage"></p>
            <div class="modalButton">
                <button type="button" id="gameResultOk">확인</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}