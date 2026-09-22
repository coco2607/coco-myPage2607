// adminLogin.js
import {getAdminPasswords} from "./adminLoginFirebase.js";

document.addEventListener("DOMContentLoaded",initAdminLogin);

function initAdminLogin(){
    const adminPassword = document.getElementById("adminPassword");
    const adminOkBtn = document.getElementById("adminOkBtn");
    const adminMessage = document.getElementById("adminMessage");

    if(!adminPassword || !adminOkBtn || !adminMessage){
        return;
    }

    adminOkBtn.addEventListener("click",() => {
        adminLogin(
            adminPassword,
            adminMessage
        );
    });

    adminPassword.addEventListener("keydown",event => {
        if(event.key === "Enter"){
            adminLogin(
                adminPassword,
                adminMessage
            );
        }
    });
}

async function adminLogin(adminPassword,adminMessage){
    const password = adminPassword.value.trim();

    if(password === ""){
        adminMessage.textContent = "비밀번호를 입력하세요.";
        adminPassword.focus();
        return;
    }

    try{
        const passwords = await getAdminPasswords();

        if(password === passwords.adminPw){
            sessionStorage.setItem("managerRole","admin");
            location.replace("../admin/admin.html");
            return;
        }

        if(password === passwords.staffPw){
            sessionStorage.setItem("managerRole","staff");
            location.replace("../admin/staff/staff.html");
            return;
        }

        adminMessage.textContent = "비밀번호가 올바르지 않습니다.";
        adminPassword.select();
    }catch(error){
        console.error("관리자 로그인 실패:",error);
        adminMessage.textContent = "로그인 중 오류가 발생했습니다.";
    }
}