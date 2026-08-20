import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Cấu hình dự án Firebase hiện có của bạn.
const firebaseConfig = {
    apiKey: "AIzaSyADANpAqzaifukcbwwNIF6LubLxYI7GnTw",
    authDomain: "jsi34-e00ed.firebaseapp.com",
    projectId: "jsi34-e00ed",
    storageBucket: "jsi34-e00ed.firebasestorage.app",
    messagingSenderId: "958660106818",
    appId: "1:958660106818:web:7dc1bdc5a2415ac4cdebdb",
    measurementId: "G-KJVJGMN45K"
};

// Khởi tạo dùng chung cho toàn bộ app.
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
