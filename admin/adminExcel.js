// adminExcel.js

import {
    loadUsers,
    loadHistory
} from "./adminFirebase.js";


// ===========================
// DOM
// ===========================
const excelBtn = document.getElementById("excelBtn");
const excelModal = document.getElementById("excelModal");

const excelUploadBtn = document.getElementById("excelUploadBtn");
const excelDownloadBtn = document.getElementById("excelDownloadBtn");

const excelFile = document.getElementById("excelFile");

const downloadModal = document.getElementById("downloadModal");
const downloadStartBtn = document.getElementById("downloadStartBtn");


// ===========================
// Excel UP/DOWN 모달
// ===========================

// 열기
excelBtn.addEventListener("click", (e) => {

    e.preventDefault();
    excelModal.classList.remove("hidden");

});

// ESC 닫기
document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

        excelModal.classList.add("hidden");
        downloadModal.classList.add("hidden");

    }

});

// 모달 바깥 클릭(모바일 포함)
excelModal.addEventListener("click", (e) => {

    if (e.target === excelModal) {

        excelModal.classList.add("hidden");
        downloadModal.classList.add("hidden");

    }

});


// ===========================
// Upload
// ===========================

excelUploadBtn.addEventListener("click", () => {

    excelModal.classList.add("hidden");

    excelFile.value = "";
    excelFile.click();

});

excelFile.addEventListener("change", uploadExcel);

async function uploadExcel() {

    const file = excelFile.files[0];

    if (!file) return;

    // TODO
    // workbook 읽기
    // users 시트 → users 업로드
    // history 시트 → history 업로드

}


// ===========================
// Download
// ===========================

const historyCheck = document.getElementById("historyCheck");
const usersCheck = document.getElementById("usersCheck");

// 다운로드 선택창 열기
excelDownloadBtn.addEventListener("click", () => {

    excelModal.classList.add("hidden");
    downloadModal.classList.remove("hidden");

});

// 다운로드 시작
downloadStartBtn.addEventListener("click", startDownload);

async function startDownload() {

    if (!historyCheck.checked && !usersCheck.checked) {
        return;
    }

    const workbook = XLSX.utils.book_new();

    if (usersCheck.checked) {
        const users = await loadUsers();
        const sheet = XLSX.utils.json_to_sheet(users);
        XLSX.utils.book_append_sheet(workbook, sheet, "users");
    }

    if (historyCheck.checked) {
        const history = await loadHistory();
        const sheet = XLSX.utils.json_to_sheet(history);
        XLSX.utils.book_append_sheet(workbook, sheet, "history");
    }

    XLSX.writeFile(workbook, "backup.xlsx");

    historyCheck.checked = false;
    usersCheck.checked = false;

    downloadModal.classList.add("hidden");
}