// Authentication JavaScript

// Check if already logged in and redirect to index
async function checkAlreadyLoggedIn() {
  try {
    const result = await AuthAPI.checkAuth();
    if (result.authenticated) {
      window.location.href = "index.html";
    }
  } catch (error) {
    // Not logged in, stay on login page
  }
}

// Toggle password visibility
document
  .getElementById("togglePassword")
  ?.addEventListener("click", function () {
    const passwordField = document.getElementById("matkhau");
    const icon = this.querySelector("i");
    if (passwordField.type === "password") {
      passwordField.type = "text";
      icon.classList.replace("bi-eye", "bi-eye-slash");
    } else {
      passwordField.type = "password";
      icon.classList.replace("bi-eye-slash", "bi-eye");
    }
  });

// Login form submission
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  // Check if already logged in
  checkAlreadyLoggedIn();

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const tendangnhap = document.getElementById("tendangnhap").value;
    const matkhau = document.getElementById("matkhau").value;

    if (!tendangnhap || !matkhau) {
      showAlert("error", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    // Disable submit button
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Đang đăng nhập...';

    try {
      const response = await AuthAPI.login({ tendangnhap, matkhau });

      showAlert("success", "Đăng nhập thành công! Đang chuyển hướng...");

      // Store user info in localStorage
      localStorage.setItem("user", JSON.stringify(response.user));

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } catch (error) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      // Error already shown by API
    }
  });
}

// Initialize auth state on protected pages
async function initAuthState() {
  try {
    const result = await AuthAPI.checkAuth();

    if (!result.authenticated) {
      // Not logged in, redirect to login
      window.location.href = "/lab-7-10/login.html";
      return;
    }

    // Update navbar with user info
    updateNavbar(result.user);

    return result.user;
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "/lab-7-10/login.html";
  }
}

// Update navbar with user information
function updateNavbar(user) {
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
        <span class="badge bg-secondary">${roleLabels[user.vaitro]}</span>
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
      showAlert("success", "Đăng xuất thành công!");
      setTimeout(() => {
        window.location.href = "/lab-7-10/login.html";
      }, 1000);
    } catch (error) {
      // Error already shown by API
    }
  }
}

// Check role access
function checkRoleAccess(allowedRoles = []) {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "/lab-7-10/login.html";
    return false;
  }

  const user = JSON.parse(userStr);
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.vaitro)) {
    showAlert("error", "Bạn không có quyền truy cập trang này");
    setTimeout(() => {
      window.location.href = "/lab-7-10/index.html";
    }, 2000);
    return false;
  }

  return true;
}
