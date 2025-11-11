// Product Detail JavaScript

let currentProduct = null;
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
    console.log("User not logged in");
  }

  // Load cart from localStorage
  loadCartFromStorage();
  updateCartCount();

  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (productId) {
    await loadProductDetail(productId);
  } else {
    showError();
  }

  // Initialize image preview modal
  initializeImagePreview();

  // Add validation for quantity input
  const quantityInput = document.getElementById("quantity");
  if (quantityInput) {
    // Validate on input (real-time)
    quantityInput.addEventListener("input", function () {
      validateQuantityInput(this);
    });

    // Validate on blur (when user leaves the field)
    quantityInput.addEventListener("blur", function () {
      if (this.value === "" || parseInt(this.value) < 1) {
        this.value = 1;
      }
    });

    // Prevent negative numbers and zero
    quantityInput.addEventListener("keypress", function (e) {
      // Only allow numbers
      if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === ".") {
        e.preventDefault();
      }
    });
  }
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

// Load product detail
async function loadProductDetail(productId) {
  try {
    const response = await ProductAPI.getById(productId);

    if (response.success && response.data) {
      currentProduct = response.data;
      displayProduct(response.data);
      loadRelatedProducts(response.data.madm);
      hideLoading();
    } else {
      showError();
    }
  } catch (error) {
    console.error("Error loading product:", error);
    showError();
  }
}

// Display product
function displayProduct(product) {
  // Update breadcrumb
  document.getElementById("breadcrumbProduct").textContent = product.tensp;

  // Update page title
  document.title = `${product.tensp} - Nhà Thuốc Nhân Tâm`;

  // Product images gallery
  let images = [];

  // Get images from hinhanh_arr or fallback to single image
  if (product.hinhanh_arr) {
    try {
      images = JSON.parse(product.hinhanh_arr);
    } catch (e) {
      if (product.hinhsp) {
        images = [product.hinhsp];
      }
    }
  } else if (product.hinhsp) {
    images = [product.hinhsp];
  }

  // Display main image
  const mainImage = document.getElementById("mainProductImage");
  const placeholderDiv = mainImage.nextElementSibling;

  if (images.length > 0) {
    const mainImagePath = `../uploads/products/${images[0]}`;
    mainImage.src = mainImagePath;
    mainImage.style.display = "block";
    placeholderDiv.style.display = "none";
    mainImage.alt = product.tensp;

    // Add click event to open preview
    mainImage.style.cursor = "pointer";
    mainImage.onclick = function () {
      openImagePreview(this.src);
    };

    // Display thumbnails if multiple images
    const thumbnailGallery = document.getElementById("thumbnailGallery");
    if (images.length > 1) {
      thumbnailGallery.innerHTML = "";

      images.forEach((img, index) => {
        const imagePath = `../uploads/products/${img}`;
        const thumbnail = document.createElement("div");
        thumbnail.className = `product-thumbnail ${
          index === 0 ? "active" : ""
        }`;
        thumbnail.setAttribute("data-image", imagePath);
        thumbnail.onclick = () => changeMainImage(imagePath);
        thumbnail.style.cursor = "pointer";

        thumbnail.innerHTML = `
          <img src="${imagePath}" alt="Ảnh ${
          index + 1
        }" onerror="this.parentElement.style.display='none';">
          ${index === 0 ? '<span class="thumbnail-badge">Chính</span>' : ""}
        `;

        thumbnailGallery.appendChild(thumbnail);
      });
    } else {
      thumbnailGallery.innerHTML = "";
    }
  } else {
    mainImage.style.display = "none";
    placeholderDiv.style.display = "flex";
  }

  // Product info
  document.getElementById("productCategory").textContent =
    product.tendm || "Chưa phân loại";
  document.getElementById("productOrigin").textContent =
    product.xuatxu || "Việt Nam";
  document.getElementById("productName").textContent = product.tensp;
  document.getElementById("productCode").textContent = formatProductCode(
    product.masp
  );
  document.getElementById("productUnit").textContent = product.tendv || "Hộp";
  document.getElementById("productViews").textContent = product.luot_xem || "0";
  document.getElementById("productSold").textContent = product.luot_ban || "0";

  // Price
  const discountPercent =
    product.giamgia > 0
      ? Math.round((product.giamgia / product.giaban) * 100)
      : 0;
  const finalPrice = product.giaban - product.giamgia;

  let priceHtml = `<span class="current-price">${formatCurrency(
    finalPrice
  )}</span>`;

  if (discountPercent > 0) {
    priceHtml += `
      <span class="original-price">${formatCurrency(product.giaban)}</span>
      <span class="discount-badge">-${discountPercent}%</span>
    `;
  }

  document.getElementById("productPrice").innerHTML = priceHtml;

  // Description
  document.getElementById("productDescription").innerHTML =
    product.congdung ||
    '<p class="text-muted">Chưa có mô tả chi tiết cho sản phẩm này.</p>';

  // Usage
  document.getElementById("productUsage").innerHTML =
    product.congdung ||
    '<p class="text-muted">Chưa có thông tin công dụng.</p>';

  // How to use
  document.getElementById("productHowToUse").innerHTML =
    product.cachdung ||
    '<p class="text-muted">Chưa có thông tin cách dùng.</p>';
}

