// Orders Management JavaScript

let currentPage = 1;
let orderModal;
let orderDetailModal;
let orderDetails = [];
let productsCache = [];
let employeesCache = [];

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  try {
    const result = await AuthAPI.checkAuth();
    if (result.authenticated) {
      updatePageNavbar(result.user);
    }
  } catch (error) {
    // Not logged in
  }

  orderModal = new bootstrap.Modal(document.getElementById("orderModal"));
  orderDetailModal = new bootstrap.Modal(
    document.getElementById("orderDetailModal")
  );

  loadOrders();
  loadEmployeesForSelect();
  loadProductsForSelect();

  // Update total when discount changes
  document
    .getElementById("giamgia")
    .addEventListener("input", updateOrderTotal);
});

// Update navbar with user info
function updatePageNavbar(user) {
  const authNav = document.getElementById("authNav");
  if (!authNav) return;

  const roleLabels = {
    admin: "Quản trị viên",
    nhanvien: "Nhân viên",
    khachhang: "Khách hàng",
  };

  authNav.innerHTML = `
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle"></i> ${user.hoten}
                <span class="badge bg-secondary">${
                  roleLabels[user.vaitro]
                }</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
                <li><h6 class="dropdown-header">${user.tendangnhap}</h6></li>
                <li><hr class="dropdown-divider"></li>
                <li>
                    <a class="dropdown-item" href="#" onclick="handlePageLogout(); return false;">
                        <i class="bi bi-box-arrow-right"></i> Đăng xuất
                    </a>
                </li>
            </ul>
        </li>
    `;

  // Show admin menu if user is admin
  if (user.vaitro === "admin") {
    const adminNav = document.getElementById("adminNav");
    if (adminNav) adminNav.style.display = "block";
  }
}

// Handle logout
async function handlePageLogout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    try {
      await AuthAPI.logout();
      localStorage.removeItem("user");
      showAlert("success", "Đăng xuất thành công!");
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    } catch (error) {
      // Error already shown by API
    }
  }
}

async function loadOrders(page = 1) {
  currentPage = page;
  const tableBody = document.getElementById("ordersTableBody");

  showLoading(tableBody);

  try {
    const response = await OrderAPI.getAll(page, 10);

    if (response.success && response.data.length > 0) {
      tableBody.innerHTML = response.data
        .map(
          (order) => `
                <tr>
                    <td>#DH${String(order.sodh).padStart(3, "0")}</td>
                    <td>${formatDateTime(order.ngay_dat)}</td>
                    <td>${order.nguoi_nhan || "-"}</td>
                    <td>${formatCurrency(order.tong_tien || 0)}</td>
                    <td>${formatCurrency(order.giam_gia || 0)}</td>
                    <td class="fw-bold text-success">${formatCurrency(
                      order.tong_tien || 0
                    )}</td>
                    <td>
                        <span class="badge bg-${getStatusColor(
                          order.trang_thai
                        )}">${getStatusLabel(order.trang_thai)}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewOrderDetail(${
                          order.sodh
                        })" title="Xem chi tiết">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteOrder(${
                          order.sodh
                        })" title="Xóa">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `
        )
        .join("");

      renderPagination(response.pagination);
    } else {
      showEmptyState(tableBody, "Chưa có đơn hàng nào");
      document.getElementById("pagination").innerHTML = "";
    }
  } catch (error) {
    console.error("Error loading orders:", error);
  }
}

function renderPagination(pagination) {
  const paginationEl = document.getElementById("pagination");
  let html = "";

  html += `
        <li class="page-item ${pagination.page === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="loadOrders(${
              pagination.page - 1
            }); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

  for (let i = 1; i <= pagination.totalPages; i++) {
    if (
      i === 1 ||
      i === pagination.totalPages ||
      (i >= pagination.page - 2 && i <= pagination.page + 2)
    ) {
      html += `
                <li class="page-item ${i === pagination.page ? "active" : ""}">
                    <a class="page-link" href="#" onclick="loadOrders(${i}); return false;">${i}</a>
                </li>
            `;
    } else if (i === pagination.page - 3 || i === pagination.page + 3) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  html += `
        <li class="page-item ${
          pagination.page === pagination.totalPages ? "disabled" : ""
        }">
            <a class="page-link" href="#" onclick="loadOrders(${
              pagination.page + 1
            }); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

  paginationEl.innerHTML = html;
}

async function loadEmployeesForSelect() {
  try {
    const response = await EmployeeAPI.getAll();
    if (response.success) {
      employeesCache = response.data;
      const select = document.getElementById("manv");
      select.innerHTML =
        '<option value="">-- Chọn nhân viên --</option>' +
        response.data
          .map((emp) => `<option value="${emp.manv}">${emp.hoten}</option>`)
          .join("");
    }
  } catch (error) {
    console.error("Error loading employees:", error);
  }
}

