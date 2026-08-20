import { auth } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const authMessage = document.getElementById("authMessage");

// Đổi qua lại giữa form đăng nhập và đăng ký.
function setAuthMode(mode) {
    const isLogin = mode === "login";
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
    showLoginBtn.classList.toggle("active", isLogin);
    showRegisterBtn.classList.toggle("active", !isLogin);
    authMessage.textContent = "";
}

// Hiển thị lỗi Firebase bằng tiếng Việt ngắn gọn.
function getAuthErrorMessage(error) {
    const messages = {
        "auth/email-already-in-use": "Email này đã được đăng ký.",
        "auth/invalid-email": "Email không hợp lệ.",
        "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
        "auth/weak-password": "Mật khẩu cần ít nhất 6 ký tự.",
        "auth/network-request-failed": "Không kết nối được Firebase, hãy kiểm tra mạng."
    };

    return messages[error.code] || error.message || "Có lỗi xảy ra.";
}

// Nếu đã đăng nhập thì vào thẳng trang bán hàng.
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "index.html";
    }
});

showLoginBtn.addEventListener("click", () => setAuthMode("login"));
showRegisterBtn.addEventListener("click", () => setAuthMode("register"));

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = document.getElementById("loginSubmitBtn");
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        submitBtn.disabled = true;
        authMessage.textContent = "Đang đăng nhập...";
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "index.html";
    } catch (error) {
        authMessage.textContent = getAuthErrorMessage(error);
    } finally {
        submitBtn.disabled = false;
    }
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = document.getElementById("registerSubmitBtn");
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    try {
        submitBtn.disabled = true;
        authMessage.textContent = "Đang tạo tài khoản...";
        await createUserWithEmailAndPassword(auth, email, password);
        window.location.href = "index.html";
    } catch (error) {
        authMessage.textContent = getAuthErrorMessage(error);
    } finally {
        submitBtn.disabled = false;
    }
});
