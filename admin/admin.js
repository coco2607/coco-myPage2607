// admin.js

import {
    loadUsers,
    deleteUser,
    deleteHistoryByMonth
} from "./adminFirebase.js";


// 관리자 로그인 확인
const isAdmin = sessionStorage.getItem("isAdmin");

if (isAdmin !== "true") {
    alert("관리자만 접근 가능합니다.");
    location.href = "../login/login.html";
}

const historyList = document.getElementById("historyList");
const totalCount = document.getElementById("totalCount");
const searchInput = document.getElementById("searchInput");

const monthSelect = document.getElementById("monthSelect");
const deleteMonthBtn = document.getElementById("deleteMonthBtn");

let historyData = [];

// 시작
init();
async function init(){

    historyData = await loadUsers();

    // 최신순
    totalCount.textContent =
        `전체회원 ${historyData.length}명`;
    render(historyData);
}


// 화면 출력
function render(list){

    historyList.innerHTML = "";

    if(list.length === 0){

        historyList.innerHTML = `
            <div class="historyItem">
                회원이 없습니다.
            </div>
        `;
        return;
    }

    list.forEach(item => {

        const joinDate = item.joinDate
            ? item.joinDate.replace(/-/g, "/").substring(2)
            : "정보없음";

        historyList.innerHTML += `

            <div class="historyItem">

                <div class="historyRow">

                    <div class="historyDate">
                        ${joinDate}
                    </div>

                    <div class="historyNick">
                        ${item.nickname}
                    </div>

                    <div class="historyJoinDate">
                        ${item.lastPosition ?? "-"}
                    </div>

                    <button
                        class="deleteBtn"
                        data-key="${item.nickname}">
                        삭제
                    </button>

                </div>

            </div>

        `;

    });

}

// 닉네임 검색
searchInput.addEventListener("input", () => {

    const keyword = searchInput.value.trim().toLowerCase();
    const result = historyData.filter(item => {

        const nickname = (item.nickname || "").toLowerCase();
        return nickname.includes(keyword);
    });
    totalCount.textContent = `전체회원 ${result.length}명`;
    render(result);
});

// 개별 삭제
historyList.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("deleteBtn")) return;

    const ok = confirm("이 기록을 삭제하시겠습니까?");
    if (!ok) return;
    await deleteUser(e.target.dataset.key);
    init();
});

// 월별 삭제
deleteMonthBtn.addEventListener("click", async () => {

    const month = monthSelect.value;
    const ok = confirm(`${month}의 기록을 모두 삭제하시겠습니까?`);

    if (!ok) return;
    const count = await deleteHistoryByMonth(month);
    alert(`${count}건 삭제되었습니다.`);
    init();
});