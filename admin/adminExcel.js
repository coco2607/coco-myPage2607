// adminExcel.js

import {
    loadMembers,
    loadHistory,
    uploadMembers,
    uploadHistory
} from "./adminFirebase.js";

const excelBtn = document.getElementById("excelBtn");
const excelModal = document.getElementById("excelModal");
const excelUploadBtn = document.getElementById("excelUploadBtn");
const excelDownloadBtn = document.getElementById("excelDownloadBtn");
const excelFile = document.getElementById("excelFile");

excelBtn.addEventListener("click",event => {
    event.preventDefault();
    excelModal.classList.remove("hidden");
});

document.addEventListener("keydown",event => {
    if(event.key === "Escape"){
        excelModal.classList.add("hidden");
    }
});

excelModal.addEventListener("click",event => {
    if(event.target === excelModal){
        excelModal.classList.add("hidden");
    }
});

excelUploadBtn.addEventListener("click",() => {
    excelModal.classList.add("hidden");
    excelFile.value = "";
    excelFile.click();
});

excelFile.addEventListener("change",uploadExcel);

async function uploadExcel(){
    const file = excelFile.files[0];

    if(!file){
        return;
    }

    try{
        const buffer = await file.arrayBuffer();

        const workbook = XLSX.read(buffer,{
            type:"array"
        });

        let uploaded = false;

        const memberSheet = workbook.Sheets["member"];

        if(memberSheet){
            const members = XLSX.utils.sheet_to_json(memberSheet);

            if(members.length > 0){
                await uploadMembers(members);
                uploaded = true;
            }
        }

        const historySheet = workbook.Sheets["history"];

        if(historySheet){
            const history = XLSX.utils.sheet_to_json(historySheet);

            if(history.length > 0){
                await uploadHistory(history);
                uploaded = true;
            }
        }

        if(uploaded){
            alert("업로드가 완료되었습니다.");
        }else{
            alert("member 또는 history 시트를 찾을 수 없습니다.");
        }
    }catch(error){
        console.error("엑셀 업로드 오류:",error);
        alert("업로드 중 오류가 발생했습니다.");
    }finally{
        excelFile.value = "";
    }
}

excelDownloadBtn.addEventListener("click",downloadExcel);

async function downloadExcel(){
    try{
        excelModal.classList.add("hidden");

        const members = await loadMembers();
        const history = await loadHistory();

        const workbook = XLSX.utils.book_new();

        const memberSheet = XLSX.utils.json_to_sheet(members);
        const historySheet = XLSX.utils.json_to_sheet(history);

        XLSX.utils.book_append_sheet(
            workbook,
            memberSheet,
            "member"
        );

        XLSX.utils.book_append_sheet(
            workbook,
            historySheet,
            "history"
        );

        XLSX.writeFile(
            workbook,
            "backup.xlsx"
        );
    }catch(error){
        console.error("엑셀 다운로드 오류:",error);
        alert("다운로드 중 오류가 발생했습니다.");
    }
}