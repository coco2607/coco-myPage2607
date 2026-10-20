
 // gameUi.js
import {createGamePopup,showGameRulePopup} from "./gamePopup.js";

const roundMessages = {
    1:"다수를 피하라!",
    2:"본격 눈치게임이다.",
    3:"살아남은 자의 선택!",
    4:"끝까지 몰리지 마라!",
    5:"결국엔 소수가 승리한다."
};

export function createGameUI(){
    const miniGame = document.getElementById("miniGame");
    if(!miniGame) return;

    miniGame.innerHTML = `
        <div class="gameTitleRow">
            <button type="button" id="gameRuleOpen" class="gameRuleOpen">?</button>
            <div id="gameTitle" class="gameTitle">
                <span id="gameTitleMain" class="gameTitleMain"></span>
            </div>
            <button type="button" id="gamePlayerOpen" class="gamePlayerOpen">생존자</button>
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
    createGameRoundResultModal();
    createGamePopup();

    const ruleOpenBtn = document.getElementById("gameRuleOpen");

    if(ruleOpenBtn){
        ruleOpenBtn.addEventListener("click",() => {
            showGameRulePopup();
        });
    }
}

export function setGameTitle(round){
    const titleMain = document.getElementById("gameTitleMain");
    if(!titleMain) return;

    titleMain.textContent = `Round ${round} : ${roundMessages[round] || ""}`;
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
    gameEnd = null,
    nickname = ""
}){
    const gameContent = document.getElementById("gameContent");
    const pointLabel = document.getElementById("pointLabel");
    const totalPoint = document.getElementById("totalPoint");

    if(!gameContent || !pointLabel || !totalPoint || gameContent.classList.contains("hidden")){
        return;
    }

    if(gameEnd){
        pointLabel.textContent = `Round ${gameEnd.round}`;

        const winners = gameEnd.winners || {};
        const winnerNames = Object.keys(winners);

        if(winnerNames.length === 0){
            totalPoint.textContent = "우승자 없음";
        }else if(nickname && winners[nickname] === true){
            totalPoint.textContent = "우승";
        }else if(nickname){
            totalPoint.textContent = "탈락";
        }else{
            totalPoint.textContent = "게임 종료";
        }
        return;
    }

    pointLabel.textContent = `Round ${currentRound}`;

    if(!memberGame){
        totalPoint.textContent = currentRound === 1 ? "선택 대기" : "미참가";
        return;
    }

    if(memberGame.alive === false){
        if(currentRound === 1 && memberGame.result1 !== true){
            totalPoint.textContent = "선택 대기";
            return;
        }

        pointLabel.textContent = `Round ${eliminationRound || currentRound}`;
        totalPoint.textContent = "탈락";
        return;
    }

    if(selectedChoice){
        totalPoint.textContent = `${selectedChoice} 선택`;
        return;
    }

    totalPoint.textContent = "선택 대기";
}

export function showGameResultPopup(message,round,onViewResult){
    return new Promise(resolve => {
        const modal = document.getElementById("gameResultModal");
        const messageElement = document.getElementById("gameResultMessage");
        const closeBtn = document.getElementById("gameResultClose");
        const resultBtn = document.getElementById("gameResultView");

        if(!modal || !messageElement || !closeBtn || !resultBtn){
            resolve();
            return;
        }

        messageElement.innerHTML = message;
        resultBtn.textContent = `Round${round} 결과보기`;
        resultBtn.classList.toggle("hidden",!round || typeof onViewResult !== "function");
        modal.classList.remove("hidden");

        closeBtn.onclick = () => {
            modal.classList.add("hidden");
            resolve();
        };

        resultBtn.onclick = async () => {
            modal.classList.add("hidden");

            try{
                if(typeof onViewResult === "function"){
                    await onViewResult(round);
                }
            }finally{
                resolve();
            }
        };
    });
}

export function showGameRoundResultPopup(round,players,choices){
    return new Promise(resolve => {
        const modal = document.getElementById("gameRoundResultModal");
        const title = document.getElementById("gameRoundResultTitle");
        const list = document.getElementById("gameRoundResultList");
        const closeBtn = document.getElementById("gameRoundResultClose");

        if(!modal || !title || !list || !closeBtn){
            resolve();
            return;
        }

        title.textContent = `Round${round} 결과`;
        list.replaceChildren();

        choices.forEach(choice => {
            const column = document.createElement("div");
            const choiceTitle = document.createElement("div");
            const names = document.createElement("div");

            column.className = "gameRoundResultColumn";
            choiceTitle.className = "gameRoundResultChoice";
            names.className = "gameRoundResultNames";
            choiceTitle.textContent = choice;

            Object.entries(players || {}).forEach(([nickname,selected]) => {
                if(selected !== choice) return;

                const name = document.createElement("div");
                name.textContent = nickname;
                names.appendChild(name);
            });

            column.appendChild(choiceTitle);
            column.appendChild(names);
            list.appendChild(column);
        });

        modal.classList.remove("hidden");

        closeBtn.onclick = () => {
            modal.classList.add("hidden");
            resolve();
        };
    });
}

function createGameResultModal(){
    if(document.getElementById("gameResultModal")) return;

    const modal = document.createElement("div");
    modal.id = "gameResultModal";
    modal.className = "modal hidden";

    modal.innerHTML = `
        <div class="modalBox gameResultBox">
            <button type="button" id="gameResultClose" class="gameResultClose">×</button>
            <p id="gameResultMessage"></p>
            <button type="button" id="gameResultView" class="gameResultView hidden"></button>
        </div>
    `;

    document.body.appendChild(modal);
}

function createGameRoundResultModal(){
    if(document.getElementById("gameRoundResultModal")) return;

    const modal = document.createElement("div");
    modal.id = "gameRoundResultModal";
    modal.className = "modal hidden";

    modal.innerHTML = `
        <div class="modalBox gameRoundResultBox">
            <button type="button" id="gameRoundResultClose" class="gameResultClose">×</button>
            <h2 id="gameRoundResultTitle"></h2>
            <div id="gameRoundResultList" class="gameRoundResultList"></div>
        </div>
    `;

    document.body.appendChild(modal);
}
