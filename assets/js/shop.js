// Shop & Cart Management JavaScript - Professional Version

let currentProducts = [];
let allProducts = [];
let currentPage = 1;
let currentUser = null;
let cart = [];
let selectedCategory = null;

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
    // Not logged in
    console.log("User not logged in");
  }

  // Load cart from localStorage
  loadCartFromStorage();
  updateCartCount();

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");
  const searchParam = urlParams.get("search");

  if (categoryParam) {
    selectedCategory = parseInt(categoryParam);
  }

  if (searchParam) {
    document.getElementById("searchInput").value = searchParam;
  }

  // Load data
  await loadCategories();
  await loadProducts();

  // Setup event listeners
  setupEventListeners();
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

// Setup event listeners
function setupEventListeners() {
  // Search input with debounce
  const searchInput = document.getElementById("searchInput");
  let searchTimeout;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => applyFilters(), 500);
  });

  // Sort change
  document.getElementById("sortBy").addEventListener("change", applyFilters);

  // Price inputs
  document.getElementById("minPrice").addEventListener("change", applyFilters);
  document.getElementById("maxPrice").addEventListener("change", applyFilters);
}

// Load categories
async function loadCategories() {
  try {
    const response = await CategoryAPI.getAll();

    if (response.success) {
      displayCategories(response.data);
    }
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

// Display categories
function displayCategories(categories) {
  const container = document.getElementById("categoryFilterList");

  container.innerHTML =
    `
    <div class="filter-option">
      <input type="radio" name="category" id="catAll" value="" ${
        !selectedCategory ? "checked" : ""
      } onchange="selectCategory(null)">
      <label for="catAll">Tất cả</label>
    </div>
  ` +
    categories
      .map(
        (cat) => `
      <div class="filter-option">
        <input type="radio" name="category" id="cat${cat.madm}" value="${
          cat.madm
        }" ${
          selectedCategory === cat.madm ? "checked" : ""
        } onchange="selectCategory(${cat.madm})">
        <label for="cat${cat.madm}">${cat.tendm}</label>
      </div>
    `
      )
      .join("");
}

// Select category
function selectCategory(madm) {
  selectedCategory = madm;
  applyFilters();
}

// Load products
async function loadProducts(page = 1) {
  try {
    currentPage = page;
    const container = document.getElementById("productsContainer");
    showLoading(container);

    const response = await ProductAPI.getAll(1, 1000); // Load all products

    if (response.success && response.data.length > 0) {
      allProducts = response.data;
      applyFilters();
    } else {
      showEmptyState(container, "Không tìm thấy sản phẩm nào");
      document.getElementById("productCount").textContent = 0;
    }
  } catch (error) {
    console.error("Error loading products:", error);
    showEmptyState(container, "Không thể tải sản phẩm");
  }
}

// Apply filters
function applyFilters() {
  let filtered = [...allProducts];

  // Search filter
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter((p) =>
      p.tensp.toLowerCase().includes(searchTerm)
    );
  }

  // Category filter
  if (selectedCategory) {
    filtered = filtered.filter((p) => p.madm == selectedCategory);
  }

  // Price filter
  const minPrice = parseFloat(document.getElementById("minPrice").value) || 0;
  const maxPrice =
    parseFloat(document.getElementById("maxPrice").value) || Infinity;
  filtered = filtered.filter((p) => {
    const price = p.giaban - p.giamgia;
    return price >= minPrice && price <= maxPrice;
  });

  // Status filters
  if (document.getElementById("filterDiscount").checked) {
    filtered = filtered.filter((p) => p.giamgia > 0);
  }

  if (document.getElementById("filterHot").checked) {
    filtered = filtered.filter((p) => p.noibat || p.luot_ban > 100);
  }

  // Sort
  const sortBy = document.getElementById("sortBy").value;
  switch (sortBy) {
    case "name_asc":
      filtered.sort((a, b) => a.tensp.localeCompare(b.tensp));
      break;
    case "name_desc":
      filtered.sort((a, b) => b.tensp.localeCompare(a.tensp));
      break;
    case "price_asc":
      filtered.sort((a, b) => a.giaban - a.giamgia - (b.giaban - b.giamgia));
      break;
    case "price_desc":
      filtered.sort((a, b) => b.giaban - b.giamgia - (a.giaban - a.giamgia));
      break;
    case "best_seller":
      filtered.sort((a, b) => (b.luot_ban || 0) - (a.luot_ban || 0));
      break;
  }

  currentProducts = filtered;
  displayProducts(filtered);
}

// Display products
function displayProducts(products) {
  const container = document.getElementById("productsContainer");

  document.getElementById("productCount").textContent = products.length;

  if (products.length === 0) {
    showEmptyState(container, "Không có sản phẩm phù hợp với bộ lọc");
    return;
  }

  container.innerHTML = products
    .map((product) => {
      const discountPercent =
        product.giamgia > 0
          ? Math.round((product.giamgia / product.giaban) * 100)
          : 0;
      const finalPrice = product.giaban - product.giamgia;
      const isHot = product.noibat || product.luot_ban > 100;

      return `
      <div class="col-lg-4 col-md-6 col-6">
        <div class="product-card">
          <div class="product-badge">
            ${
              isHot
                ? '<span class="badge-hot"><i class="bi bi-fire"></i> Hot</span>'
                : ""
            }
            ${
              discountPercent > 0
                ? `<span class="badge-discount ${
                    isHot ? "ms-1" : ""
                  }">-${discountPercent}%</span>`
                : ""
            }
          </div>
          
          <div class="product-image" onclick="goToProductDetail(${
            product.masp
          })">
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
                ? `<img src="../uploads/products/${imageSrc}" 
                          alt="${product.tensp}" 
                          onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'bi bi-image\\' style=\\'font-size: 4rem; color: #d1d5db;\\'></i>';">`
                : '<i class="bi bi-image" style="font-size: 4rem; color: #d1d5db;"></i>';
            })()}
          </div>
          
          <div class="product-body">
            <span class="product-category">${
              product.tendm || "Chưa phân loại"
            }</span>
            <h6 class="product-title" onclick="goToProductDetail(${
              product.masp
            })">${product.tensp}</h6>
            
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
              <button class="btn-quick-view" onclick="goToProductDetail(${
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

// Navigate to product detail page
function goToProductDetail(masp) {
  window.location.href = `product-detail.html?id=${masp}`;
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

// Reset filters
function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  document.getElementById("sortBy").value = "name_asc";
  document.getElementById("filterAvailable").checked = true;
  document.getElementById("filterDiscount").checked = false;
  document.getElementById("filterHot").checked = false;

  // Reset category
  selectedCategory = null;
  document.getElementById("catAll").checked = true;

  applyFilters();
}

// Utility functions
function showLoading(element) {
  element.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
    </div>
  `;
}

function showEmptyState(element, message = "Không có dữ liệu") {
  element.innerHTML = `
    <div class="col-12 text-center py-5 text-muted">
      <i class="bi bi-inbox" style="font-size: 3rem;"></i>
      <p class="mt-3">${message}</p>
    </div>
  `;
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
