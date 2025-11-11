// Products Management JavaScript

let currentPage = 1;
let productsModal;

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication (optional for viewing)
  try {
    const result = await AuthAPI.checkAuth();
    if (result.authenticated) {
      updatePageNavbar(result.user);
    }
  } catch (error) {
    // Not logged in, but can still view
  }

  productsModal = new bootstrap.Modal(document.getElementById("productModal"));
  loadProducts();
  loadCategories();
  loadUnits();

  // Search on Enter key
  document
    .getElementById("searchInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchProducts();
      }
    });
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

// Handle logout on pages
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

async function loadProducts(page = 1) {
  currentPage = page;
  const tableBody = document.getElementById("productsTableBody");
  const search = document.getElementById("searchInput").value;

  showLoading(tableBody);

  try {
    const response = await ProductAPI.getAll(page, 10, search);

    if (response.success && response.data.length > 0) {
      tableBody.innerHTML = response.data
        .map(
          (product) => `
                <tr>
                    <td>${formatProductCode(product.masp)}</td>
                    <td>${product.tensp}</td>
                    <td>${product.tendm || "-"}</td>
                    <td>${product.tendv || "-"}</td>
                    <td>${formatCurrency(product.giaban)}</td>
                    <td>${formatCurrency(product.giamgia)}</td>
                    <td>${product.xuatxu || "-"}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewProduct(${
                          product.masp
                        })" title="Xem chi tiết">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editProduct(${
                          product.masp
                        })" title="Sửa">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${
                          product.masp
                        })" title="Xóa">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `
        )
        .join("");

      renderPagination(response.pagination);
    } else {
      showEmptyState(tableBody, "Không tìm thấy sản phẩm nào");
      document.getElementById("pagination").innerHTML = "";
    }
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function renderPagination(pagination) {
  const paginationEl = document.getElementById("pagination");
  let html = "";

  // Previous button
  html += `
        <li class="page-item ${pagination.page === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="loadProducts(${
              pagination.page - 1
            }); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

  // Page numbers
  for (let i = 1; i <= pagination.totalPages; i++) {
    if (
      i === 1 ||
      i === pagination.totalPages ||
      (i >= pagination.page - 2 && i <= pagination.page + 2)
    ) {
      html += `
                <li class="page-item ${i === pagination.page ? "active" : ""}">
                    <a class="page-link" href="#" onclick="loadProducts(${i}); return false;">${i}</a>
                </li>
            `;
    } else if (i === pagination.page - 3 || i === pagination.page + 3) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  // Next button
  html += `
        <li class="page-item ${
          pagination.page === pagination.totalPages ? "disabled" : ""
        }">
            <a class="page-link" href="#" onclick="loadProducts(${
              pagination.page + 1
            }); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

  paginationEl.innerHTML = html;
}

