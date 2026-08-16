// main.js
import { db, auth } from "./firebase.config.js";
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Viết toàn bộ code lắng nghe Realtime, thêm/sửa/xóa đơn hàng, đóng/mở Modal tại đây...

// References đến các Collection
const ordersRef = collection(db, "orders");
const productsRef = collection(db, "products");

const STATUS_OPTIONS = ["Chờ xử lý", "Đang pha chế", "Đang giao", "Đã giao"];

// Hàm phụ trợ chống XSS
function escapeHtml(value) {
    if (!value) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ==========================================
// 1. RENDER THỰC ĐƠN REALTIME TỪ FIRESTORE
// ==========================================
function listenToProducts() {
    const menuContainer = document.getElementById("menuContainer");
    if (!menuContainer) return;

    onSnapshot(productsRef, (snapshot) => {
        if (snapshot.empty) {
            menuContainer.innerHTML = `<p class="col-span-full text-center text-gray-500 py-8">Chưa có sản phẩm nào trong thực đơn.</p>`;
            return;
        }

        const productsList = [];
        snapshot.forEach((docSnap) => {
            productsList.push({ id: docSnap.id, ...docSnap.data() });
        });

        menuContainer.innerHTML = productsList.map(item => {
            const name = item.name || item.title || "Món uống";
            const price = Number(item.price) || 0;
            const image = item.image || item.imageUrl || "https://via.placeholder.com/300x200?text=No+Image";

            return `
                <div class="bg-white rounded-xl shadow overflow-hidden flex flex-col justify-between hover:shadow-lg transition">
                    <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" class="w-full h-48 object-cover bg-gray-200">
                    <div class="p-4 flex-1 flex flex-col justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">${escapeHtml(name)}</h3>
                            <p class="text-blue-600 font-bold text-md mt-1">${price.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                        <button 
                            class="btn-quick-order mt-4 w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-lg font-medium transition text-sm active:scale-95"
                            data-id="${item.id}"
                        >
                            🛒 Đặt món ngay
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Lưu danh sách vào Map để gọi khi click, tránh bị vỡ chuỗi do dấu nháy
        const productMap = new Map(productsList.map(p => [p.id, p]));

        menuContainer.querySelectorAll(".btn-quick-order").forEach(btn => {
            btn.addEventListener("click", () => {
                const p = productMap.get(btn.dataset.id);
                if (p) {
                    window.quickOrder(p.name || p.title, Number(p.price) || 0);
                }
            });
        });
    }, (error) => {
        console.error("Lỗi tải thực đơn Firestore:", error);
    });
}

// Khởi chạy lắng nghe Thực đơn
listenToProducts();

// ==========================================
// 2. CÁC HÀM XỬ LÝ GIAO DIỆN (MODAL & QUICK ORDER)
// ==========================================
const statusSelectInModal = document.getElementById("status");
if (statusSelectInModal) {
    statusSelectInModal.innerHTML = STATUS_OPTIONS.map(st => `<option value="${st}">${st}</option>`).join('');
}

window.toggleModal = (show) => {
    const modal = document.getElementById("orderModal");
    if (!modal) return;
    if (show) {
        modal.classList.remove("hidden");
    } else {
        modal.classList.add("hidden");
        document.getElementById("orderForm")?.reset();
    }
};

window.quickOrder = (productName, price) => {
    const prodInput = document.getElementById("product");
    const totalInput = document.getElementById("total");
    if (prodInput) prodInput.value = productName;
    if (totalInput) totalInput.value = price;
    window.toggleModal(true);
};

// ==========================================
// 3. LẮNG NGHE REALTIME ĐƠN HÀNG (QUẢN LÝ)
// ==========================================
function listenToOrders() {
    const tableBody = document.getElementById("orderTableBody");
    if (!tableBody) return; // Nếu không ở trang admin/quản lý thì bỏ qua

    onSnapshot(ordersRef, (snapshot) => {
        tableBody.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const id = docSnap.id;

            let statusColor = "bg-yellow-100 text-yellow-800";
            if (order.status === "Đang pha chế") statusColor = "bg-orange-100 text-orange-800";
            if (order.status === "Đang giao") statusColor = "bg-blue-100 text-blue-800";
            if (order.status === "Đã giao") statusColor = "bg-green-100 text-green-800";

            const optionsHTML = STATUS_OPTIONS.map(st => 
                `<option value="${st}" ${order.status === st ? 'selected' : ''}>${st}</option>`
            ).join('');

            const row = `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">#${id.substring(0, 6)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${escapeHtml(order.customerName)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(order.product)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${Number(order.total).toLocaleString('vi-VN')} đ</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                            ${escapeHtml(order.status)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <select onchange="window.updateStatus('${id}', this.value)" class="border rounded px-2 py-1 bg-white text-gray-700 shadow-sm focus:outline-none border-gray-300 text-xs">
                            ${optionsHTML}
                        </select>
                        <button onclick="window.deleteOrder('${id}')" class="text-red-600 hover:text-red-900 font-medium text-xs ml-2">Xóa</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    });
}

// Khởi chạy lắng nghe Đơn hàng
listenToOrders();

// ==========================================
// 4. CÁC THAO TÁC CRUD
// ==========================================
window.addOrder = async (event) => {
    event.preventDefault();
    const customerName = document.getElementById("customerName")?.value || "";
    const product = document.getElementById("product")?.value || "";
    const total = document.getElementById("total")?.value || 0;
    const status = document.getElementById("status")?.value || "Chờ xử lý";

    try {
        await addDoc(ordersRef, {
            customerName,
            product,
            total: Number(total),
            status,
            createdAt: new Date()
        });
        window.toggleModal(false);
    } catch (error) {
        console.error("Lỗi khi thêm đơn hàng: ", error);
    }
};

window.updateStatus = async (id, newStatus) => {
    const orderDoc = doc(db, "orders", id);
    try {
        await updateDoc(orderDoc, { status: newStatus });
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái: ", error);
    }
};

window.deleteOrder = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa đơn hàng này không?")) {
        const orderDoc = doc(db, "orders", id);
        try {
            await deleteDoc(orderDoc);
        } catch (error) {
            console.error("Lỗi khi xóa đơn hàng: ", error);
        }
    }
};