// Profile Management JavaScript

let currentUser = null;

// Initialize
document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  try {
    const result = await AuthAPI.checkAuth();
    if (result.authenticated) {
      currentUser = result.user;
      updateNavbar(result.user);
      loadProfileData(result.user);

      // Show admin menu if admin
      if (result.user.vaitro === "admin") {
        const adminMenu = document.getElementById("adminMenu");
        if (adminMenu) adminMenu.style.display = "block";
      }
    } else {
      // Redirect to login
      showNotification("warning", "Vui lòng đăng nhập để xem thông tin");
      setTimeout(() => {
        window.location.href = "../login.html?redirect=profile.html";
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

  // Load cart count
  loadCartCount();

  // Form submission
  document
    .getElementById("profileForm")
    .addEventListener("submit", updateProfile);
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
        <li><a class="dropdown-item active" href="profile.html"><i class="bi bi-person-circle"></i> Chỉnh sửa thông tin</a></li>
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

// Load cart count
function loadCartCount() {
  const count = CartManager.count();
  const badge = document.getElementById("cartCountNav");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "block" : "none";
  }
}

// Load profile data
function loadProfileData(user) {
  const roleLabels = {
    admin: "Quản trị viên",
    nhanvien: "Nhân viên",
    khachhang: "Khách hàng",
  };

  const roleColors = {
    admin: "bg-danger",
    nhanvien: "bg-info",
    khachhang: "bg-success",
  };

  // Update header
  document.getElementById("profileName").textContent = user.hoten;
  const roleBadge = document.getElementById("profileRole");
  roleBadge.textContent = roleLabels[user.vaitro];
  roleBadge.className = `badge badge-role ${
    roleColors[user.vaitro]
  } text-white`;

  // Update view mode
  document.getElementById("viewUsername").textContent = user.tendangnhap;
  document.getElementById("viewFullName").textContent = user.hoten;
  document.getElementById("viewEmail").textContent =
    user.email || "Chưa cập nhật";
  document.getElementById("viewPhone").textContent =
    user.sodienthoai || "Chưa cập nhật";
  document.getElementById("viewAddress").textContent =
    user.diachi || "Chưa cập nhật";

  // Update edit form
  document.getElementById("editFullName").value = user.hoten;
  document.getElementById("editEmail").value = user.email;
  document.getElementById("editPhone").value = user.sodienthoai || "";
  document.getElementById("editAddress").value = user.diachi || "";
}

// Switch to edit mode
function switchToEditMode() {
  document.getElementById("viewMode").style.display = "none";
  document.getElementById("editMode").style.display = "block";
}

// Switch to view mode
function switchToViewMode() {
  document.getElementById("editMode").style.display = "none";
  document.getElementById("viewMode").style.display = "block";

  // Reset password fields
  document.getElementById("oldPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
}

// Update profile
async function updateProfile(e) {
  e.preventDefault();

  const hoten = document.getElementById("editFullName").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const sodienthoai = document.getElementById("editPhone").value.trim();
  const diachi = document.getElementById("editAddress").value.trim();

  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validate
  if (!hoten || !email) {
    showNotification("warning", "Vui lòng nhập đầy đủ thông tin bắt buộc");
    return;
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification("warning", "Email không hợp lệ");
    return;
  }

  // Validate password change
  if (oldPassword || newPassword || confirmPassword) {
    if (!oldPassword) {
      showNotification("warning", "Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!newPassword) {
      showNotification("warning", "Vui lòng nhập mật khẩu mới");
      return;
    }
    if (newPassword.length < 6) {
      showNotification("warning", "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("warning", "Xác nhận mật khẩu không khớp");
      return;
    }
  }

  // Disable submit button
  const submitBtn = document.querySelector(
    "#profileForm button[type='submit']"
  );
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Đang cập nhật...';

  try {
    // Prepare data
    const updateData = {
      mand: currentUser.mand,
      hoten,
      email,
      sodienthoai,
      diachi,
    };

    // Add password if changing
    if (oldPassword && newPassword) {
      updateData.matkhau_cu = oldPassword;
      updateData.matkhau_moi = newPassword;
    }

    // Call API to update profile
    const response = await ProfileAPI.update(updateData);

    if (response.success) {
      showNotification("success", "Cập nhật thông tin thành công!");

      // Update current user data
      currentUser.hoten = hoten;
      currentUser.email = email;
      currentUser.sodienthoai = sodienthoai;
      currentUser.diachi = diachi;

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(currentUser));

      // Reload profile data
      loadProfileData(currentUser);
      updateNavbar(currentUser);

      // Switch back to view mode
      setTimeout(() => {
        switchToViewMode();
      }, 1000);
    } else {
      throw new Error(response.message || "Không thể cập nhật thông tin");
    }
  } catch (error) {
    console.error("Update error:", error);
    showNotification(
      "error",
      error.message || "Cập nhật thất bại. Vui lòng thử lại."
    );
  } finally {
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Utility function
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
