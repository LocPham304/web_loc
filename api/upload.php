<?php
// Upload Image API for Products

require_once '../config/database.php';

// Start session for authentication check
session_start();

setAPIHeaders();

// Check authentication
if (!isset($_SESSION['user_id'])) {
    sendError('Unauthorized - Vui lòng đăng nhập', 401);
}

// Check admin role
if ($_SESSION['vaitro'] !== 'admin') {
    sendError('Forbidden - Chỉ Admin mới có quyền upload', 403);
}

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    sendError('Không có file được upload hoặc có lỗi xảy ra', 400);
}

$file = $_FILES['image'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$fileType = mime_content_type($file['tmp_name']);

if (!in_array($fileType, $allowedTypes)) {
    sendError('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)', 400);
}

// Validate file size (max 5MB)
$maxSize = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxSize) {
    sendError('File quá lớn. Kích thước tối đa 5MB', 400);
}

// Create upload directory if not exists
$uploadDir = '../uploads/products/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'product_' . time() . '_' . uniqid() . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Return success with file path
    sendResponse([
        'success' => true,
        'message' => 'Upload ảnh thành công',
        'filename' => $filename,
        'filepath' => 'uploads/products/' . $filename,
        'url' => '/lab-7-10/uploads/products/' . $filename
    ], 201);
} else {
    sendError('Không thể lưu file. Vui lòng thử lại', 500);
}
?>

