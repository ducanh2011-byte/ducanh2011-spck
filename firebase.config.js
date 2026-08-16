// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    updateDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Thông tin cấu hình Firebase 
const firebaseConfig = {
  apiKey: "AIzaSyADANpAqzaifukcbwwNIF6LubLxYI7GnTw", 
  authDomain: "jsi34-e00ed.firebaseapp.com", 
  projectId: "jsi34-e00ed", 
  storageBucket: "jsi34-e00ed.firebasestorage.app", 
  messagingSenderId: "958660106818", 
  appId: "1:958660106818:web:7dc1bdc5a2415ac4cdebdb", 
  measurementId: "G-KJVJGMN45K" 
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Danh sách sản phẩm (Export để các file khác gọi sử dụng)
const products = [
    {
        name: "Cà phê trứng",
        price: 20000,
        image: "cau-hoi-khi-lam-ca-phe-trung-removebg-preview.png"
    },
    {
        name: "Cà phê sữa",
        price: 25000,
        image: "a15-removebg-preview.png"
    },
    {
        name: "Trà chanh",
        price: 15000,
        image: "tra-chanh-kim-quat-removebg-preview.png"
    },
    {      
        name: "Trà đào cam sả",
        price: 48000,
        image: "cach-lam-tra-dao-cam-sa-removebg-preview.png"
    },
    {
        name: "Trà sữa việt quất",
        price: 40000,
        image: "thanh-pham-1246-removebg-preview.png"
    },
    {
        name: "Matcha latte",
        price: 35000,
        image: "Iced-Matcha-Latte-6527.jpg"
    },
];

// Export tất cả biến & hàm cần thiết
export { db, collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, products };