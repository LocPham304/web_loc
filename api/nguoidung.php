<?php
session_start();
require_once '../config/database.php';

setAPIHeaders();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    sendError('Unauthorized - Vui lòng đăng nhập', 401);
}

// Check if user is admin
if ($_SESSION['vaitro'] !== 'admin') {
    sendError('Forbidden - Bạn không có quyền truy cập', 403);
}

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if (isset($_GET['mand'])) {
            getUserById($conn, $_GET['mand']);
        } else {
            getAllUsers($conn);
        }
        break;
    
    case 'POST':
        createUser($conn);
        break;
    
    case 'PUT':
        updateUser($conn);
        break;
    
    case 'DELETE':
        if (isset($_GET['mand'])) {
            deleteUser($conn, $_GET['mand']);
        } else {
            sendError('Thiếu mã người dùng', 400);
        }
        break;
    
    default:
        sendError('Method không được hỗ trợ', 405);
        break;
}

function getAllUsers($conn) {
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $vaitro = isset($_GET['vaitro']) ? $_GET['vaitro'] : '';
    $trangthai = isset($_GET['trangthai']) ? $_GET['trangthai'] : '';
    
    $sql = "SELECT mand, tendangnhap, hoten, email, sodienthoai, vaitro, trangthai, ngaytao, langsau 
            FROM nguoidung WHERE 1=1";
    
    if (!empty($search)) {
        $search = $conn->real_escape_string($search);
        $sql .= " AND (tendangnhap LIKE '%{$search}%' OR hoten LIKE '%{$search}%' OR email LIKE '%{$search}%')";
    }
    
    if (!empty($vaitro)) {
        $vaitro = $conn->real_escape_string($vaitro);
        $sql .= " AND vaitro = '{$vaitro}'";
    }
    
    if (!empty($trangthai)) {
        $trangthai = $conn->real_escape_string($trangthai);
        $sql .= " AND trangthai = '{$trangthai}'";
    }
    
    $sql .= " ORDER BY ngaytao DESC";
    
    $result = $conn->query($sql);
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        // Convert mand to integer for consistency
        $row['mand'] = (int) $row['mand'];
        $users[] = $row;
    }
    
    sendResponse([
        'success' => true,
        'data' => $users,
        'total' => count($users)
    ]);
}

function getUserById($conn, $mand) {
    $mand = $conn->real_escape_string($mand);
    
    $sql = "SELECT mand, tendangnhap, hoten, email, sodienthoai, vaitro, trangthai, ngaytao, langsau 
            FROM nguoidung WHERE mand = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $mand);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        // Convert mand to integer for consistency
        $user['mand'] = (int) $user['mand'];
        sendResponse($user);
    } else {
        sendError('Không tìm thấy người dùng', 404);
    }
}

function createUser($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    $required = ['tendangnhap', 'matkhau', 'hoten', 'email'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("Trường {$field} không được để trống", 400);
        }
    }
    
    // Validate email
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        sendError('Email không hợp lệ', 400);
    }
    
    // Check if username exists
    $checkSql = "SELECT mand FROM nguoidung WHERE tendangnhap = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $data['tendangnhap']);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        sendError('Tên đăng nhập đã tồn tại', 409);
    }
    
    // Check if email exists
    $checkEmailSql = "SELECT mand FROM nguoidung WHERE email = ?";
    $checkEmailStmt = $conn->prepare($checkEmailSql);
    $checkEmailStmt->bind_param("s", $data['email']);
    $checkEmailStmt->execute();
    if ($checkEmailStmt->get_result()->num_rows > 0) {
        sendError('Email đã được sử dụng', 409);
    }
    
    // Hash password
    $hashedPassword = password_hash($data['matkhau'], PASSWORD_DEFAULT);
    
    // Insert new user
    $sql = "INSERT INTO nguoidung (tendangnhap, matkhau, hoten, email, sodienthoai, vaitro, trangthai) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    $sodienthoai = isset($data['sodienthoai']) ? $data['sodienthoai'] : null;
    $vaitro = isset($data['vaitro']) ? $data['vaitro'] : 'khachhang';
    $trangthai = isset($data['trangthai']) ? $data['trangthai'] : 'active';
    
    $stmt->bind_param("sssssss", 
        $data['tendangnhap'], 
        $hashedPassword, 
        $data['hoten'], 
        $data['email'],
        $sodienthoai,
        $vaitro,
        $trangthai
    );
    
    if ($stmt->execute()) {
        sendResponse([
            'success' => true,
            'message' => 'Tạo người dùng thành công',
            'mand' => $conn->insert_id
        ], 201);
    } else {
        sendError('Tạo người dùng thất bại: ' . $conn->error, 500);
    }
}

function updateUser($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['mand'])) {
        sendError('Thiếu mã người dùng', 400);
    }
    
    // Build update query
    $updates = [];
    $types = '';
    $values = [];
    
    if (isset($data['hoten'])) {
        $updates[] = "hoten = ?";
        $types .= 's';
        $values[] = $data['hoten'];
    }
    
    if (isset($data['email'])) {
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            sendError('Email không hợp lệ', 400);
        }
        $updates[] = "email = ?";
        $types .= 's';
        $values[] = $data['email'];
    }
    
    if (isset($data['sodienthoai'])) {
        $updates[] = "sodienthoai = ?";
        $types .= 's';
        $values[] = $data['sodienthoai'];
    }
    
    if (isset($data['vaitro'])) {
        $updates[] = "vaitro = ?";
        $types .= 's';
        $values[] = $data['vaitro'];
    }
    
    if (isset($data['trangthai'])) {
        $updates[] = "trangthai = ?";
        $types .= 's';
        $values[] = $data['trangthai'];
    }
    
    // Update password if provided
    if (!empty($data['matkhau'])) {
        $hashedPassword = password_hash($data['matkhau'], PASSWORD_DEFAULT);
        $updates[] = "matkhau = ?";
        $types .= 's';
        $values[] = $hashedPassword;
    }
    
    if (empty($updates)) {
        sendError('Không có dữ liệu để cập nhật', 400);
    }
    
    $types .= 'i';
    $values[] = $data['mand'];
    
    $sql = "UPDATE nguoidung SET " . implode(', ', $updates) . " WHERE mand = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);
    
    if ($stmt->execute()) {
        // Check if user exists
        $checkSql = "SELECT mand FROM nguoidung WHERE mand = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("i", $data['mand']);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows > 0) {
            sendResponse([
                'success' => true,
                'message' => 'Cập nhật người dùng thành công'
            ]);
        } else {
            sendError('Không tìm thấy người dùng', 404);
        }
    } else {
        sendError('Cập nhật thất bại: ' . $conn->error, 500);
    }
}

function deleteUser($conn, $mand) {
    // Prevent deleting current user
    if ($mand == $_SESSION['user_id']) {
        sendError('Không thể xóa tài khoản đang đăng nhập', 400);
    }
    
    $mand = $conn->real_escape_string($mand);
    
    $sql = "DELETE FROM nguoidung WHERE mand = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $mand);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            sendResponse([
                'success' => true,
                'message' => 'Xóa người dùng thành công'
            ]);
        } else {
            sendError('Không tìm thấy người dùng', 404);
        }
    } else {
        sendError('Xóa thất bại: ' . $conn->error, 500);
    }
}

$conn->close();
?>

