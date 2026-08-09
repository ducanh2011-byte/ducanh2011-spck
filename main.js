// main.js
import { 
    db, 
    collection, 
    addDoc, 
    onSnapshot, 
    updateDoc, 
    deleteDoc, 
    doc, 
    products 
} from "./firebase-config.js";

const ordersRef = collection(db, "orders");
const STATUS_OPTIONS = ["Chờ xử lý", "Đang pha chế", "Đang giao", "Đã giao"];

// 1. RENDER THỰC ĐƠN TỰ ĐỘNG TỪ MẢNG PRODUCTS
function renderMenu() {
    const menuContainer = document.getElementById("menuContainer");
    if (!menuContainer) return;

    menuContainer.innerHTML = products.map(item => `
        <div class="bg-white rounded-xl shadow overflow-hidden flex flex-col justify-between hover:shadow-lg transition">
            <img src="${item.image}" alt="${item.name}" class="w-full h-48 object-cover bg-gray-200">
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-bold text-gray-800">${item.name}</h3>
                    <p class="text-blue-600 font-bold text-md mt-1">${item.price.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <button onclick="window.quickOrder('${item.name}', ${item.price})" class="mt-4 w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-lg font-medium transition text-sm">
                    🛒 Đặt món ngay
                </button>
            </div>
        </div>
    `).join('');
}

// Gọi render Menu ngay khi file nạp xong
renderMenu();

// 2. KHỞI TẠO CÁC HÀM XỬ LÝ GIAO DIỆN (Gắn vào window để gọi từ HTML)
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
    document.getElementById("product").value = productName;
    document.getElementById("total").value = price;
    window.toggleModal(true);
};

// 3. LẮNG NGHE REALTIME FIRESTORE
onSnapshot(ordersRef, (snapshot) => {
    const tableBody = document.getElementById("orderTableBody");
    if (!tableBody) return;
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
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.customerName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.product}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${Number(order.total).toLocaleString('vi-VN')} đ</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                        ${order.status}
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

// 4. CÁC THAO TÁC CRUD
window.addOrder = async (event) => {
    event.preventDefault();
    const customerName = document.getElementById("customerName").value;
    const product = document.getElementById("product").value;
    const total = document.getElementById("total").value;
    const status = document.getElementById("status").value;

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