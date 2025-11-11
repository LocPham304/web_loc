<?php
session_start();
require_once '../config/database.php';

setAPIHeaders();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $action = isset($_GET['action']) ? $_GET['action'] : '';
        
        if ($action === 'login') {
            handleLogin($conn, $data);
        } else if ($action === 'register') {
            handleRegister($conn, $data);
        } else {
            sendError('Action không hợp lệ', 400);
        }
        break;
    
    case 'GET':
        $action = isset($_GET['action']) ? $_GET['action'] : '';
        
        if ($action === 'check') {
            checkAuth();
        } else if ($action === 'logout') {
            handleLogout();
        } else if ($action === 'profile') {
            getProfile($conn);
        } else {
            sendError('Action không hợp lệ', 400);
        }
        break;
    
    default:
        sendError('Method không được hỗ trợ', 405);
        break;
}

function handleLogin($conn, $data) {
    // Validate input
    if (empty($data['tendangnhap']) || empty($data['matkhau'])) {
        sendError('Tên đăng nhập và mật khẩu không được để trống', 400);
    }
    
    $tendangnhap = $conn->real_escape_string($data['tendangnhap']);
    
    // Get user from database
    $sql = "SELECT * FROM nguoidung WHERE tendangnhap = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        sendError('Database error: Bảng nguoidung không tồn tại. Vui lòng chạy database.sql để tạo bảng.', 500);
    }
    
    $stmt->bind_param("s", $tendangnhap);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendError('Tên đăng nhập hoặc mật khẩu không đúng', 401);
    }
    
    $user = $result->fetch_assoc();
    
    // Check account status
    if ($user['trangthai'] !== 'active') {
        sendError('Tài khoản đã bị khóa', 403);
    }
    
    // Verify password
    if (!password_verify($data['matkhau'], $user['matkhau'])) {
        sendError('Tên đăng nhập hoặc mật khẩu không đúng', 401);
    }
    
    // Update last login
    $updateSql = "UPDATE nguoidung SET langsau = NOW() WHERE mand = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("i", $user['mand']);
    $updateStmt->execute();
    
    // Store user info in session
    $_SESSION['user_id'] = $user['mand'];
    $_SESSION['tendangnhap'] = $user['tendangnhap'];
    $_SESSION['hoten'] = $user['hoten'];
    $_SESSION['vaitro'] = $user['vaitro'];
    
    // Remove sensitive data
    unset($user['matkhau']);
    
    sendResponse([
        'success' => true,
        'message' => 'Đăng nhập thành công',
        'user' => $user
    ]);
}

function handleRegister($conn, $data) {
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
    
    if ($checkStmt === false) {
        sendError('Database error: Bảng nguoidung không tồn tại. Vui lòng chạy database.sql để tạo bảng.', 500);
    }
    
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
    $insertSql = "INSERT INTO nguoidung (tendangnhap, matkhau, hoten, email, sodienthoai, vaitro) 
                  VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($insertSql);
    
    $sodienthoai = isset($data['sodienthoai']) ? $data['sodienthoai'] : null;
    $vaitro = isset($data['vaitro']) ? $data['vaitro'] : 'khachhang';
    
    $stmt->bind_param("ssssss", 
        $data['tendangnhap'], 
        $hashedPassword, 
        $data['hoten'], 
        $data['email'],
        $sodienthoai,
        $vaitro
    );
    
    if ($stmt->execute()) {
        sendResponse([
            'success' => true,
            'message' => 'Đăng ký thành công',
            'mand' => $conn->insert_id
        ], 201);
    } else {
        sendError('Đăng ký thất bại: ' . $conn->error, 500);
    }
}

function checkAuth() {
    if (isset($_SESSION['user_id'])) {
        // Get full user info from database
        $conn = getDBConnection();
        $sql = "SELECT mand, tendangnhap, hoten, email, sodienthoai, diachi, vaitro, trangthai, ngaytao 
                FROM nguoidung WHERE mand = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $user['mand'] = (int) $user['mand'];
            
            sendResponse([
                'authenticated' => true,
                'user' => $user
            ]);
        } else {
            // User not found in database, clear session
            session_destroy();
            sendResponse([
                'authenticated' => false
            ]);
        }
    } else {
        sendResponse([
            'authenticated' => false
        ]);
    }
}

function handleLogout() {
    session_destroy();
    sendResponse([
        'success' => true,
        'message' => 'Đăng xuất thành công'
    ]);
}

function getProfile($conn) {
    if (!isset($_SESSION['user_id'])) {
        sendError('Chưa đăng nhập', 401);
    }
    
    $userId = $_SESSION['user_id'];
    $sql = "SELECT mand, tendangnhap, hoten, email, sodienthoai, vaitro, trangthai, ngaytao, langsau 
            FROM nguoidung WHERE mand = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        sendResponse($user);
    } else {
        sendError('Không tìm thấy thông tin người dùng', 404);
    }
}

$conn->close();
?>