// Load related products
async function loadRelatedProducts(categoryId) {
  if (!categoryId) {
    document.getElementById("relatedProducts").innerHTML = `
      <div class="col-12 text-center text-muted py-5">
        <p>Không có sản phẩm liên quan</p>
      </div>
    `;
    return;
  }

  try {
    const response = await ProductAPI.getAll(1, 8);

    if (response.success && response.data.length > 0) {
      // Filter products from same category
      const related = response.data
        .filter((p) => p.madm === categoryId && p.masp !== currentProduct.masp)
        .slice(0, 4);

      if (related.length > 0) {
        displayRelatedProducts(related);
      } else {
        // If no related products, show random products
        displayRelatedProducts(response.data.slice(0, 4));
      }
    } else {
      document.getElementById("relatedProducts").innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          <p>Không có sản phẩm liên quan</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading related products:", error);
  }
}

// Change main image when clicking thumbnail
function changeMainImage(imagePath, clickedThumbnail) {
  const mainImage = document.getElementById("mainProductImage");
  mainImage.src = imagePath;

  // Update active state on thumbnails
  document.querySelectorAll(".product-thumbnail").forEach((thumb) => {
    thumb.classList.remove("active");
  });
  clickedThumbnail.classList.add("active");
}

// Display related products
function displayRelatedProducts(products) {
  const container = document.getElementById("relatedProducts");

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
          ${
            discountPercent > 0
              ? `<div class="product-badge">
              <span class="badge-discount">-${discountPercent}%</span>
            </div>`
              : ""
          }
          
          <div class="product-image" onclick="goToProduct(${product.masp})">
            ${
              product.hinhsp
                ? `<img src="../uploads/products/${product.hinhsp}" 
                        alt="${product.tensp}" 
                        onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'bi bi-image\\' style=\\'font-size: 4rem; color: #d1d5db;\\'></i>';">`
                : '<i class="bi bi-image" style="font-size: 4rem; color: #d1d5db;"></i>'
            }
          </div>
          
          <div class="product-body">
            <span class="product-category">${
              product.tendm || "Chưa phân loại"
            }</span>
            <h6 class="product-title" onclick="goToProduct(${product.masp})">${
        product.tensp
      }</h6>
            
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
              <button class="btn-add-cart" onclick="addToCartFromRelated(${
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

// Validate quantity input
function validateQuantityInput(input) {
  let value = input.value;

  // Remove leading zeros
  value = value.replace(/^0+/, "");

  // Remove non-numeric characters
  value = value.replace(/[^0-9]/g, "");

  // Convert to number
  let numValue = parseInt(value);

  // If empty or invalid, set to empty (will be set to 1 on blur)
  if (isNaN(numValue) || numValue < 1) {
    input.value = "";
    return;
  }

  // Max 99
  if (numValue > 99) {
    numValue = 99;
  }

  input.value = numValue;
}

// Quantity controls
function increaseQuantity() {
  const input = document.getElementById("quantity");
  let currentValue = parseInt(input.value);

  // If invalid, set to 1
  if (isNaN(currentValue) || currentValue < 1) {
    currentValue = 1;
  }

  if (currentValue < 99) {
    input.value = currentValue + 1;
  }
}

function decreaseQuantity() {
  const input = document.getElementById("quantity");
  let currentValue = parseInt(input.value);

  // If invalid, set to 1
  if (isNaN(currentValue) || currentValue < 1) {
    currentValue = 1;
  }

  if (currentValue > 1) {
    input.value = currentValue - 1;
  }
}

// Add to cart
function addToCart() {
  if (!currentProduct) return;

  const quantityInput = document.getElementById("quantity");
  let quantity = parseInt(quantityInput.value);

  // Validate quantity
  if (isNaN(quantity) || quantity < 1) {
    showNotification("warning", "Vui lòng nhập số lượng hợp lệ (từ 1 đến 99)");
    quantityInput.value = 1;
    return;
  }

  if (quantity > 99) {
    showNotification("warning", "Số lượng tối đa là 99");
    quantityInput.value = 99;
    return;
  }

  const existingItem = cart.find((item) => item.masp === currentProduct.masp);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      masp: currentProduct.masp,
      tensp: currentProduct.tensp,
      giaban: currentProduct.giaban,
      giamgia: currentProduct.giamgia,
      hinhsp: currentProduct.hinhsp,
      quantity: quantity,
    });
  }

  saveCartToStorage();
  updateCartCount();
  showNotification(
    "success",
    `Đã thêm ${quantity} ${currentProduct.tensp} vào giỏ hàng`
  );

  // Reset quantity
  quantityInput.value = 1;
}

// Add to cart from related products
async function addToCartFromRelated(masp, event) {
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

// Buy now
function buyNow() {
  addToCart();
  setTimeout(() => {
    window.location.href = "cart.html";
  }, 500);
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

// Navigation
function goToProduct(masp) {
  window.location.href = `product-detail.html?id=${masp}`;
}

// UI helpers
function hideLoading() {
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("productContent").style.display = "block";
}

function showError() {
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("errorState").style.display = "block";
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

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Initialize image preview modal
function initializeImagePreview() {
  const imagePreviewModal = new bootstrap.Modal(
    document.getElementById("imagePreviewModal")
  );

  // Store modal instance globally
  window.imagePreviewModal = imagePreviewModal;
}

// Open image preview
function openImagePreview(imageSrc) {
  const previewImage = document.getElementById("previewImage");
  previewImage.src = imageSrc;
  window.imagePreviewModal.show();
}

// Change main image (for thumbnail clicks)
function changeMainImage(imagePath) {
  const mainImage = document.getElementById("mainProductImage");
  mainImage.src = imagePath;

  // Update active thumbnail
  const thumbnails = document.querySelectorAll(".product-thumbnail");
  thumbnails.forEach((thumb) => {
    thumb.classList.remove("active");
    if (thumb.src === imagePath) {
      thumb.classList.add("active");
    }
  });
}
