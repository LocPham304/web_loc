// API Configuration and Helper Functions

const API_BASE_URL = "/lab-7-10/api";

// Generic API call function
async function apiCall(endpoint, method = "GET", data = null, params = null) {
  let url = `${API_BASE_URL}${endpoint}`;

  // Add query parameters
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Quan trọng: Cho phép gửi/nhận cookies
  };

  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "API request failed");
    }

    return result;
  } catch (error) {
    console.error("API Error:", error);
    showAlert("error", error.message || "Đã xảy ra lỗi khi kết nối đến server");
    throw error;
  }
}

// Products API
const ProductAPI = {
  getAll: (page = 1, limit = 10, search = "") =>
    apiCall("/sanpham.php", "GET", null, { page, limit, search }),

  getById: (masp) => apiCall("/sanpham.php", "GET", null, { masp }),

  create: (data) => apiCall("/sanpham.php", "POST", data),

  update: (data) => apiCall("/sanpham.php", "PUT", data),

  delete: (masp) => apiCall("/sanpham.php", "DELETE", null, { masp }),
};

// Categories API
const CategoryAPI = {
  getAll: () => apiCall("/danhmuc.php", "GET"),

  getById: (madm) => apiCall("/danhmuc.php", "GET", null, { madm }),

  create: (data) => apiCall("/danhmuc.php", "POST", data),

  update: (data) => apiCall("/danhmuc.php", "PUT", data),

  delete: (madm) => apiCall("/danhmuc.php", "DELETE", null, { madm }),
};

// Units API
const UnitAPI = {
  getAll: () => apiCall("/donvitinh.php", "GET"),

  getById: (madv) => apiCall("/donvitinh.php", "GET", null, { madv }),

  create: (data) => apiCall("/donvitinh.php", "POST", data),

  update: (data) => apiCall("/donvitinh.php", "PUT", data),

  delete: (madv) => apiCall("/donvitinh.php", "DELETE", null, { madv }),
};

// Employees API
const EmployeeAPI = {
  getAll: () => apiCall("/nhanvien.php", "GET"),

  getById: (manv) => apiCall("/nhanvien.php", "GET", null, { manv }),

  create: (data) => apiCall("/nhanvien.php", "POST", data),

  update: (data) => apiCall("/nhanvien.php", "PUT", data),

  delete: (manv) => apiCall("/nhanvien.php", "DELETE", null, { manv }),
};

// Orders API
const OrderAPI = {
  getAll: (page = 1, limit = 10) =>
    apiCall("/donhang.php", "GET", null, { page, limit }),

  getById: (sodh) => apiCall("/donhang.php", "GET", null, { sodh }),

  getByUser: (mand) => apiCall("/donhang.php", "GET", null, { mand }),

  create: (data) => apiCall("/donhang.php", "POST", data),

  update: (data) => apiCall("/donhang.php", "PUT", data),

  updateStatus: (sodh, trang_thai) =>
    apiCall("/donhang.php", "PUT", { sodh, trang_thai }),

  delete: (sodh) => apiCall("/donhang.php", "DELETE", null, { sodh }),
};

// Statistics API
const StatisticsAPI = {
  getOverview: () => apiCall("/thongke.php", "GET", null, { type: "overview" }),

  getTopProducts: (limit = 10) =>
    apiCall("/thongke.php", "GET", null, { type: "sanpham_banchay", limit }),

  getRevenueByMonth: (year = new Date().getFullYear()) =>
    apiCall("/thongke.php", "GET", null, { type: "doanhthu_thang", year }),

  getProductsByCategory: () =>
    apiCall("/thongke.php", "GET", null, { type: "sanpham_danhmuc" }),

  getEmployeePerformance: () =>
    apiCall("/thongke.php", "GET", null, { type: "nhanvien_hieusuat" }),
};

// Authentication API
const AuthAPI = {
  login: (data) => apiCall("/auth.php?action=login", "POST", data),

  register: (data) => apiCall("/auth.php?action=register", "POST", data),

  logout: () => apiCall("/auth.php?action=logout", "GET"),

  checkAuth: () => apiCall("/auth.php?action=check", "GET"),

  getProfile: () => apiCall("/auth.php?action=profile", "GET"),
};

// Users API (Admin only)
const UserAPI = {
  getAll: (search = "", vaitro = "", trangthai = "") =>
    apiCall("/nguoidung.php", "GET", null, { search, vaitro, trangthai }),

  getById: (mand) => apiCall("/nguoidung.php", "GET", null, { mand }),

  create: (data) => apiCall("/nguoidung.php", "POST", data),

  update: (data) => apiCall("/nguoidung.php", "PUT", data),

  delete: (mand) => apiCall("/nguoidung.php", "DELETE", null, { mand }),
};

// Upload API (Admin only)
const UploadAPI = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload.php`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      return result;
    } catch (error) {
      console.error("Upload Error:", error);
      showAlert("error", error.message || "Không thể upload ảnh");
      throw error;
    }
  },
};

// Utility Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Format product code with 8 digits (00000001, 00000002, etc.)
function formatProductCode(masp) {
  return String(masp).padStart(8, "0");
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN");
}

// Alert/Toast Functions
function showAlert(type, message) {
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
    if (alert) {
      alert.remove();
    }
  }, 5000);
}

// Confirmation Dialog
function confirmDelete(message = "Bạn có chắc chắn muốn xóa?") {
  return new Promise((resolve) => {
    if (confirm(message)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

// Loading Spinner
function showLoading(element) {
  element.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

// Empty State
function showEmptyState(element, message = "Không có dữ liệu") {
  element.innerHTML = `
        <div class="text-center py-5 text-muted">
            <i class="bi bi-inbox" style="font-size: 3rem;"></i>
            <p class="mt-3">${message}</p>
        </div>
    `;
}

// Profile API (User tự cập nhật thông tin của mình)
const ProfileAPI = {
  get: () => apiCall("/profile.php", "GET"),

  update: (data) => apiCall("/profile.php", "PUT", data),
};

// ============================================
// CART MANAGER - Quản lý giỏ hàng theo user
// ============================================
const CartManager = {
  // Lấy key giỏ hàng dựa vào user hiện tại
  getCartKey() {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.mand) {
          return `cart_user_${user.mand}`;
        }
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
    return "cart_guest"; // Giỏ hàng cho khách chưa đăng nhập
  },

  // Load giỏ hàng từ localStorage
  load() {
    const cartKey = this.getCartKey();
    const saved = localStorage.getItem(cartKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading cart:", e);
        return [];
      }
    }
    return [];
  },

  // Lưu giỏ hàng vào localStorage
  save(cart) {
    const cartKey = this.getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(cart));
  },

  // Xóa giỏ hàng hiện tại
  clear() {
    const cartKey = this.getCartKey();
    localStorage.removeItem(cartKey);
  },

  // Xóa TẤT CẢ giỏ hàng (khi logout)
  clearAll() {
    // Xóa giỏ hàng của user hiện tại
    this.clear();

    // Có thể xóa tất cả cart keys nếu cần
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("cart_user_") || key === "cart_guest") {
        localStorage.removeItem(key);
      }
    });
  },

  // Đếm số lượng sản phẩm trong giỏ
  count() {
    const cart = this.load();
    return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  },
};
