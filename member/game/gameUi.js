// gameUi.js
const roundMessages = {
    1:"첫 선택, 다수를 피하라!(~6일)",
    2:"본격 눈치게임이다.(~12일)",
    3:"살아남은 자의 선택!(~18일)",
    4:"끝까지 몰리지 마라!(~24일)",
    5:"최종 선택, 결국엔 소수가 승리한다.(~말일)"
};

const gameRules = [
    {
        subtitle:"게임 진행",
        text:"총 5라운드로 진행됩니다.<br>매 라운드마다 A~E 중 하나를 선택하세요.<br>(선택은 변경할 수 있습니다.)"
    },
    {
        subtitle:"1~4 라운드",
        text:"가장 많은 사람이 선택한 칸이 탈락합니다.<br>다른 사람의 선택을 예상해 생존하세요."
    },
    {
        subtitle:"5 라운드",
        text:"마지막 라운드는 규칙이 반대입니다.<br>가장 적게 선택한 칸이 최종 우승합니다."
    },
    {
        subtitle:"참가 규칙1",
        text:"1라운드에 참여하지 않으면<br>중간 라운드부터 참여할 수 없습니다."
    },
    {
        subtitle:"참가 규칙2",
        text:"다음 라운드에 진출했더라도<br>기한 내 미참여 시 탈락합니다."
    },
    {
        subtitle:"최종 보상",
        text:"5라운드까지 생존하여<br>최종 우승 시 +1P를 지급합니다."
    }
];

export function createGameUI(){
    const miniGame = document.getElementById("miniGame");
    if(!miniGame){
        return;
    }

    miniGame.innerHTML = `
        <div id="gameTitle" class="gameTitle"></div>

        <div class="gameChoiceArea">
            <button type="button" class="gameChoice" data-choice="A">A</button>
            <button type="button" class="gameChoice" data-choice="B">B</button>
            <button type="button" class="gameChoice" data-choice="C">C</button>
            <button type="button" class="gameChoice" data-choice="D">D</button>
            <button type="button" class="gameChoice" data-choice="E">E</button>
            <button type="button" id="gameConfirmBtn">선택</button>
        </div>

        <div class="gameChatWrite">
            <textarea id="gameChatInput" maxlength="100" rows="1" placeholder="댓글을 남겨주세요."></textarea>
            <button type="button" id="gameChatBtn">등록</button>
        </div>

        <div id="gameChatList" class="gameChatList"></div>
    `;

    createGameResultModal();
    createGameRuleModal();
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
            <div id="gameRuleStep" class="gameRuleStep"></div>
            <h2>월간 미니 게임 설명서</h2>
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

export function showGameRulePopup(){
    return new Promise(resolve => {
        const modal = document.getElementById("gameRuleModal");
        const step = document.getElementById("gameRuleStep");
        const subtitle = document.getElementById("gameRuleSubtitle");
        const text = document.getElementById("gameRuleText");
        const prevBtn = document.getElementById("gameRulePrev");
        const nextBtn = document.getElementById("gameRuleNext");
        const startBtn = document.getElementById("gameRuleStart");

        if(!modal || !step || !subtitle || !text || !prevBtn || !nextBtn || !startBtn){
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

        showRule();
        modal.classList.remove("hidden");
    });
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

export function renderChoiceState(selectedChoice,enabled){
    const choiceButtons = document.querySelectorAll(".gameChoice");
    const confirmBtn = document.getElementById("gameConfirmBtn");

    choiceButtons.forEach(button => {
        button.classList.toggle("selected",button.dataset.choice === selectedChoice);
        button.disabled = !enabled;
    });

    if(confirmBtn){
        confirmBtn.disabled = !enabled || selectedChoice === "";
    }
}

export function updateGameTop({
    currentRound,
    memberGame,
    eliminationRound
}){
    const gameContent = document.getElementById("gameContent");
    const pointLabel = document.getElementById("pointLabel");
    const totalPoint = document.getElementById("totalPoint");

    if(!gameContent || !pointLabel || !totalPoint || gameContent.classList.contains("hidden")){
        return;
    }

    if(!memberGame){
        if(currentRound === 1){
            pointLabel.textContent = "Round 1";
            totalPoint.textContent = "선택 대기";
        }else{
            pointLabel.textContent = `Round ${currentRound}`;
            totalPoint.textContent = "미참가";
        }
        return;
    }

    if(memberGame.alive === false){
        pointLabel.textContent = `Round ${eliminationRound || memberGame.round || 1}`;
        totalPoint.textContent = "탈락";
        return;
    }

    const choice = memberGame[`r${currentRound}`];

    if(choice){
        pointLabel.textContent = `R${currentRound} 선택`;
        totalPoint.textContent = choice;
        return;
    }

    pointLabel.textContent = `Round ${currentRound}`;
    totalPoint.textContent = "선택 대기";
}

export function showGameResultPopup(title,message){
    return new Promise(resolve => {
        const modal = document.getElementById("gameResultModal");
        const titleElement = document.getElementById("gameResultTitle");
        const messageElement = document.getElementById("gameResultMessage");
        const okBtn = document.getElementById("gameResultOk");

        if(!modal || !titleElement || !messageElement || !okBtn){
            resolve();
            return;
        }

        titleElement.textContent = title;
        messageElement.textContent = message;
        modal.classList.remove("hidden");

        okBtn.onclick = () => {
            modal.classList.add("hidden");
            resolve();
        };
    });
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
            <h2 id="gameResultTitle"></h2>
            <p id="gameResultMessage"></p>
            <div class="modalButton">
                <button type="button" id="gameResultOk">확인</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}