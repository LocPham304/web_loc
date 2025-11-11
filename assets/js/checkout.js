// Checkout JavaScript

let checkoutData = null;
let currentUser = null;
let selectedPaymentMethod = "cod";

// Initialize
document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  try {
    const result = await AuthAPI.checkAuth();
    if (result.authenticated) {
      currentUser = result.user;
      // Pre-fill form with user data
      prefillUserData(result.user);
    } else {
      // Redirect to login if not authenticated
      showNotification("warning", "Vui lòng đăng nhập để thanh toán");
      setTimeout(() => {
        window.location.href = "../login.html?redirect=checkout.html";
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

  // Load checkout data
  loadCheckoutData();
});

// Prefill user data
function prefillUserData(user) {
  document.getElementById("fullName").value = user.hoten || "";
  document.getElementById("phone").value = user.sodienthoai || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("address").value = user.diachi || "";
}

// Load checkout data
function loadCheckoutData() {
  const saved = localStorage.getItem("checkoutData");
  if (!saved) {
    showNotification("error", "Không tìm thấy thông tin đơn hàng");
    setTimeout(() => {
      window.location.href = "cart.html";
    }, 1500);
    return;
  }

  checkoutData = JSON.parse(saved);
  displayOrderSummary();
}

// Display order summary
function displayOrderSummary() {
  const container = document.getElementById("orderItemsList");

  container.innerHTML = checkoutData.items
    .map(
      (item) => `
    <div class="order-item">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h6 class="mb-1">${item.tensp}</h6>
          <p class="text-muted small mb-0">
            ${formatCurrency(item.giaban - item.giamgia)} x ${item.quantity}
          </p>
        </div>
        <div class="text-end">
          <strong>${formatCurrency(
            (item.giaban - item.giamgia) * item.quantity
          )}</strong>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  // Update summary
  document.getElementById("summarySubtotal").textContent = formatCurrency(
    checkoutData.subtotal
  );
  document.getElementById("summaryDiscount").textContent =
    checkoutData.discount > 0
      ? `-${formatCurrency(checkoutData.discount)}`
      : "0₫";
  document.getElementById("summaryShipping").innerHTML =
    checkoutData.shippingFee > 0
      ? formatCurrency(checkoutData.shippingFee)
      : '<span class="text-success">Miễn phí</span>';
  document.getElementById("summaryTotal").textContent = formatCurrency(
    checkoutData.total
  );
}

// Select payment method
function selectPaymentMethod(method, element) {
  selectedPaymentMethod = method;

  // Update UI
  document.querySelectorAll(".payment-method").forEach((el) => {
    el.classList.remove("active");
  });
  element.classList.add("active");

  // Update radio button
  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.checked = radio.value === method;
  });
}

// Place order
async function placeOrder() {
  // Validate form
  const form = document.getElementById("checkoutForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Get form data
  const orderData = {
    mand: currentUser.mand,
    nguoi_nhan: document.getElementById("fullName").value,
    sdt_nhan: document.getElementById("phone").value,
    diachi_nhan: document.getElementById("address").value,
    phi_vanchuyen: checkoutData.shippingFee,
    ma_giam_gia: checkoutData.coupon?.code || null,
    giam_gia: checkoutData.discount,
    tong_tien: checkoutData.total,
    ghi_chu: document.getElementById("notes").value,
    phuong_thuc_thanh_toan: selectedPaymentMethod,
    trang_thai: "pending",
    chi_tiet: checkoutData.items.map((item) => ({
      masp: item.masp,
      sl: item.quantity,
      gia: item.giaban,
      giam_gia: item.giamgia,
    })),
  };

  // Disable button
  const btn = document.getElementById("placeOrderBtn");
  btn.disabled = true;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';

  try {
    // Call API to create order
    const response = await OrderAPI.create(orderData);

    if (response.success) {
      // Clear cart (sử dụng CartManager)
      CartManager.clear();
      localStorage.removeItem("checkoutData");

      // Show success modal with real order code
      const orderCode = "DH" + String(response.sodh).padStart(6, "0");
      document.getElementById("orderCode").textContent = "#" + orderCode;

      const modal = new bootstrap.Modal(
        document.getElementById("successModal")
      );
      modal.show();

      // Prevent closing modal by clicking outside
      document
        .getElementById("successModal")
        .addEventListener("hide.bs.modal", function (e) {
          e.preventDefault();
        });
    } else {
      throw new Error(response.message || "Không thể tạo đơn hàng");
    }
  } catch (error) {
    console.error("Order error:", error);
    showNotification("error", "Đặt hàng thất bại. Vui lòng thử lại.");

    // Re-enable button
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-circle"></i> Đặt hàng';
  }
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
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
