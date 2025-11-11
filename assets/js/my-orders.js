// My Orders JavaScript

let currentUser = null;
let allOrders = [];
let currentFilter = "all";

// Initialize
document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  try {
    const result = await AuthAPI.checkAuth();
    if (result.authenticated) {
      currentUser = result.user;
      updateNavbar(result.user);

      // Show admin menu if admin
      if (result.user.vaitro === "admin") {
        const adminMenu = document.getElementById("adminMenu");
        if (adminMenu) adminMenu.style.display = "block";
      }
    } else {
      // Redirect to login
      showNotification("warning", "Vui lòng đăng nhập để xem đơn hàng");
      setTimeout(() => {
        window.location.href = "../login.html?redirect=my-orders.html";
      }, 1500);
      return;
    }
  } catch (error) {
    showNotification("error", "Không thể xác thực. Vui lòng đăng nhập lại.");
    setTimeout(() => {
      window.location.href = "../login.html";
    }, 1500);
    return;
  }

  // Load cart count
  loadCartCount();

  // Ensure the default filter button ('all') shows as active on load
  const defaultBtn = document.querySelector('.filter-tabs [data-status="all"]');
  if (defaultBtn) {
    // remove active from any others just in case
    document
      .querySelectorAll(".filter-tabs .btn")
      .forEach((b) => b.classList.remove("active"));
    defaultBtn.classList.add("active");
  }

  // Load orders
  await loadOrders();
});

// Update navbar
function updateNavbar(user) {
  const authNav = document.getElementById("authNav");
  if (!authNav) return;

  const roleLabels = {
    admin: "Quản trị viên",
    nhanvien: "Nhân viên",
    khachhang: "Khách hàng",
  };

  const roleColors = {
    admin: "danger",
    nhanvien: "info",
    khachhang: "success",
  };

  authNav.innerHTML = `
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
        <i class="bi bi-person-circle"></i> ${user.hoten}
        <span class="badge bg-${roleColors[user.vaitro]} ms-1">${
    roleLabels[user.vaitro]
  }</span>
      </a>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><h6 class="dropdown-header">${user.tendangnhap}</h6></li>
        <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person-circle"></i> Chỉnh sửa thông tin</a></li>
        <li><a class="dropdown-item" href="my-orders.html"><i class="bi bi-box-seam"></i> Đơn hàng của tôi</a></li>
        <li><hr class="dropdown-divider"></li>
        <li>
          <a class="dropdown-item" href="#" onclick="handleLogout(); return false;">
            <i class="bi bi-box-arrow-right"></i> Đăng xuất
          </a>
        </li>
      </ul>
    </li>
  `;
}

// Handle logout
async function handleLogout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    try {
      await AuthAPI.logout();
      localStorage.removeItem("user");
      showNotification("success", "Đăng xuất thành công!");
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }
}

// Load cart count
function loadCartCount() {
  const count = CartManager.count();
  const badge = document.getElementById("cartCountNav");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "block" : "none";
  }
}

// Load orders
async function loadOrders() {
  try {
    // Lấy đơn hàng của user từ API
    const response = await OrderAPI.getByUser(currentUser.mand);

    if (response.success && response.data) {
      allOrders = response.data;
      displayOrders(allOrders);
    } else {
      showEmptyState("Bạn chưa có đơn hàng nào");
    }
  } catch (error) {
    console.error("Error loading orders:", error);
    showEmptyState("Không thể tải đơn hàng");
  }
}

