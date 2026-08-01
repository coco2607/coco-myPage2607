// adminExcel.js

import {
    loadUsers,
    loadHistory,
    uploadUsers,
    uploadHistory
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

    try {

        const buffer = await file.arrayBuffer();

        const workbook = XLSX.read(buffer, {
            type: "array"
        });

        let uploaded = false;

        // users
        const usersSheet = workbook.Sheets["users"];

        if (usersSheet) {

            const users = XLSX.utils.sheet_to_json(usersSheet);

            if (users.length > 0) {

                await uploadUsers(users);
                uploaded = true;

            }

        }

        // history
        const historySheet = workbook.Sheets["history"];

        if (historySheet) {

            const history = XLSX.utils.sheet_to_json(historySheet);

            if (history.length > 0) {

                await uploadHistory(history);
                uploaded = true;

            }

        }

        if (uploaded) {

            alert("업로드가 완료되었습니다.");

        } else {

            alert("users 또는 history 시트를 찾을 수 없습니다.");

        }

    } catch (err) {

        console.error(err);
        alert("업로드 중 오류가 발생했습니다.");

    } finally {

        // 같은 파일을 다시 선택할 수 있도록 초기화
        excelFile.value = "";

    }

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

// 다운로드 모달 바깥 클릭 시 닫기
downloadModal.addEventListener("click", (e) => {

    if (e.target === downloadModal) {
        downloadModal.classList.add("hidden");
    }

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