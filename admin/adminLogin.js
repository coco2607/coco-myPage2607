// adminLogin.js

import {checkAdmin} from "./adminFirebase.js";

const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminModal = document.getElementById("adminModal");
const adminPassword = document.getElementById("adminPassword");
const adminOkBtn = document.getElementById("adminOkBtn");
const adminCancelBtn = document.getElementById("adminCancelBtn");
const adminMessage = document.getElementById("adminMessage");

adminLoginBtn.addEventListener("click",openAdminModal);
adminCancelBtn.addEventListener("click",closeAdminModal);
adminOkBtn.addEventListener("click",loginAdmin);

adminPassword.addEventListener("input",() => {
    adminMessage.textContent = "";
});

adminPassword.addEventListener("keydown",event => {
    if(event.key === "Enter"){
        event.preventDefault();
        loginAdmin();
    }
});

function openAdminModal(){
    adminPassword.value = "";
    adminMessage.textContent = "";
    adminModal.classList.remove("hidden");
    adminPassword.focus();
}

function closeAdminModal(){
    adminModal.classList.add("hidden");
    adminPassword.value = "";
    adminMessage.textContent = "";
}

async function loginAdmin(){
    const password = String(adminPassword.value).trim();

    if(password === ""){
        adminMessage.textContent = "비밀번호를 입력하세요.";
        adminPassword.focus();
        return;
    }

    try{
        const role = await checkAdmin(password);

        if(!role){
            adminMessage.textContent = "비밀번호가 올바르지 않습니다.";
            adminPassword.select();
            return;
        }

        sessionStorage.removeItem("isAdmin");
        sessionStorage.removeItem("isStaff");

        if(role === "admin"){
            sessionStorage.setItem("isAdmin","true");
            location.href = "../admin/admin.html";
            return;
        }

        if(role === "staff"){
            sessionStorage.setItem("isStaff","true");
            location.href = "../staff/staff.html";
        }
    }catch(error){
        console.error("관리자 로그인 오류:",error);
        adminMessage.textContent = "로그인 중 오류가 발생했습니다.";
    }
}