// Categories Management JavaScript

let categoryModal;

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

  categoryModal = new bootstrap.Modal(document.getElementById("categoryModal"));
  loadCategories();
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

async function loadCategories() {
  const grid = document.getElementById("categoriesGrid");

  showLoading(grid);

  try {
    const response = await CategoryAPI.getAll();

    if (response.success && response.data.length > 0) {
      grid.innerHTML = response.data
        .map(
          (category) => `
                <div class="col-md-4 col-lg-3">
                    <div class="card category-card">
                        <div class="category-icon">
                            <i class="bi bi-grid-3x3-gap"></i>
                        </div>
                        <h5 class="mb-2">${category.tendm}</h5>
                        <p class="text-muted mb-3">
                            <i class="bi bi-box-seam"></i> ${category.soluong_sp} sản phẩm
                        </p>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-warning" onclick="editCategory(${category.madm})">
                                <i class="bi bi-pencil"></i> Sửa
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.madm})">
                                <i class="bi bi-trash"></i> Xóa
                            </button>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    } else {
      showEmptyState(grid, "Chưa có danh mục nào");
    }
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

function openAddModal() {
  document.getElementById("modalTitle").textContent = "Thêm danh mục";
  document.getElementById("categoryForm").reset();
  document.getElementById("madm").value = "";
}

async function editCategory(madm) {
  try {
    const response = await CategoryAPI.getById(madm);

    if (response.success) {
      const category = response.data;
      document.getElementById("modalTitle").textContent = "Sửa danh mục";
      document.getElementById("madm").value = category.madm;
      document.getElementById("tendm").value = category.tendm;

      categoryModal.show();
    }
  } catch (error) {
    console.error("Error loading category:", error);
  }
}

async function saveCategory() {
  const madm = document.getElementById("madm").value;
  const data = {
    tendm: document.getElementById("tendm").value,
  };

  if (!data.tendm.trim()) {
    showAlert("warning", "Vui lòng nhập tên danh mục");
    return;
  }

  try {
    let response;
    if (madm) {
      data.madm = parseInt(madm);
      response = await CategoryAPI.update(data);
    } else {
      response = await CategoryAPI.create(data);
    }

    if (response.success) {
      showAlert("success", response.message);
      categoryModal.hide();
      loadCategories();
    }
  } catch (error) {
    console.error("Error saving category:", error);
  }
}

async function deleteCategory(madm) {
  const confirmed = await confirmDelete(
    "Bạn có chắc chắn muốn xóa danh mục này?"
  );

  if (confirmed) {
    try {
      const response = await CategoryAPI.delete(madm);

      if (response.success) {
        showAlert("success", response.message);
        loadCategories();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  }
}
