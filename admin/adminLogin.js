//admin.js

import { checkAdmin } from "./adminFirebase.js";

const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminModal = document.getElementById("adminModal");
const adminPassword = document.getElementById("adminPassword");
const adminOkBtn = document.getElementById("adminOkBtn");
const adminCancelBtn = document.getElementById("adminCancelBtn");
const adminMessage = document.getElementById("adminMessage");


// 관리자 로그인창 열기
adminLoginBtn.addEventListener("click", () => {

    adminPassword.value = "";
    adminMessage.textContent = "";

    adminModal.classList.remove("hidden");
    adminPassword.focus();
});


// 닫기
adminCancelBtn.addEventListener("click", closeAdminModal);
function closeAdminModal() {
    adminModal.classList.add("hidden");
}


// Enter 로그인
adminPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        loginAdmin();
    }
});


// 확인 버튼
adminOkBtn.addEventListener("click", loginAdmin);


// 관리자 운영진 로그인
async function loginAdmin() {

    const password = adminPassword.value.trim();

    if (password === "") {
        adminMessage.textContent = "비밀번호를 입력하세요.";
        adminPassword.focus();
        return;
    }

    try {

        const role = await checkAdmin(password);

        if (!role) {
            adminMessage.textContent = "비밀번호가 올바르지 않습니다.";
            adminPassword.select();
            return;
        }

        sessionStorage.removeItem("isAdmin");
        sessionStorage.removeItem("isStaff");

        if (role === "admin") {

            sessionStorage.setItem("isAdmin", "true");
            location.href = "../admin/admin.html";

        }
        else {

            sessionStorage.setItem("isStaff", "true");
            location.href = "../staff/staff.html";

        }

    }
    catch (err) {

        console.error(err);
        adminMessage.textContent = "로그인 중 오류가 발생했습니다.";

    }
}