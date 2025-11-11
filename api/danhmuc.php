<?php

require_once '../config/database.php';

setAPIHeaders();
$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['madm'])) {
            // Lấy một danh mục theo mã
            $madm = intval($_GET['madm']);
            $sql = "SELECT * FROM danhmuc WHERE madm = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $madm);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                sendResponse(['success' => true, 'data' => $row]);
            } else {
                sendError('Danh mục không tồn tại', 404);
            }
        } else {
            // Lấy tất cả danh mục
            $sql = "SELECT dm.*, COUNT(sp.masp) as soluong_sp 
                    FROM danhmuc dm 
                    LEFT JOIN sanpham sp ON dm.madm = sp.madm 
                    GROUP BY dm.madm 
                    ORDER BY dm.madm DESC";
            $result = $conn->query($sql);
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            sendResponse(['success' => true, 'data' => $data]);
        }
        break;
        
    case 'POST':
        // Thêm danh mục mới
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['tendm']) || empty($input['tendm'])) {
            sendError('Tên danh mục không được để trống');
        }
        
        $sql = "INSERT INTO danhmuc (tendm) VALUES (?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $input['tendm']);
        
        if ($stmt->execute()) {
            sendResponse([
                'success' => true, 
                'message' => 'Thêm danh mục thành công',
                'madm' => $conn->insert_id
            ], 201);
        } else {
            sendError('Không thể thêm danh mục: ' . $stmt->error, 500);
        }
        break;
        
    case 'PUT':
        // Cập nhật danh mục
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['madm']) || !isset($input['tendm'])) {
            sendError('Thiếu thông tin bắt buộc');
        }
        
        $sql = "UPDATE danhmuc SET tendm = ? WHERE madm = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $input['tendm'], $input['madm']);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Cập nhật danh mục thành công']);
            } else {
                sendError('Danh mục không tồn tại hoặc không có thay đổi', 404);
            }
        } else {
            sendError('Không thể cập nhật danh mục: ' . $stmt->error, 500);
        }
        break;
        
    case 'DELETE':
        // Xóa danh mục
        if (!isset($_GET['madm'])) {
            sendError('Thiếu mã danh mục');
        }
        
        $madm = intval($_GET['madm']);
        
        // Kiểm tra xem danh mục có sản phẩm không
        $checkSql = "SELECT COUNT(*) as count FROM sanpham WHERE madm = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("i", $madm);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        $count = $checkResult->fetch_assoc()['count'];
        
        if ($count > 0) {
            sendError('Không thể xóa danh mục đang có sản phẩm', 400);
        }
        
        $sql = "DELETE FROM danhmuc WHERE madm = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $madm);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Xóa danh mục thành công']);
            } else {
                sendError('Danh mục không tồn tại', 404);
            }
        } else {
            sendError('Không thể xóa danh mục: ' . $stmt->error, 500);
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}

$conn->close();
?>