async function loadProductsForSelect() {
  try {
    const response = await ProductAPI.getAll(1, 1000);
    if (response.success) {
      productsCache = response.data;
    }
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function openAddModal() {
  document.getElementById("modalTitle").textContent = "Tạo đơn hàng";
  document.getElementById("orderForm").reset();
  document.getElementById("sodh").value = "";
  document.getElementById("ngaylao").value = new Date()
    .toISOString()
    .slice(0, 16);
  orderDetails = [];
  renderOrderDetailsTable();
}

function addOrderDetail() {
  const row = {
    masp: "",
    sl: 1,
    gia: 0,
  };
  orderDetails.push(row);
  renderOrderDetailsTable();
}

function removeOrderDetail(index) {
  orderDetails.splice(index, 1);
  renderOrderDetailsTable();
}

function updateOrderDetail(index, field, value) {
  orderDetails[index][field] = value;

  if (field === "masp") {
    const product = productsCache.find((p) => p.masp == value);
    if (product) {
      orderDetails[index].gia = product.giaban;
    }
  }

  renderOrderDetailsTable();
}

function renderOrderDetailsTable() {
  const tbody = document.getElementById("orderDetailsTable");

  if (orderDetails.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">Chưa có sản phẩm nào</td></tr>';
    updateOrderTotal();
    return;
  }

  tbody.innerHTML = orderDetails
    .map((item, index) => {
      const thanhtien = item.sl * item.gia;
      return `
            <tr>
                <td>
                    <select class="form-select form-select-sm" onchange="updateOrderDetail(${index}, 'masp', this.value)" required>
                        <option value="">-- Chọn sản phẩm --</option>
                        ${productsCache
                          .map(
                            (p) => `
                            <option value="${p.masp}" ${
                              item.masp == p.masp ? "selected" : ""
                            }>
                                ${p.tensp} - ${formatCurrency(p.giaban)}
                            </option>
                        `
                          )
                          .join("")}
                    </select>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm" value="${
                      item.sl
                    }" 
                           min="1" onchange="updateOrderDetail(${index}, 'sl', this.value)" required>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm" value="${
                      item.gia
                    }" 
                           min="0" onchange="updateOrderDetail(${index}, 'gia', this.value)" required>
                </td>
                <td>${formatCurrency(thanhtien)}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeOrderDetail(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    })
    .join("");

  updateOrderTotal();
}

function updateOrderTotal() {
  const total = orderDetails.reduce((sum, item) => sum + item.sl * item.gia, 0);
  const discount = parseFloat(document.getElementById("giamgia").value) || 0;
  const final = total - discount;

  document.getElementById("totalAmount").textContent = formatCurrency(total);
  document.getElementById("discountAmount").textContent =
    formatCurrency(discount);
  document.getElementById("finalAmount").textContent = formatCurrency(final);
}

async function saveOrder() {
  if (orderDetails.length === 0) {
    showAlert("warning", "Vui lòng thêm ít nhất một sản phẩm");
    return;
  }

  // Validate all products are selected
  for (let item of orderDetails) {
    if (!item.masp || item.sl <= 0 || item.gia < 0) {
      showAlert("warning", "Vui lòng điền đầy đủ thông tin sản phẩm");
      return;
    }
  }

  const data = {
    ngaylao: document.getElementById("ngaylao").value,
    giamgia: parseFloat(document.getElementById("giamgia").value) || 0,
    manv: document.getElementById("manv").value || null,
    chitiet: orderDetails.map((item) => ({
      masp: parseInt(item.masp),
      sl: parseInt(item.sl),
      gia: parseFloat(item.gia),
    })),
  };

  try {
    const response = await OrderAPI.create(data);

    if (response.success) {
      showAlert("success", response.message);
      orderModal.hide();
      loadOrders(currentPage);
    }
  } catch (error) {
    console.error("Error saving order:", error);
  }
}

async function viewOrderDetail(sodh) {
  const content = document.getElementById("orderDetailContent");
  document.getElementById("detailOrderId").textContent = sodh;

  showLoading(content);
  orderDetailModal.show();

  try {
    const response = await OrderAPI.getById(sodh);

    if (response.success) {
      const order = response.data;
      content.innerHTML = `
                <div class="row mb-3">
                    <div class="col-md-6">
                        <h6>Thông tin đơn hàng</h6>
                        <p class="mb-1"><strong>Ngày đặt:</strong> ${formatDateTime(
                          order.ngay_dat
                        )}</p>
                        <p class="mb-1"><strong>Trạng thái:</strong> 
                            <span class="badge bg-${getStatusColor(
                              order.trang_thai
                            )}">
                                ${getStatusLabel(order.trang_thai)}
                            </span>
                        </p>
                        <p class="mb-1"><strong>Phương thức TT:</strong> ${getPaymentLabel(
                          order.phuong_thuc_thanh_toan
                        )}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Thông tin giao hàng</h6>
                        <p class="mb-1"><strong>Người nhận:</strong> ${
                          order.nguoi_nhan
                        }</p>
                        <p class="mb-1"><strong>SĐT:</strong> ${
                          order.sdt_nhan
                        }</p>
                        <p class="mb-1"><strong>Địa chỉ:</strong> ${
                          order.diachi_nhan
                        }</p>
                    </div>
                </div>
                
                <h6>Chi tiết sản phẩm:</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead class="table-light">
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Giá</th>
                                <th>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.chitiet
                              .map(
                                (item) => `
                                <tr>
                                    <td>${item.tensp}</td>
                                    <td>${item.sl}</td>
                                    <td>${formatCurrency(item.gia)}</td>
                                    <td>${formatCurrency(
                                      item.sl * item.gia
                                    )}</td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                        <tfoot class="table-light">
                            <tr>
                                <td colspan="3" class="text-end"><strong>Phí vận chuyển:</strong></td>
                                <td><strong>${formatCurrency(
                                  order.phi_vanchuyen || 0
                                )}</strong></td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Giảm giá:</strong></td>
                                <td><strong class="text-danger">-${formatCurrency(
                                  order.giam_gia || 0
                                )}</strong></td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Tổng thanh toán:</strong></td>
                                <td><strong class="text-success fs-5">${formatCurrency(
                                  order.tong_tien
                                )}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div class="mt-3">
                    ${
                      order.trang_thai === "pending"
                        ? `
                        <button class="btn btn-success me-2" onclick="updateOrderStatus(${order.sodh}, 'confirmed')">
                            <i class="bi bi-check-circle"></i> Xác nhận đơn
                        </button>
                    `
                        : ""
                    }
                    ${
                      order.trang_thai === "confirmed"
                        ? `
                        <button class="btn btn-info me-2" onclick="updateOrderStatus(${order.sodh}, 'shipping')">
                            <i class="bi bi-truck"></i> Đang giao hàng
                        </button>
                    `
                        : ""
                    }
                    ${
                      order.trang_thai === "shipping"
                        ? `
                        <button class="btn btn-success me-2" onclick="updateOrderStatus(${order.sodh}, 'delivered')">
                            <i class="bi bi-check2-circle"></i> Đã giao hàng
                        </button>
                    `
                        : ""
                    }
                    ${
                      order.trang_thai === "pending" ||
                      order.trang_thai === "confirmed"
                        ? `
                        <button class="btn btn-danger" onclick="updateOrderStatus(${order.sodh}, 'cancelled')">
                            <i class="bi bi-x-circle"></i> Hủy đơn
                        </button>
                    `
                        : ""
                    }
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading order detail:", error);
    content.innerHTML =
      '<div class="alert alert-danger">Không thể tải chi tiết đơn hàng</div>';
  }
}

async function deleteOrder(sodh) {
  const confirmed = await confirmDelete(
    "Bạn có chắc chắn muốn xóa đơn hàng này?"
  );

  if (confirmed) {
    try {
      const response = await OrderAPI.delete(sodh);

      if (response.success) {
        showAlert("success", response.message);
        loadOrders(currentPage);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
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

// Get status color
function getStatusColor(status) {
  const colors = {
    pending: "warning",
    confirmed: "info",
    processing: "primary",
    shipping: "primary",
    delivered: "success",
    cancelled: "danger",
  };
  return colors[status] || "secondary";
}

// Get payment method label
function getPaymentLabel(method) {
  const labels = {
    cod: "Thanh toán khi nhận hàng (COD)",
    bank_transfer: "Chuyển khoản ngân hàng",
    credit_card: "Thẻ tín dụng/ghi nợ",
    momo: "Ví MoMo",
  };
  return labels[method] || method;
}

// Update order status
async function updateOrderStatus(sodh, newStatus) {
  const confirmMessages = {
    confirmed: "Bạn có chắc chắn muốn xác nhận đơn hàng này?",
    shipping: "Bạn có chắc chắn đơn hàng đang được giao?",
    delivered: "Xác nhận đơn hàng đã giao thành công?",
    cancelled: "Bạn có chắc chắn muốn hủy đơn hàng này?",
  };

  if (!confirm(confirmMessages[newStatus])) {
    return;
  }

  try {
    const response = await OrderAPI.updateStatus(sodh, newStatus);

    if (response.success) {
      showAlert("success", "Cập nhật trạng thái thành công!");

      // Reload order detail modal
      orderDetailModal.hide();

      // Reload orders table
      loadOrders(currentPage);
    } else {
      showAlert("error", response.message || "Không thể cập nhật trạng thái");
    }
  } catch (error) {
    console.error("Error updating status:", error);
    showAlert("error", "Lỗi khi cập nhật trạng thái");
  }
}