async function loadCategories() {
  try {
    const response = await CategoryAPI.getAll();
    const select = document.getElementById("madm");

    if (response.success) {
      select.innerHTML =
        '<option value="">-- Chọn danh mục --</option>' +
        response.data
          .map((cat) => `<option value="${cat.madm}">${cat.tendm}</option>`)
          .join("");
    }
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

async function loadUnits() {
  try {
    const response = await UnitAPI.getAll();
    const select = document.getElementById("madv");

    if (response.success) {
      select.innerHTML =
        '<option value="">-- Chọn đơn vị --</option>' +
        response.data
          .map((unit) => `<option value="${unit.madv}">${unit.tendv}</option>`)
          .join("");
    }
  } catch (error) {
    console.error("Error loading units:", error);
  }
}

function searchProducts() {
  loadProducts(1);
}

function openAddModal() {
  document.getElementById("modalTitle").textContent = "Thêm sản phẩm";
  document.getElementById("productForm").reset();
  document.getElementById("masp").value = "";
  document.getElementById("hinhsp").value = "";
  document.getElementById("hinhanh_arr").value = "";
  document.getElementById("imageFiles").value = "";

  // Clear all image arrays
  selectedFiles = [];
  existingImages = [];

  // Render gallery with just the "+" button
  renderImageGallery();

  productsModal.show();
}

// Preview image before upload
function previewImage(input) {
  const preview = document.getElementById("imagePreview");

  console.log("previewImage called", input.files);

  if (input.files && input.files[0]) {
    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      preview.innerHTML =
        '<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> Vui lòng chọn file ảnh</span>';
      input.value = "";
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      preview.innerHTML =
        '<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> File quá lớn (max 5MB)</span>';
      input.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      preview.innerHTML = `
        <img src="${e.target.result}" 
             alt="Preview" 
             style="max-width: 100%; max-height: 150px; object-fit: contain;">
        <div class="text-success mt-1" style="font-size: 0.75rem;">
          <i class="bi bi-check-circle"></i>  (${(file.size / 1024).toFixed(
            1
          )} KB)
        </div>
      `;
    };

    reader.onerror = function () {
      preview.innerHTML = '<span class="text-danger">Không thể đọc file</span>';
    };

    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '<span class="text-muted">Chưa có ảnh</span>';
  }
}

// ==================== MULTIPLE IMAGES PREVIEW ====================
let selectedFiles = [];
let existingImages = []; // Track existing images when editing

// Render all images (existing + new) with add button
function renderImageGallery() {
  const container = document.getElementById("imagePreviewContainer");
  container.innerHTML = "";

  const totalImages = existingImages.length + selectedFiles.length;

  // Show existing images
  existingImages.forEach((img, index) => {
    let imagePath = img;
    if (!imagePath.startsWith("http") && !imagePath.startsWith("/")) {
      imagePath = `../uploads/products/${imagePath}`;
    }

    const previewItem = document.createElement("div");
    previewItem.className = "image-preview-item";

    previewItem.innerHTML = `
      <img src="${imagePath}" alt="Ảnh ${
      index + 1
    }" onerror="this.style.opacity='0.3'">
      ${
        index === 0 && totalImages > 0
          ? '<span class="image-badge">Ảnh chính</span>'
          : ""
      }
      <button type="button" class="image-remove" onclick="removeExistingImage(${index})">
        <i class="bi bi-x"></i>
      </button>
    `;

    container.appendChild(previewItem);
  });

  // Show new selected files
  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const previewItem = document.createElement("div");
      previewItem.className = "image-preview-item";

      const isFirst = existingImages.length === 0 && index === 0;

      previewItem.innerHTML = `
        <img src="${e.target.result}" alt="Ảnh mới ${index + 1}">
        ${isFirst ? '<span class="image-badge">Ảnh chính</span>' : ""}
        <span class="image-badge" style="background: #10b981; top: ${
          isFirst ? "35px" : "5px"
        }">Mới</span>
        <button type="button" class="image-remove" onclick="removeNewImage(${index})">
          <i class="bi bi-x"></i>
        </button>
      `;

      container.appendChild(previewItem);
    };
    reader.readAsDataURL(file);
  });

  // Add "+" button to add more images
  const addButton = document.createElement("div");
  addButton.className = "image-preview-item";
  addButton.style.cursor = "pointer";
  addButton.style.border = "2px dashed #d1d5db";
  addButton.style.background = "#f9fafb";

  addButton.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #6b7280;">
      <i class="bi bi-plus-circle" style="font-size: 2rem;"></i>
      <span style="font-size: 0.75rem; margin-top: 0.5rem;">Thêm ảnh</span>
    </div>
  `;

  addButton.onclick = () => {
    document.getElementById("imageFiles").click();
  };

  container.appendChild(addButton);
}

function previewMultipleImages(input) {
  if (!input.files || input.files.length === 0) {
    renderImageGallery();
    return;
  }

  // Add new files to selectedFiles array
  Array.from(input.files).forEach((file) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      showAlert("error", `File "${file.name}" không phải là ảnh`);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert("error", `File "${file.name}" quá lớn (max 5MB)`);
      return;
    }

    selectedFiles.push(file);
  });

  // Clear input to allow selecting same file again
  input.value = "";

  renderImageGallery();
  console.log(
    `Total: ${existingImages.length} existing + ${selectedFiles.length} new images`
  );
}

// Remove existing image
function removeExistingImage(index) {
  existingImages.splice(index, 1);
  renderImageGallery();
  console.log(`Removed existing image. Remaining: ${existingImages.length}`);
}

// Remove new image
function removeNewImage(index) {
  selectedFiles.splice(index, 1);
  renderImageGallery();
  console.log(`Removed new image. Remaining: ${selectedFiles.length}`);
}

async function viewProduct(masp) {
  try {
    const response = await ProductAPI.getById(masp);
    if (response.success) {
      const product = response.data;
      const details = `
                <div class="modal fade" id="viewModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Chi tiết sản phẩm</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <table class="table">
                                    <tr><th width="200">Mã sản phẩm:</th><td>${
                                      product.masp
                                    }</td></tr>
                                    <tr><th>Tên sản phẩm:</th><td>${
                                      product.tensp
                                    }</td></tr>
                                    <tr><th>Danh mục:</th><td>${
                                      product.tendm || "-"
                                    }</td></tr>
                                    <tr><th>Đơn vị tính:</th><td>${
                                      product.tendv || "-"
                                    }</td></tr>
                                    <tr><th>Giá bán:</th><td>${formatCurrency(
                                      product.giaban
                                    )}</td></tr>
                                    <tr><th>Giảm giá:</th><td>${formatCurrency(
                                      product.giamgia
                                    )}</td></tr>
                                    <tr><th>Xuất xứ:</th><td>${
                                      product.xuatxu || "-"
                                    }</td></tr>
                                    <tr><th>Công dụng:</th><td>${
                                      product.congdung || "-"
                                    }</td></tr>
                                    <tr><th>Cách dùng:</th><td>${
                                      product.cachdung || "-"
                                    }</td></tr>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      document.body.insertAdjacentHTML("beforeend", details);
      const viewModal = new bootstrap.Modal(
        document.getElementById("viewModal")
      );
      viewModal.show();
      document
        .getElementById("viewModal")
        .addEventListener("hidden.bs.modal", function () {
          this.remove();
        });
    }
  } catch (error) {
    console.error("Error viewing product:", error);
  }
}

