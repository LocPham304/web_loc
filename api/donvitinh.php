<?php
/**
 * API Quản lý Đơn vị tính
 * Endpoint: /api/donvitinh.php
 */

require_once '../config/database.php';

setAPIHeaders();
$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['madv'])) {
            // Lấy một đơn vị tính theo mã
            $madv = intval($_GET['madv']);
            $sql = "SELECT * FROM donvitinh WHERE madv = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $madv);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                sendResponse(['success' => true, 'data' => $row]);
            } else {
                sendError('Đơn vị tính không tồn tại', 404);
            }
        } else {
            // Lấy tất cả đơn vị tính
            $sql = "SELECT dv.*, COUNT(sp.masp) as soluong_sp 
                    FROM donvitinh dv 
                    LEFT JOIN sanpham sp ON dv.madv = sp.madv 
                    GROUP BY dv.madv 
                    ORDER BY dv.madv DESC";
            $result = $conn->query($sql);
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            sendResponse(['success' => true, 'data' => $data]);
        }
        break;
        
    case 'POST':
        // Thêm đơn vị tính mới
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['tendv']) || empty($input['tendv'])) {
            sendError('Tên đơn vị tính không được để trống');
        }
        
        $sql = "INSERT INTO donvitinh (tendv) VALUES (?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $input['tendv']);
        
        if ($stmt->execute()) {
            sendResponse([
                'success' => true, 
                'message' => 'Thêm đơn vị tính thành công',
                'madv' => $conn->insert_id
            ], 201);
        } else {
            sendError('Không thể thêm đơn vị tính: ' . $stmt->error, 500);
        }
        break;
        
    case 'PUT':
        // Cập nhật đơn vị tính
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['madv']) || !isset($input['tendv'])) {
            sendError('Thiếu thông tin bắt buộc');
        }
        
        $sql = "UPDATE donvitinh SET tendv = ? WHERE madv = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $input['tendv'], $input['madv']);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Cập nhật đơn vị tính thành công']);
            } else {
                sendError('Đơn vị tính không tồn tại hoặc không có thay đổi', 404);
            }
        } else {
            sendError('Không thể cập nhật đơn vị tính: ' . $stmt->error, 500);
        }
        break;
        
    case 'DELETE':
        // Xóa đơn vị tính
        if (!isset($_GET['madv'])) {
            sendError('Thiếu mã đơn vị tính');
        }
        
        $madv = intval($_GET['madv']);
        
        // Kiểm tra xem đơn vị tính có sản phẩm không
        $checkSql = "SELECT COUNT(*) as count FROM sanpham WHERE madv = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("i", $madv);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        $count = $checkResult->fetch_assoc()['count'];
        
        if ($count > 0) {
            sendError('Không thể xóa đơn vị tính đang được sử dụng', 400);
        }
        
        $sql = "DELETE FROM donvitinh WHERE madv = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $madv);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Xóa đơn vị tính thành công']);
            } else {
                sendError('Đơn vị tính không tồn tại', 404);
            }
        } else {
            sendError('Không thể xóa đơn vị tính: ' . $stmt->error, 500);
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}

$conn->close();
?>


