import { auth, db } from "./firebase.js";
import {
    collection,
    onSnapshot,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const coffeeRef = collection(db, "coffee");

const dom = {
    userEmail: document.getElementById("userEmail"),
    logoutBtn: document.getElementById("logoutBtn"),
    productGrid: document.getElementById("productGrid"),
    cartItems: document.getElementById("cartItems"),
    cartCount: document.getElementById("cartCount"),
    cartTotal: document.getElementById("cartTotal"),
    clearCartBtn: document.getElementById("clearCartBtn"),
    checkoutBtn: document.getElementById("checkoutBtn"),
    checkoutMessage: document.getElementById("checkoutMessage")
};

let cart = [];
let unsubscribeCoffee = null;

// Chống XSS khi render dữ liệu Firestore ra HTML.
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatCurrency(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function getProductImage(image) {
    return image || "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=900&auto=format&fit=crop";
}

function renderProducts(products) {
    if (products.length === 0) {
        dom.productGrid.innerHTML = `<p class="empty-state">Chưa có sản phẩm nào trong collection coffee.</p>`;
        return;
    }

    dom.productGrid.innerHTML = products.map((product) => `
        <article class="product-card">
            <img src="${escapeHtml(getProductImage(product.image))}" alt="${escapeHtml(product.name)}" loading="lazy">
            <div class="product-body">
                <div>
                    <h3>${escapeHtml(product.name || "Cà phê Bean House")}</h3>
                    <p class="price">${formatCurrency(product.price)}</p>
                </div>
                <button class="button button-primary add-cart-btn" type="button" data-id="${escapeHtml(product.id)}">
                    Thêm vào giỏ
                </button>
            </div>
        </article>
    `).join("");

    dom.productGrid.querySelectorAll(".add-cart-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const product = products.find((item) => item.id === button.dataset.id);
            if (product) addToCart(product);
        });
    });
}

function addToCart(product) {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            image: getProductImage(product.image),
            name: product.name || "Cà phê Bean House",
            price: Number(product.price || 0),
            quantity: 1
        });
    }

    dom.checkoutMessage.textContent = "";
    renderCart();
}

function changeQuantity(id, amount) {
    cart = cart
        .map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item)
        .filter((item) => item.quantity > 0);

    renderCart();
}

function renderCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    dom.cartCount.textContent = totalItems;
    dom.cartTotal.textContent = formatCurrency(totalPrice);
    dom.checkoutBtn.disabled = cart.length === 0;

    if (cart.length === 0) {
        dom.cartItems.innerHTML = `<p class="empty-state compact">Giỏ hàng đang trống.</p>`;
        return;
    }

    dom.cartItems.innerHTML = cart.map((item) => `
        <article class="cart-item">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
            <div>
                <h3>${escapeHtml(item.name)}</h3>
                <p>${formatCurrency(item.price)}</p>
                <div class="quantity-controls">
                    <button type="button" class="quantity-btn" data-id="${escapeHtml(item.id)}" data-action="minus">-</button>
                    <span>${item.quantity}</span>
                    <button type="button" class="quantity-btn" data-id="${escapeHtml(item.id)}" data-action="plus">+</button>
                </div>
            </div>
        </article>
    `).join("");

    dom.cartItems.querySelectorAll(".quantity-btn").forEach((button) => {
        button.addEventListener("click", () => {
            changeQuantity(button.dataset.id, button.dataset.action === "plus" ? 1 : -1);
        });
    });
}

function listenToProducts() {
    const coffeeQuery = query(coffeeRef, orderBy("name", "asc"));

    unsubscribeCoffee = onSnapshot(coffeeQuery, (snapshot) => {
        const products = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
        }));

        // Web bán hàng chỉ cần image, name và price để render sản phẩm.
        // Các field orderdate/status nếu còn trong Firestore sẽ được bỏ qua ở giao diện này.
        renderProducts(products);
    }, (error) => {
        console.error("Firestore error:", error);
        dom.productGrid.innerHTML = `<p class="empty-state">Không tải được sản phẩm từ Firebase.</p>`;
    });
}

function bindEvents() {
    dom.logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "login.html";
    });

    dom.clearCartBtn.addEventListener("click", () => {
        cart = [];
        dom.checkoutMessage.textContent = "";
        renderCart();
    });

    dom.checkoutBtn.addEventListener("click", () => {
        if (cart.length === 0) return;
        dom.checkoutMessage.textContent = "Đơn hàng đã được ghi nhận trên giỏ tạm. Trang hiện chỉ đọc dữ liệu sản phẩm từ Firestore.";
    });
}

// Bảo vệ trang bán hàng: khách chưa đăng nhập sẽ quay về trang login.
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    dom.userEmail.textContent = user.email;

    if (!unsubscribeCoffee) {
        bindEvents();
        renderCart();
        listenToProducts();
    }
});
