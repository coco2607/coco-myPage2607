// attend.js

import {
    loadTodayAttendance,
    saveTodayAttendance,
    loadMonthlyAttendance,
    rewardAttendancePoint
} from "./attendFirebase.js";

import {
    getCurrentDate,
    trim
} from "../utils.js";

// 로그인 닉네임
const nickname = sessionStorage.getItem("nickname");

// 요소
const attendanceDate = document.getElementById("attendanceDate");
const attendanceInput = document.getElementById("attendanceInput");
const attendanceBtn = document.getElementById("attendanceBtn");
const attendanceList = document.getElementById("attendanceList");
const pointLabel = document.getElementById("pointLabel");
const totalPoint = document.getElementById("totalPoint");

// 출석 보상 팝업
const attendanceRewardModal = document.getElementById("attendanceRewardModal");
const attendanceRewardPoint = document.getElementById("attendanceRewardPoint");
const attendanceRewardOk = document.getElementById("attendanceRewardOk");

// 시작
loadAttendance();

// 출석체크
async function loadAttendance() {
    const date = getCurrentDate();
    const monthKey = date.substring(0, 7);
    const month = Number(date.substring(5, 7));

    attendanceDate.textContent = `[${date}]`;

    // 상단 월 출석 표시
    const attendanceCount = await loadMonthlyAttendance(
        nickname,
        monthKey
    );

    pointLabel.textContent = `${month}월 출석`;
    totalPoint.textContent = `${attendanceCount}회`;

    // 출석 보상 확인
    const rewardPoint = await rewardAttendancePoint(
        nickname,
        monthKey,
        attendanceCount,
        date
    );

    if (rewardPoint > 0) {
        showAttendanceRewardPopup(rewardPoint);
    }

    // 오늘 출석 목록
    const list = await loadTodayAttendance(date);

    attendanceList.innerHTML = "";

    if (list.length === 0) {
        attendanceList.innerHTML = "<div class='attendanceEmpty'>오늘 출석한 회원이 없습니다.</div>";
        return;
    }

    // 최신 출석순
    list.sort((a, b) => Number(b.time || 0) - Number(a.time || 0));

    list.forEach(data => {
        addAttendance(
            data.nickname,
            data.comment,
            data.time
        );
    });
}

// 등록 버튼
attendanceBtn.addEventListener("click", saveAttendance);

// 엔터로 등록
attendanceInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        saveAttendance();
    }
});

// 출석 등록
async function saveAttendance() {
    const comment = trim(attendanceInput.value);

    if (comment === "") {
        attendanceInput.focus();
        return;
    }

    attendanceBtn.disabled = true;

    try {
        const date = getCurrentDate();

        await saveTodayAttendance(
            nickname,
            date,
            comment
        );

        attendanceInput.value = "";

        // 출석 저장 후 count를 다시 조회하고 보상 확인
        await loadAttendance();
    } catch (error) {
        console.error("출석 등록 오류:", error);
    } finally {
        attendanceBtn.disabled = false;
    }
}

// 출석 보상 팝업
function showAttendanceRewardPopup(point) {
    attendanceRewardPoint.textContent = `+${point}P`;
    attendanceRewardModal.classList.remove("hidden");
}

// 출석 보상 팝업 확인
attendanceRewardOk.addEventListener("click", () => {
    attendanceRewardModal.classList.add("hidden");
});

// 출석 출력
function addAttendance(nickname, comment, time) {
    const item = document.createElement("div");

    item.className = "attendanceItem";

    item.innerHTML = `
        <div class="attendanceNickname">
            ${nickname}
        </div>
        <div class="attendanceComment">
            ${comment}
        </div>
        <div class="attendanceTime">
            ${formatAttendanceTime(time)}
        </div>
    `;

    attendanceList.appendChild(item);
}

// 출석 시간
function formatAttendanceTime(value) {
    if (!value) {
        return "";
    }

    const date = new Date(Number(value));

    if (isNaN(date.getTime())) {
        return "";
    }

    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// member.js에서 호출할 수 있도록 공개
window.loadAttendance = loadAttendance;