async function editProduct(masp) {
  try {
    const response = await ProductAPI.getById(masp);

    if (response.success) {
      const product = response.data;
      document.getElementById("modalTitle").textContent = "Sửa sản phẩm";
      document.getElementById("masp").value = product.masp;
      document.getElementById("tensp").value = product.tensp;
      document.getElementById("giaban").value = product.giaban;
      document.getElementById("giamgia").value = product.giamgia;
      document.getElementById("hinhsp").value = product.hinhsp || "";
      document.getElementById("hinhanh_arr").value = product.hinhanh_arr || "";
      document.getElementById("congdung").value = product.congdung || "";
      document.getElementById("xuatxu").value = product.xuatxu || "";
      document.getElementById("cachdung").value = product.cachdung || "";
      document.getElementById("madm").value = product.madm || "";
      document.getElementById("madv").value = product.madv || "";

      // Load existing images
      existingImages = [];
      if (product.hinhanh_arr) {
        try {
          existingImages = JSON.parse(product.hinhanh_arr);
        } catch (e) {
          if (product.hinhsp) {
            existingImages = [product.hinhsp];
          }
        }
      } else if (product.hinhsp) {
        existingImages = [product.hinhsp];
      }

      // Clear new files
      selectedFiles = [];
      document.getElementById("imageFiles").value = "";

      // Render gallery with existing images and add button
      renderImageGallery();

      productsModal.show();
    }
  } catch (error) {
    console.error("Error loading product:", error);
  }
}

async function saveProduct() {
  const masp = document.getElementById("masp").value;

  try {
    // Start with existing images (already filtered if any were removed)
    let imageArray = [...existingImages];
    let imagePath = imageArray.length > 0 ? imageArray[0] : "";

    // Upload new selected files
    if (selectedFiles.length > 0) {
      showAlert("info", `Đang tải ${selectedFiles.length} ảnh mới lên...`);

      const uploadedImages = [];

      // Upload each new image
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          const uploadResponse = await UploadAPI.uploadImage(file);

          if (uploadResponse.success) {
            uploadedImages.push(uploadResponse.filename);
          } else {
            showAlert(
              "error",
              `Tải ảnh ${i + 1} thất bại: ${uploadResponse.message}`
            );
          }
        } catch (err) {
          console.error(`Error uploading image ${i + 1}:`, err);
          showAlert("error", `Lỗi tải ảnh ${i + 1}`);
        }
      }

      if (uploadedImages.length > 0) {
        // Merge existing and new images
        imageArray = [...existingImages, ...uploadedImages];
        // First image (existing or new) as main image
        imagePath = imageArray[0];
        showAlert(
          "success",
          `Đã tải lên ${uploadedImages.length} ảnh mới thành công!`
        );
      } else {
        showAlert("error", "Không có ảnh nào được tải lên thành công!");
        return;
      }
    } else if (imageArray.length === 0) {
      // No existing and no new images
      showAlert("warning", "Vui lòng chọn ít nhất một ảnh!");
      return;
    }

    // Prepare product data
    const data = {
      tensp: document.getElementById("tensp").value,
      giaban: parseFloat(document.getElementById("giaban").value),
      giamgia: parseFloat(document.getElementById("giamgia").value) || 0,
      hinhsp: imagePath,
      hinhanh_arr: JSON.stringify(imageArray), // Store as JSON string
      congdung: document.getElementById("congdung").value,
      xuatxu: document.getElementById("xuatxu").value,
      cachdung: document.getElementById("cachdung").value,
      madm: document.getElementById("madm").value || null,
      madv: document.getElementById("madv").value || null,
    };

    // Save product
    let response;
    if (masp) {
      data.masp = parseInt(masp);
      response = await ProductAPI.update(data);
    } else {
      response = await ProductAPI.create(data);
    }

    if (response.success) {
      showAlert("success", response.message);
      productsModal.hide();
      loadProducts(currentPage);
      // Clear all image arrays
      selectedFiles = [];
      existingImages = [];
    }
  } catch (error) {
    console.error("Error saving product:", error);
    showAlert("error", "Có lỗi xảy ra khi lưu sản phẩm");
  }
}

async function deleteProduct(masp) {
  const confirmed = await confirmDelete(
    "Bạn có chắc chắn muốn xóa sản phẩm này?"
  );

  if (confirmed) {
    try {
      const response = await ProductAPI.delete(masp);

      if (response.success) {
        showAlert("success", response.message);
        loadProducts(currentPage);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }
}
