// Cart Management JavaScript - Professional Version

let cart = [];
let currentUser = null;
let appliedCoupon = null;
const SHIPPING_FEE = 30000;
const FREE_SHIPPING_THRESHOLD = 300000;

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
    }
  } catch (error) {
    console.log("User not logged in");
  }

  // Load cart (sử dụng CartManager từ api.js)
  loadCartFromStorage();
  updateCartCount();
  displayCart();
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
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }
}

// Load cart from storage (sử dụng CartManager)
function loadCartFromStorage() {
  cart = CartManager.load();
}

// Save cart to storage (sử dụng CartManager)
function saveCartToStorage() {
  CartManager.save(cart);
}

// Update cart count
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById("cartCountNav");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "block" : "none";
  }
}

// Display cart
function displayCart() {
  const container = document.getElementById("cartItemsContainer");

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x" style="font-size: 4rem; color: #ccc"></i>
        <p class="mt-3 text-muted">Giỏ hàng trống</p>
        <a href="shop.html" class="btn btn-primary">
          <i class="bi bi-shop"></i> Tiếp tục mua sắm
        </a>
      </div>
    `;
    updateSummary();
    return;
  }

  container.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="row align-items-center">
        <div class="col-md-2">
          <div class="cart-item-image">
            ${
              item.hinhsp
                ? `<img src="../uploads/products/${item.hinhsp}" 
                        alt="${item.tensp}"
                        style="max-width: 100%; max-height: 100px; object-fit: contain; border-radius: 8px;"
                        onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'bi bi-image\\' style=\\'font-size: 2.5rem; color: #ccc\\'></i>';">`
                : '<i class="bi bi-image" style="font-size: 2.5rem; color: #ccc"></i>'
            }
          </div>
        </div>
        
        <div class="col-md-4">
          <h6 class="mb-1">${item.tensp}</h6>
          <p class="text-muted small mb-0">
            ${formatCurrency(item.giaban - item.giamgia)} / sản phẩm
          </p>
          ${
            item.giamgia > 0
              ? `<span class="badge bg-danger">Giảm ${formatCurrency(
                  item.giamgia
                )}</span>`
              : ""
          }
        </div>
        
        <div class="col-md-3">
          <div class="quantity-control">
            <button class="btn btn-sm btn-outline-secondary" onclick="decreaseQuantity(${
              item.masp
            })">
              <i class="bi bi-dash"></i>
            </button>
            <input type="text" class="form-control form-control-sm" value="${
              item.quantity
            }" readonly>
            <button class="btn btn-sm btn-outline-secondary" onclick="increaseQuantity(${
              item.masp
            })">
              <i class="bi bi-plus"></i>
            </button>
          </div>
        </div>
        
        <div class="col-md-2 text-end">
          <h6 class="text-danger mb-0">${formatCurrency(
            (item.giaban - item.giamgia) * item.quantity
          )}</h6>
        </div>
        
        <div class="col-md-1 text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${
            item.masp
          })">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  updateSummary();
}

// Increase quantity
function increaseQuantity(masp) {
  const item = cart.find((i) => i.masp === masp);
  if (item) {
    item.quantity++;
    saveCartToStorage();
    updateCartCount();
    displayCart();
  }
}

// Decrease quantity
function decreaseQuantity(masp) {
  const item = cart.find((i) => i.masp === masp);
  if (item) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      if (confirm("Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?")) {
        removeFromCart(masp);
        return;
      }
    }
    saveCartToStorage();
    updateCartCount();
    displayCart();
  }
}

// Remove from cart
function removeFromCart(masp) {
  cart = cart.filter((item) => item.masp !== masp);
  saveCartToStorage();
  updateCartCount();
  displayCart();
  showNotification("success", "Đã xóa sản phẩm khỏi giỏ hàng");
}

