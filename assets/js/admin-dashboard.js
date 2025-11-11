// Admin Dashboard JavaScript

let currentUser = null;

// Mock data for charts
const mockData = {
  revenue: {
    labels: ["Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10"],
    data: [45000000, 52000000, 48000000, 61000000, 55000000, 68000000],
  },
  topProducts: {
    labels: [
      "Vitamin C Blackmores",
      "La Roche-Posay SPF50+",
      "Smecta",
      "Paracetamol 500mg",
      "Decolgen",
    ],
    data: [156, 142, 128, 115, 98],
  },
  categories: {
    labels: [
      "Vitamin & TPCN",
      "Dược mỹ phẩm",
      "Thuốc tiêu hóa",
      "Thuốc giảm đau",
      "Thuốc cảm cúm",
    ],
    data: [32, 28, 18, 12, 10],
  },
  stats: {
    monthRevenue: 68000000,
    totalOrders: 247,
    totalProducts: 14,
    totalCustomers: 1250,
  },
  recentOrders: [
    {
      sodh: 123,
      khachhang: "Nguyễn Văn A",
      tong_tien: 450000,
      trang_thai: "delivered",
      time: "2 giờ trước",
    },
    {
      sodh: 122,
      khachhang: "Trần Thị B",
      tong_tien: 320000,
      trang_thai: "shipping",
      time: "5 giờ trước",
    },
    {
      sodh: 121,
      khachhang: "Lê Văn C",
      tong_tien: 180000,
      trang_thai: "confirmed",
      time: "1 ngày trước",
    },
    {
      sodh: 120,
      khachhang: "Phạm Thị D",
      tong_tien: 650000,
      trang_thai: "delivered",
      time: "1 ngày trước",
    },
  ],
};

// Initialize
document.addEventListener("DOMContentLoaded", async function () {
  // Check admin authentication
  try {
    const result = await AuthAPI.checkAuth();
    if (!result.authenticated) {
      showNotification("warning", "Vui lòng đăng nhập để truy cập");
      setTimeout(() => {
        window.location.href = "../login.html";
      }, 1500);
      return;
    }

    if (result.user.vaitro !== "admin") {
      showNotification("error", "Chỉ Admin mới có quyền truy cập");
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 2000);
      return;
    }

    currentUser = result.user;
    updateNavbar(result.user);
  } catch (error) {
    showNotification("error", "Không thể xác thực. Vui lòng đăng nhập lại.");
    setTimeout(() => {
      window.location.href = "../login.html";
    }, 1500);
    return;
  }

  // Load dashboard data
  loadStatsCards();
  loadRecentOrders();
  initCharts();
});

// Update navbar
function updateNavbar(user) {
  const authNav = document.getElementById("authNav");
  if (!authNav) return;

  authNav.innerHTML = `
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
        <i class="bi bi-person-circle"></i> ${user.hoten}
        <span class="badge bg-danger ms-1">Admin</span>
      </a>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><h6 class="dropdown-header">${user.tendangnhap}</h6></li>
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

// Load stats cards
function loadStatsCards() {
  document.getElementById("monthRevenue").textContent = formatCurrency(
    mockData.stats.monthRevenue
  );
  document.getElementById("totalOrders").textContent =
    mockData.stats.totalOrders;
  document.getElementById("totalProducts").textContent =
    mockData.stats.totalProducts;
  document.getElementById("totalCustomers").textContent =
    mockData.stats.totalCustomers.toLocaleString();
}

// Load recent orders
function loadRecentOrders() {
  const container = document.getElementById("recentOrdersList");

  container.innerHTML = mockData.recentOrders
    .map(
      (order) => `
    <div class="order-item">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>#DH${String(order.sodh).padStart(3, "0")}</strong>
          <p class="text-muted small mb-0">${order.khachhang}</p>
        </div>
        <div class="text-end">
          <strong class="text-primary">${formatCurrency(
            order.tong_tien
          )}</strong>
          <p class="text-muted small mb-0">${order.time}</p>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

// Initialize all charts
function initCharts() {
  createRevenueChart();
  createTopProductsChart();
  createCategoryChart();
}

// Revenue Chart (Line Chart)
function createRevenueChart() {
  const ctx = document.getElementById("revenueChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: mockData.revenue.labels,
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: mockData.revenue.data,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return formatCurrency(context.parsed.y);
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return (value / 1000000).toFixed(0) + "M";
            },
          },
        },
      },
    },
  });
}

// Top Products Chart (Bar Chart)
function createTopProductsChart() {
  const ctx = document.getElementById("topProductsChart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: mockData.topProducts.labels,
      datasets: [
        {
          label: "Số lượng bán",
          data: mockData.topProducts.data,
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"],
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Category Chart (Doughnut Chart)
function createCategoryChart() {
  const ctx = document.getElementById("categoryChart").getContext("2d");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: mockData.categories.labels,
      datasets: [
        {
          data: mockData.categories.data,
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
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
