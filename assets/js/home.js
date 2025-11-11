// Home Page JavaScript

let currentUser = null;
let cart = [];

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
        document.getElementById("adminMenu").style.display = "block";
      }
    }
  } catch (error) {
    // Not logged in
    console.log("User not logged in");
  }

  // Load cart from localStorage
  loadCartFromStorage();
  updateCartCount();

  // Load data
  await loadCategories();
  await loadHotProducts();
  await loadNewProducts();
});

// Update navbar with user info
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
        <li><a class="dropdown-item" href="pages/profile.html"><i class="bi bi-person-circle"></i> Chỉnh sửa thông tin</a></li>
        <li><a class="dropdown-item" href="pages/my-orders.html"><i class="bi bi-box-seam"></i> Đơn hàng của tôi</a></li>
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

// Load categories
async function loadCategories() {
  try {
    const response = await CategoryAPI.getAll();

    if (response.success && response.data.length > 0) {
      displayCategories(response.data);
    }
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

// Display categories
function displayCategories(categories) {
  const container = document.getElementById("categoriesContainer");

  const icons = [
    "bi-capsule",
    "bi-heart-pulse",
    "bi-snow",
    "bi-gem",
    "bi-clipboard-pulse",
    "bi-bandaid",
    "bi-eye",
    "bi-heart",
    "bi-stars",
    "bi-shield-check",
  ];

  container.innerHTML = categories
    .slice(0, 10)
    .map((cat, index) => {
      const icon = icons[index % icons.length];
      return `
      <div class="col-6 col-md-4 col-lg-2">
        <div class="category-card" onclick="goToCategory(${cat.madm})">
          <div class="category-icon">
            <i class="${icon}"></i>
          </div>
          <h6>${cat.tendm}</h6>
        </div>
      </div>
    `;
    })
    .join("");
}

// Load hot products (best sellers)
async function loadHotProducts() {
  try {
    const response = await ProductAPI.getAll(1, 8);

    if (response.success && response.data.length > 0) {
      displayProducts(response.data, "hotProductsContainer", true);
    } else {
      document.getElementById("hotProductsContainer").innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          <i class="bi bi-inbox" style="font-size: 3rem;"></i>
          <p class="mt-3">Chưa có sản phẩm</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading hot products:", error);
    document.getElementById("hotProductsContainer").innerHTML = `
      <div class="col-12 text-center text-danger py-5">
        <i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
        <p class="mt-3">Không thể tải sản phẩm</p>
      </div>
    `;
  }
}

// Load new products
async function loadNewProducts() {
  try {
    const response = await ProductAPI.getAll(1, 8);

    if (response.success && response.data.length > 0) {
      displayProducts(response.data, "newProductsContainer", false);
    }
  } catch (error) {
    console.error("Error loading new products:", error);
  }
}

// Display products
function displayProducts(products, containerId, showHotBadge) {
  const container = document.getElementById(containerId);

  container.innerHTML = products
    .map((product) => {
      const discountPercent =
        product.giamgia > 0
          ? Math.round((product.giamgia / product.giaban) * 100)
          : 0;
      const finalPrice = product.giaban - product.giamgia;

      return `
      <div class="col-lg-3 col-md-4 col-6">
        <div class="product-card">
          <div class="product-badge">
            ${
              showHotBadge
                ? '<span class="badge-hot"><i class="bi bi-fire"></i> Hot</span>'
                : ""
            }
            ${
              discountPercent > 0
                ? `<span class="badge-discount ms-1">-${discountPercent}%</span>`
                : ""
            }
          </div>
          
          <div class="product-image" onclick="goToProduct(${product.masp})">
            ${(() => {
              let imageSrc = product.hinhsp;
              // Try to get first image from hinhanh_arr
              if (product.hinhanh_arr) {
                try {
                  const images = JSON.parse(product.hinhanh_arr);
                  if (images && images.length > 0) {
                    imageSrc = images[0];
                  }
                } catch (e) {}
              }

              return imageSrc
                ? `<img src="uploads/products/${imageSrc}" 
                          alt="${product.tensp}" 
                          onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'bi bi-image\\' style=\\'font-size: 4rem; color: #d1d5db;\\'></i>';">`
                : '<i class="bi bi-image" style="font-size: 4rem; color: #d1d5db;"></i>';
            })()}
          </div>
          
          <div class="product-body">
            <span class="product-category">${
              product.tendm || "Chưa phân loại"
            }</span>
            <h6 class="product-title" onclick="goToProduct(${product.masp})">${
        product.tensp
      }</h6>
            
            <div class="product-meta">
              <span><i class="bi bi-eye"></i> ${product.luot_xem || 0}</span>
              <span><i class="bi bi-cart-check"></i> ${
                product.luot_ban || 0
              }</span>
            </div>
            
            <div class="product-price">
              <span class="price-current">${formatCurrency(finalPrice)}</span>
              ${
                discountPercent > 0
                  ? `<span class="price-original">${formatCurrency(
                      product.giaban
                    )}</span>`
                  : ""
              }
            </div>
            
            <div class="product-actions">
              <button class="btn-add-cart" onclick="addToCart(${
                product.masp
              }, event)">
                Thêm
              </button>
              <button class="btn-quick-view" onclick="goToProduct(${
                product.masp
              })">
                <i class="bi bi-eye"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

// Add to cart
async function addToCart(masp, event) {
  if (event) event.stopPropagation();

  try {
    const response = await ProductAPI.getById(masp);
    if (!response.success) return;

    const product = response.data;

    const existingItem = cart.find((item) => item.masp === masp);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.push({
        masp: product.masp,
        tensp: product.tensp,
        giaban: product.giaban,
        giamgia: product.giamgia,
        hinhsp: product.hinhsp,
        quantity: 1,
      });
    }

    saveCartToStorage();
    updateCartCount();
    showNotification("success", `Đã thêm "${product.tensp}" vào giỏ hàng`);
  } catch (error) {
    console.error("Error adding to cart:", error);
    showNotification("error", "Không thể thêm sản phẩm vào giỏ hàng");
  }
}

// Cart functions
function loadCartFromStorage() {
  cart = CartManager.load();
}

function saveCartToStorage() {
  CartManager.save(cart);
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById("cartCountNav");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "block" : "none";
  }
}

// Navigation functions
function goToCategory(madm) {
  window.location.href = `pages/shop.html?category=${madm}`;
}

function goToProduct(masp) {
  window.location.href = `pages/product-detail.html?id=${masp}`;
}

function searchProducts() {
  const searchTerm = document.getElementById("heroSearch").value;
  if (searchTerm.trim()) {
    window.location.href = `pages/shop.html?search=${encodeURIComponent(
      searchTerm
    )}`;
  }
}

// Notification
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

// Hero search on Enter key
document.addEventListener("DOMContentLoaded", function () {
  const heroSearch = document.getElementById("heroSearch");
  if (heroSearch) {
    heroSearch.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchProducts();
      }
    });
  }
});
