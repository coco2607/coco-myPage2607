// attendCard.js

import {
    saveAttendanceCardResult
} from "./attendFirebase.js";

// 카드 뒷면 이미지
const CARD_BACK_IMAGE =
    new URL(
        "./card_뒷면.webp",
        import.meta.url
    ).href;

const CARD_COUNT = 7;

// 카드 표시
export function showAttendanceCard(
    nickname,
    date
) {
    const rewards = shuffleCards();

    const overlay =
        document.createElement("div");

    overlay.className =
        "attendanceCardOverlay";

    overlay.innerHTML = `
        <div class="attendanceCardModal">

            <div class="attendanceCardTitle">
                출석 카드 뽑기
            </div>

            <div class="attendanceCardGuide">
                카드 한 장을 선택하세요
            </div>

            <div class="attendanceCardGrid"></div>

        </div>
    `;

    document.body.appendChild(
        overlay
    );

    const grid =
        overlay.querySelector(
            ".attendanceCardGrid"
        );

    const cards = [];

    // 카드 7장 생성
    for (
        let i = 0;
        i < CARD_COUNT;
        i++
    ) {
        const card =
            document.createElement("button");

        card.type = "button";

        card.className =
            "attendanceCard";

        // 0부터 시작하는 카드 인덱스
        card.dataset.index =
            String(i);

        card.innerHTML = `
            <span class="attendanceCardInner">

                <span class="
                    attendanceCardFace
                    attendanceCardBack
                ">
                    <img
                        src="${CARD_BACK_IMAGE}"
                        alt="카드 뒷면">
                </span>

                <span class="
                    attendanceCardFace
                    attendanceCardFront
                    ${
                        rewards[i] > 0
                            ? "win"
                            : "lose"
                    }
                ">
                    <strong>
                        ${
                            rewards[i] > 0
                                ? "+1P"
                                : "꽝"
                        }
                    </strong>
                </span>

            </span>
        `;

        grid.appendChild(card);

        cards.push(card);
    }

    let selectedIndex = -1;
    let selectedReward = 0;
    let finished = false;

    return new Promise(resolve => {

        // 카드 클릭
        cards.forEach(
            (card, index) => {

                card.addEventListener(
                    "click",
                    async () => {

                        // 이미 종료된 경우
                        if (finished) {
                            return;
                        }

                        // 이미 카드를 선택한 경우
                        if (
                            selectedIndex !== -1
                        ) {
                            return;
                        }

                        // 선택한 카드 기록
                        selectedIndex =
                            index;

                        selectedReward =
                            rewards[index];

                        // 선택한 카드 강조
                        card.classList.add(
                            "selected"
                        );

                        // 모든 카드 클릭 잠금
                        cards.forEach(
                            item => {
                                item.disabled =
                                    true;
                            }
                        );

                        // 카드 선택 결과를 즉시 저장 시작
                        const savePromise =
                            saveAttendanceCardResult(
                                nickname,
                                date,
                                selectedReward
                            );

                        // 선택한 카드 먼저 뒤집기
                        requestAnimationFrame(
                            () => {

                                card.classList.add(
                                    "flipped"
                                );

                                // 0.42초 후
                                // 나머지 6장 동시에 뒤집기
                                setTimeout(
                                    () => {

                                        cards.forEach(
                                            (
                                                item,
                                                itemIndex
                                            ) => {

                                                if (
                                                    itemIndex ===
                                                    selectedIndex
                                                ) {
                                                    return;
                                                }

                                                item.classList.add(
                                                    "flipped"
                                                );
                                            }
                                        );

                                    },
                                    420
                                );
                            }
                        );

                        try {

                            // 카드가 모두 뒤집히는 시간만큼 대기
                            await wait(1250);

                            // Firebase 저장 완료 대기
                            const saveResult =
                                await savePromise;

                            // 실제 보상 저장 여부 확인
                            if (
                                !saveResult ||
                                saveResult.saved !== true
                            ) {
                                throw new Error(
                                    "출석 카드 보상 저장에 실패했습니다."
                                );
                            }

                            /*
                             * 중요:
                             * 최종 결과는 Firebase가 반환한
                             * rewardPoint가 아니라 실제 선택한
                             * selectedReward를 기준으로 표시한다.
                             */
                            await showCardResult(
                                overlay,
                                selectedReward,
                                () => {

                                    if (finished) {
                                        return;
                                    }

                                    finished = true;

                                    overlay.remove();

                                    resolve(
                                        selectedReward
                                    );
                                }
                            );

                        } catch (error) {

                            console.error(
                                "출석 카드 결과 저장 오류:",
                                error
                            );

                            // 저장 실패
                            showCardResultError(
                                overlay,
                                () => {

                                    if (finished) {
                                        return;
                                    }

                                    finished = true;

                                    overlay.remove();

                                    resolve(
                                        selectedReward
                                    );
                                }
                            );
                        }
                    }
                );
            }
        );
    });
}

// 결과 팝업
async function showCardResult(
    overlay,
    rewardPoint,
    onConfirm
) {
    // 모든 카드가 뒤집힌 후 잠시 대기
    await wait(800);

    const resultPopup =
        document.createElement("div");

    resultPopup.className =
        "attendanceCardResultPopup";

    if (Number(rewardPoint) > 0) {

        resultPopup.innerHTML = `
            <div class="attendanceCardResultBox">

                <div class="attendanceCardResultMessage">
                    축하합니다!<br>
                    +1P 당첨!
                </div>

                <button
                    type="button"
                    class="attendanceCardResultButton">
                    확인
                </button>

            </div>
        `;

    } else {

        resultPopup.innerHTML = `
            <div class="attendanceCardResultBox">

                <div class="attendanceCardResultMessage">
                    다음 기회에...
                </div>

                <button
                    type="button"
                    class="attendanceCardResultButton">
                    확인
                </button>

            </div>
        `;
    }

    overlay.appendChild(
        resultPopup
    );

    const resultButton =
        resultPopup.querySelector(
            ".attendanceCardResultButton"
        );

    resultButton.addEventListener(
        "click",
        onConfirm
    );
}

// 결과 저장 실패
function showCardResultError(
    overlay,
    onConfirm
) {
    const resultPopup =
        document.createElement("div");

    resultPopup.className =
        "attendanceCardResultPopup";

    resultPopup.innerHTML = `
        <div class="attendanceCardResultBox">

            <div class="attendanceCardResultMessage">
                카드 결과 저장에<br>
                실패했습니다.
            </div>

            <button
                type="button"
                class="attendanceCardResultButton">
                확인
            </button>

        </div>
    `;

    overlay.appendChild(
        resultPopup
    );

    const resultButton =
        resultPopup.querySelector(
            ".attendanceCardResultButton"
        );

    resultButton.addEventListener(
        "click",
        onConfirm
    );
}

// 카드 7장 섞기
function shuffleCards() {

    const cards = [
        1,
        1,
        0,
        0,
        0,
        0,
        0
    ];

    for (
        let i = cards.length - 1;
        i > 0;
        i--
    ) {
        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            cards[i],
            cards[j]
        ] = [
            cards[j],
            cards[i]
        ];
    }

    return cards;
}

// 대기
function wait(ms) {
    return new Promise(
        resolve => {
            setTimeout(
                resolve,
                ms
            );
        }
    );
}