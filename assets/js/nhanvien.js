// Employees Management JavaScript

let employeeModal;

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

  employeeModal = new bootstrap.Modal(document.getElementById("employeeModal"));
  loadEmployees();
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

async function loadEmployees() {
  const grid = document.getElementById("employeesGrid");

  showLoading(grid);

  try {
    const response = await EmployeeAPI.getAll();

    if (response.success && response.data.length > 0) {
      grid.innerHTML = response.data
        .map((employee) => {
          const genderIcon =
            employee.gt === "Nam"
              ? "bi-gender-male"
              : employee.gt === "Nữ"
              ? "bi-gender-female"
              : "bi-gender-ambiguous";
          const genderColor =
            employee.gt === "Nam"
              ? "text-primary"
              : employee.gt === "Nữ"
              ? "text-danger"
              : "text-secondary";

          return `
                    <div class="col-md-4 col-lg-3">
                        <div class="card employee-card">
                            <div class="employee-avatar">
                                <i class="bi bi-person-circle"></i>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title mb-2">${
                                  employee.hoten
                                }</h5>
                                <p class="card-text text-muted">
                                    <i class="bi ${genderIcon} ${genderColor}"></i> ${
            employee.gt
          }<br>
                                    <i class="bi bi-calendar"></i> NS: ${formatDate(
                                      employee.ns
                                    )}<br>
                                    <i class="bi bi-briefcase"></i> VL: ${formatDate(
                                      employee.ngayvl
                                    )}<br>
                                    <i class="bi bi-cart"></i> ${
                                      employee.soluong_dh
                                    } đơn hàng
                                </p>
                                <div class="btn-group w-100" role="group">
                                    <button class="btn btn-sm btn-warning" onclick="editEmployee(${
                                      employee.manv
                                    })">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${
                                      employee.manv
                                    })">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
        })
        .join("");
    } else {
      showEmptyState(grid, "Chưa có nhân viên nào");
    }
  } catch (error) {
    console.error("Error loading employees:", error);
  }
}

function openAddModal() {
  document.getElementById("modalTitle").textContent = "Thêm nhân viên";
  document.getElementById("employeeForm").reset();
  document.getElementById("manv").value = "";
  document.getElementById("ngayvl").value = new Date()
    .toISOString()
    .split("T")[0];
}

async function editEmployee(manv) {
  try {
    const response = await EmployeeAPI.getById(manv);

    if (response.success) {
      const employee = response.data;
      document.getElementById("modalTitle").textContent =
        "Sửa thông tin nhân viên";
      document.getElementById("manv").value = employee.manv;
      document.getElementById("hoten").value = employee.hoten;
      document.getElementById("gt").value = employee.gt;
      document.getElementById("ns").value = employee.ns;
      document.getElementById("ngayvl").value = employee.ngayvl;

      employeeModal.show();
    }
  } catch (error) {
    console.error("Error loading employee:", error);
  }
}

async function saveEmployee() {
  const manv = document.getElementById("manv").value;
  const data = {
    hoten: document.getElementById("hoten").value,
    gt: document.getElementById("gt").value,
    ns: document.getElementById("ns").value,
    ngayvl: document.getElementById("ngayvl").value,
  };

  if (!data.hoten.trim()) {
    showAlert("warning", "Vui lòng nhập họ tên");
    return;
  }

  try {
    let response;
    if (manv) {
      data.manv = parseInt(manv);
      response = await EmployeeAPI.update(data);
    } else {
      response = await EmployeeAPI.create(data);
    }

    if (response.success) {
      showAlert("success", response.message);
      employeeModal.hide();
      loadEmployees();
    }
  } catch (error) {
    console.error("Error saving employee:", error);
  }
}

async function deleteEmployee(manv) {
  const confirmed = await confirmDelete(
    "Bạn có chắc chắn muốn xóa nhân viên này?"
  );

  if (confirmed) {
    try {
      const response = await EmployeeAPI.delete(manv);

      if (response.success) {
        showAlert("success", response.message);
        loadEmployees();
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  }
}
