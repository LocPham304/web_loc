<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'qlithuoc_7_10');

// Kết nối database
function getDBConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        $conn->set_charset("utf8mb4");
        return $conn;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed', 'message' => $e->getMessage()]);
        exit;
    }
}

// Thiết lập header cho API
function setAPIHeaders() {
    header('Content-Type: application/json; charset=utf-8');
    
    // Cho phép credentials (cookies/session)
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Hàm xử lý response JSON
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Hàm xử lý lỗi
function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// Hàm prepare an toàn
function safePrepare($conn, $sql) {
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        sendError('Database error: ' . $conn->error . '. Vui lòng kiểm tra bảng database đã được tạo chưa.', 500);
    }
    return $stmt;
}
?>


