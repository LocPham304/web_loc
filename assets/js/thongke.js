// Statistics JavaScript

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

  loadStatistics();
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

async function loadStatistics() {
  await loadRevenueByMonth();
  await loadEmployeePerformance();
  await loadCategoryStats();
}

async function loadRevenueByMonth() {
  const tableBody = document.getElementById("revenueByMonthTable");
  const year = document.getElementById("yearSelect").value;

  showLoading(tableBody);

  try {
    const response = await StatisticsAPI.getRevenueByMonth(year);

    if (response.success && response.data.length > 0) {
      const monthNames = [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
      ];

      // Create a map of month data
      const monthData = {};
      response.data.forEach((item) => {
        monthData[item.thang] = item;
      });

      // Generate rows for all 12 months
      let html = "";
      let totalOrders = 0;
      let totalRevenue = 0;
      let totalDiscount = 0;
      let totalAmount = 0;

      for (let i = 1; i <= 12; i++) {
        const data = monthData[i];
        if (data) {
          html += `
                        <tr>
                            <td><strong>${monthNames[i - 1]}</strong></td>
                            <td>${data.soluong_dh}</td>
                            <td>${formatCurrency(data.tongtien)}</td>
                            <td>${formatCurrency(data.tong_giamgia)}</td>
                            <td class="fw-bold text-success">${formatCurrency(
                              data.doanhthu
                            )}</td>
                        </tr>
                    `;
          totalOrders += parseInt(data.soluong_dh);
          totalAmount += parseFloat(data.tongtien);
          totalDiscount += parseFloat(data.tong_giamgia);
          totalRevenue += parseFloat(data.doanhthu);
        } else {
          html += `
                        <tr class="text-muted">
                            <td>${monthNames[i - 1]}</td>
                            <td>0</td>
                            <td>0đ</td>
                            <td>0đ</td>
                            <td>0đ</td>
                        </tr>
                    `;
        }
      }

      // Add total row
      html += `
                <tr class="table-primary fw-bold">
                    <td>TỔNG CỘNG</td>
                    <td>${totalOrders}</td>
                    <td>${formatCurrency(totalAmount)}</td>
                    <td>${formatCurrency(totalDiscount)}</td>
                    <td class="text-success">${formatCurrency(
                      totalRevenue
                    )}</td>
                </tr>
            `;

      tableBody.innerHTML = html;
    } else {
      showEmptyState(tableBody, `Chưa có dữ liệu năm ${year}`);
    }
  } catch (error) {
    console.error("Error loading revenue by month:", error);
    tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">Không thể tải dữ liệu</td>
            </tr>
        `;
  }
}

async function loadEmployeePerformance() {
  const tableBody = document.getElementById("employeePerformanceTable");

  showLoading(tableBody);

  try {
    const response = await StatisticsAPI.getEmployeePerformance();

    if (response.success && response.data.length > 0) {
      tableBody.innerHTML = response.data
        .map(
          (emp, index) => `
                <tr>
                    <td>
                        <span class="badge bg-primary me-2">#${index + 1}</span>
                        ${emp.hoten}
                    </td>
                    <td>${emp.soluong_dh}</td>
                    <td class="fw-bold text-success">${formatCurrency(
                      emp.doanhthu
                    )}</td>
                </tr>
            `
        )
        .join("");
    } else {
      showEmptyState(tableBody, "Chưa có dữ liệu");
    }
  } catch (error) {
    console.error("Error loading employee performance:", error);
    tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-danger">Không thể tải dữ liệu</td>
            </tr>
        `;
  }
}

async function loadCategoryStats() {
  const tableBody = document.getElementById("categoryStatsTable");

  showLoading(tableBody);

  try {
    const response = await StatisticsAPI.getProductsByCategory();

    if (response.success && response.data.length > 0) {
      tableBody.innerHTML = response.data
        .map(
          (cat) => `
                <tr>
                    <td>${cat.tendm}</td>
                    <td><span class="badge bg-info">${cat.soluong_sp}</span></td>
                    <td><span class="badge bg-success">${cat.tong_ban}</span></td>
                </tr>
            `
        )
        .join("");
    } else {
      showEmptyState(tableBody, "Chưa có dữ liệu");
    }
  } catch (error) {
    console.error("Error loading category stats:", error);
    tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-danger">Không thể tải dữ liệu</td>
            </tr>
        `;
  }
}
