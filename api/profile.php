<?php
session_start();
require_once '../config/database.php';

setAPIHeaders();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    sendError('Unauthorized - Vui lòng đăng nhập', 401);
}

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        getProfile($conn);
        break;
    
    case 'PUT':
        updateProfile($conn);
        break;
    
    default:
        sendError('Method không được hỗ trợ', 405);
        break;
}

// Get profile của user hiện tại
function getProfile($conn) {
    $mand = $_SESSION['user_id'];
    
    $sql = "SELECT mand, tendangnhap, hoten, email, sodienthoai, diachi, vaitro, trangthai, ngaytao 
            FROM nguoidung WHERE mand = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $mand);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $row['mand'] = (int) $row['mand'];
        sendResponse([
            'success' => true,
            'data' => $row
        ]);
    } else {
        sendError('Không tìm thấy người dùng', 404);
    }
}

// Update profile của user hiện tại
function updateProfile($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $mand = $_SESSION['user_id'];
    
    // Validate required fields
    if (empty($data['hoten'])) {
        sendError('Họ tên không được để trống', 400);
    }
    
    if (empty($data['email'])) {
        sendError('Email không được để trống', 400);
    }
    
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        sendError('Email không hợp lệ', 400);
    }
    
    // Check if email already exists for another user
    $sql = "SELECT mand FROM nguoidung WHERE email = ? AND mand != ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $data['email'], $mand);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        sendError('Email đã được sử dụng bởi tài khoản khác', 400);
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Handle password change if requested
        if (!empty($data['matkhau_cu']) && !empty($data['matkhau_moi'])) {
            // Verify old password
            $sql = "SELECT matkhau FROM nguoidung WHERE mand = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $mand);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            if (!password_verify($data['matkhau_cu'], $user['matkhau'])) {
                throw new Exception('Mật khẩu hiện tại không đúng');
            }
            
            // Update password
            $hashedPassword = password_hash($data['matkhau_moi'], PASSWORD_DEFAULT);
            $sql = "UPDATE nguoidung SET matkhau = ? WHERE mand = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("si", $hashedPassword, $mand);
            $stmt->execute();
        }
        
        // Update profile information
        $sql = "UPDATE nguoidung 
                SET hoten = ?, email = ?, sodienthoai = ?, diachi = ? 
                WHERE mand = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "ssssi",
            $data['hoten'],
            $data['email'],
            $data['sodienthoai'],
            $data['diachi'],
            $mand
        );
        $stmt->execute();
        
        // Commit transaction
        $conn->commit();
        
        // Get updated user data
        $sql = "SELECT mand, tendangnhap, hoten, email, sodienthoai, diachi, vaitro, trangthai, ngaytao 
                FROM nguoidung WHERE mand = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $mand);
        $stmt->execute();
        $result = $stmt->get_result();
        $updatedUser = $result->fetch_assoc();
        $updatedUser['mand'] = (int) $updatedUser['mand'];
        
        // Update session
        $_SESSION['hoten'] = $updatedUser['hoten'];
        
        sendResponse([
            'success' => true,
            'message' => 'Cập nhật thông tin thành công',
            'data' => $updatedUser
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        sendError($e->getMessage(), 400);
    }
}
?>