// Filter orders
function filterOrders(status, el) {
  currentFilter = status;

  // Update button states: remove active from all buttons
  document.querySelectorAll(".filter-tabs .btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Mark clicked element as active
  if (el) {
    el.classList.add("active");
  }

  // Filter and display
  const filtered =
    status === "all"
      ? allOrders
      : allOrders.filter((order) => order.trang_thai === status);

  displayOrders(filtered);
}

// Display orders
function displayOrders(orders) {
  const container = document.getElementById("ordersContainer");

  if (orders.length === 0) {
    showEmptyState("Không có đơn hàng nào");
    return;
  }

  container.innerHTML = orders
    .map(
      (order) => `
    <div class="order-card">
      <div class="order-header">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h6 class="mb-1">
              <i class="bi bi-receipt"></i> Đơn hàng #DH${String(
                order.sodh
              ).padStart(3, "0")}
            </h6>
            <p class="text-muted small mb-0">
              <i class="bi bi-clock"></i> ${formatDateTime(order.ngay_dat)}
            </p>
          </div>
          <div class="col-md-4 text-end">
            <span class="order-status status-${order.trang_thai}">
              ${getStatusLabel(order.trang_thai)}
            </span>
          </div>
        </div>
      </div>

      <div class="order-body">
        ${order.chi_tiet
          .map(
            (item) => `
          <div class="order-item-row">
            <div class="d-flex justify-content-between">
              <div>
                <strong>${item.tensp}</strong>
                <p class="text-muted small mb-0">
                  ${formatCurrency(item.gia - item.giam_gia)} x ${item.sl}
                </p>
              </div>
              <div class="text-end">
                <strong>${formatCurrency(
                  (item.gia - item.giam_gia) * item.sl
                )}</strong>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="order-footer mt-3 pt-3 border-top">
        <div class="row align-items-center">
          <div class="col-md-6">
            <p class="mb-0">
              <i class="bi bi-credit-card"></i> ${getPaymentLabel(
                order.phuong_thuc_thanh_toan
              )}
            </p>
          </div>
          <div class="col-md-6 text-end">
            <p class="mb-2">
              Tổng cộng: <strong class="text-danger fs-5">${formatCurrency(
                order.tong_tien
              )}</strong>
            </p>
            <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetail(${
              order.sodh
            })">
              <i class="bi bi-eye"></i> Xem chi tiết
            </button>
            ${
              order.trang_thai === "pending" || order.trang_thai === "confirmed"
                ? `
              <button class="btn btn-sm btn-outline-danger" onclick="cancelOrder(${order.sodh})">
                <i class="bi bi-x-circle"></i> Hủy đơn
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

// View order detail
function viewOrderDetail(sodh) {
  const order = allOrders.find((o) => o.sodh === sodh);
  if (!order) return;

  const modalBody = document.getElementById("orderDetailBody");

  modalBody.innerHTML = `
    <div class="mb-3">
      <h6>Thông tin đơn hàng</h6>
      <p><strong>Mã đơn:</strong> #DH${String(order.sodh).padStart(3, "0")}</p>
      <p><strong>Ngày đặt:</strong> ${formatDateTime(order.ngay_dat)}</p>
      <p><strong>Trạng thái:</strong> <span class="order-status status-${
        order.trang_thai
      }">${getStatusLabel(order.trang_thai)}</span></p>
    </div>

    <div class="mb-3">
      <h6>Thông tin người nhận</h6>
      <p><strong>Họ tên:</strong> ${order.nguoi_nhan}</p>
      <p><strong>Số điện thoại:</strong> ${order.sdt_nhan}</p>
      <p><strong>Địa chỉ:</strong> ${order.diachi_nhan}</p>
    </div>

    <div class="mb-3">
      <h6>Chi tiết sản phẩm</h6>
      <table class="table">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Đơn giá</th>
            <th>Số lượng</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${order.chi_tiet
            .map(
              (item) => `
            <tr>
              <td>${item.tensp}</td>
              <td>${formatCurrency(item.gia - item.giam_gia)}</td>
              <td>${item.sl}</td>
              <td>${formatCurrency((item.gia - item.giam_gia) * item.sl)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="text-end">
      <h5>Tổng cộng: <span class="text-danger">${formatCurrency(
        order.tong_tien
      )}</span></h5>
    </div>
  `;

  const modal = new bootstrap.Modal(
    document.getElementById("orderDetailModal")
  );
  modal.show();
}

// Cancel order
async function cancelOrder(sodh) {
  if (
    confirm(
      "Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác."
    )
  ) {
    try {
      // Gọi API để hủy đơn hàng
      const response = await OrderAPI.updateStatus(sodh, "cancelled");

      if (response.success) {
        showNotification("success", "Đã hủy đơn hàng thành công");

        // Cập nhật lại danh sách đơn hàng
        const order = allOrders.find((o) => o.sodh === sodh);
        if (order) {
          order.trang_thai = "cancelled";
          displayOrders(
            currentFilter === "all"
              ? allOrders
              : allOrders.filter((o) => o.trang_thai === currentFilter)
          );
        }
      } else {
        showNotification("error", "Không thể hủy đơn hàng");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      showNotification("error", "Lỗi khi hủy đơn hàng");
    }
  }
}

// Get status label
function getStatusLabel(status) {
  const labels = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    processing: "Đang xử lý",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
  };
  return labels[status] || status;
}

// Get payment label
function getPaymentLabel(method) {
  const labels = {
    cod: "Thanh toán khi nhận hàng",
    bank_transfer: "Chuyển khoản ngân hàng",
    credit_card: "Thẻ tín dụng",
    momo: "Ví MoMo",
  };
  return labels[method] || method;
}

// Show empty state
function showEmptyState(message) {
  const container = document.getElementById("ordersContainer");
  container.innerHTML = `
    <div class="text-center py-5">
      <i class="bi bi-inbox" style="font-size: 4rem; color: #ccc"></i>
      <p class="mt-3 text-muted">${message}</p>
      <a href="shop.html" class="btn btn-primary mt-2">Mua sắm ngay
      </a>
    </div>
  `;
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN");
}

function showNotification(type, message) {
  const alertTypes = {
    success: "alert-success",
    error: "alert-danger",
    warning: "alert-warning",
    info: "alert-info",
  };

  const alertHtml = `
    <div class="alert ${
      alertTypes[type] || "alert-info"
    } alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" 
         role="alert" style="z-index: 9999; min-width: 300px;">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", alertHtml);

  setTimeout(() => {
    const alert = document.querySelector(".alert");
    if (alert) alert.remove();
  }, 3000);
}