// Clear cart
function clearCart() {
  if (cart.length === 0) {
    showNotification("info", "Giỏ hàng đã trống");
    return;
  }

  if (confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm?")) {
    cart = [];
    appliedCoupon = null;
    saveCartToStorage();
    updateCartCount();
    displayCart();
    showNotification("success", "Đã xóa tất cả sản phẩm");
  }
}

// Apply coupon
async function applyCoupon() {
  const couponCode = document.getElementById("couponCode").value.trim();
  if (!couponCode) {
    showNotification("warning", "Vui lòng nhập mã giảm giá");
    return;
  }

  // Mock coupon validation (in real app, call API)
  const coupons = {
    KHACHMOI50: { type: "fixed", value: 50000, minOrder: 200000 },
    VITAMIN20: { type: "percent", value: 20, minOrder: 300000 },
    FREESHIP: { type: "fixed", value: 30000, minOrder: 500000 },
  };

  const coupon = coupons[couponCode.toUpperCase()];
  if (!coupon) {
    showNotification("error", "Mã giảm giá không hợp lệ");
    return;
  }

  const subtotal = calculateSubtotal();
  if (subtotal < coupon.minOrder) {
    showNotification(
      "warning",
      `Đơn hàng tối thiểu ${formatCurrency(coupon.minOrder)} để sử dụng mã này`
    );
    return;
  }

  appliedCoupon = { code: couponCode.toUpperCase(), ...coupon };
  document.getElementById(
    "couponMessage"
  ).textContent = `✓ Đã áp dụng mã ${appliedCoupon.code}`;
  showNotification("success", "Áp dụng mã giảm giá thành công!");
  updateSummary();
}

// Calculate subtotal
function calculateSubtotal() {
  return cart.reduce(
    (sum, item) => sum + (item.giaban - item.giamgia) * item.quantity,
    0
  );
}

// Calculate discount
function calculateDiscount() {
  if (!appliedCoupon) return 0;

  const subtotal = calculateSubtotal();

  if (appliedCoupon.type === "fixed") {
    return appliedCoupon.value;
  } else if (appliedCoupon.type === "percent") {
    return Math.floor((subtotal * appliedCoupon.value) / 100);
  }

  return 0;
}

// Calculate shipping fee
function calculateShippingFee() {
  const subtotal = calculateSubtotal();

  // Special coupon: FREESHIP
  if (appliedCoupon && appliedCoupon.code === "FREESHIP") {
    return 0;
  }

  // Free shipping for orders >= 300k
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  return SHIPPING_FEE;
}

// Update summary
function updateSummary() {
  const subtotal = calculateSubtotal();
  const discount = calculateDiscount();
  const shippingFee = calculateShippingFee();
  const total = subtotal - discount + shippingFee;

  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("discount").textContent =
    discount > 0 ? `-${formatCurrency(discount)}` : "0₫";
  document.getElementById("shippingFee").innerHTML =
    shippingFee > 0
      ? formatCurrency(shippingFee)
      : '<span class="text-success">Miễn phí</span>';
  document.getElementById("totalAmount").textContent = formatCurrency(total);
}

// Proceed to checkout
function proceedToCheckout() {
  if (cart.length === 0) {
    showNotification("warning", "Giỏ hàng trống");
    return;
  }

  // Check if user is logged in
  if (!currentUser) {
    showNotification("warning", "Vui lòng đăng nhập để đặt hàng");
    setTimeout(() => {
      window.location.href = "../login.html?redirect=cart.html";
    }, 1500);
    return;
  }

  // Save checkout data
  const checkoutData = {
    items: cart,
    subtotal: calculateSubtotal(),
    discount: calculateDiscount(),
    shippingFee: calculateShippingFee(),
    total: calculateSubtotal() - calculateDiscount() + calculateShippingFee(),
    coupon: appliedCoupon,
  };

  localStorage.setItem("checkoutData", JSON.stringify(checkoutData));

  // Redirect to checkout
  window.location.href = "checkout.html";
}

// Utility functions
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

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
