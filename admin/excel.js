// excel.js

import {
    db,
    ref,
    get
} from "../firebase.js";

const XLSX = window.XLSX;
const excelBtn = document.getElementById("excelBtn");

if (excelBtn) {
    excelBtn.addEventListener("click", downloadExcel);
}

// 엑셀 다운로드
async function downloadExcel() {

    try {

        const snapshot = await get(ref(db, "history"));

        if (!snapshot.exists()) {
            alert("저장된 기록이 없습니다.");
            return;
        }

        const list = [];

        snapshot.forEach(item => {

            list.push({
                key: item.key,
                ...item.val()
            });

        });

        // 최신순
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const rows = [];

        list.forEach((item, index) => {

            const row = {};

            // 번호
            row["번호"] = index + 1;

            // history의 모든 데이터
            Object.keys(item).forEach(key => {

                if (key === "key") return;
                if (key === "timestamp") return;

                let value = item[key];

                // 날짜
                if (key === "date" && value) {
                    value = value.replace(/-/g, "/").substring(2);
                }

                // 벙참일
                if (key === "joinDate" && value) {
                    value = value.replace(/-/g, "/").substring(2);
                }

                // 시간 24시간 변환
                if (key === "time" && value) {

                    let time = value;

                    if (time.startsWith("오전")) {

                        time = time.replace("오전 ", "");

                        if (time.startsWith("12:")) {
                            time = "00" + time.substring(2);
                        }

                    } else if (time.startsWith("오후")) {

                        time = time.replace("오후 ", "");

                        const parts = time.split(":");

                        let hour = parseInt(parts[0], 10);

                        if (hour !== 12) {
                            hour += 12;
                        }

                        parts[0] = String(hour).padStart(2, "0");

                        time = parts.join(":");
                    }

                    value = time;
                }

                row[key] = value;

            });

            rows.push(row);

        });

        const worksheet = XLSX.utils.json_to_sheet(rows);

        // 열 너비 자동
        const headers = Object.keys(rows[0] || {});

        worksheet["!cols"] = headers.map(header => {

            let width = header.length + 4;

            rows.forEach(row => {

                const len = String(row[header] ?? "").length;

                if (len + 2 > width) {
                    width = len + 2;
                }

            });

            return {
                wch: width
            };

        });

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "주사위기록"
        );

        const today = new Date();

        const fileName =
            `주사위기록_${
                today.getFullYear()
            }${
                String(today.getMonth() + 1).padStart(2, "0")
            }${
                String(today.getDate()).padStart(2, "0")
            }.xlsx`;
        XLSX.writeFile(workbook, fileName);
    }

    catch (err) {
        console.error(err);
        alert("엑셀 다운로드 중 오류가 발생했습니다.");
    }
}