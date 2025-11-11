<?php
require_once '../config/database.php';

setAPIHeaders();
$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['manv'])) {
            // Lấy một nhân viên theo mã
            $manv = intval($_GET['manv']);
            $sql = "SELECT nv.*, COUNT(dh.sodh) as soluong_dh 
                    FROM nhanvien nv 
                    LEFT JOIN donhang dh ON nv.manv = dh.manv 
                    WHERE nv.manv = ? 
                    GROUP BY nv.manv";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $manv);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                sendResponse(['success' => true, 'data' => $row]);
            } else {
                sendError('Nhân viên không tồn tại', 404);
            }
        } else {
            // Lấy danh sách nhân viên
            $sql = "SELECT nv.*, COUNT(dh.sodh) as soluong_dh 
                    FROM nhanvien nv 
                    LEFT JOIN donhang dh ON nv.manv = dh.manv 
                    GROUP BY nv.manv 
                    ORDER BY nv.manv DESC";
            $result = $conn->query($sql);
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            sendResponse(['success' => true, 'data' => $data]);
        }
        break;
        
    case 'POST':
        // Thêm nhân viên mới
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['hoten']) || empty($input['hoten'])) {
            sendError('Họ tên không được để trống');
        }
        
        $sql = "INSERT INTO nhanvien (hoten, gt, ns, ngayvl) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        
        $gt = $input['gt'] ?? 'Nam';
        $ns = $input['ns'] ?? null;
        $ngayvl = $input['ngayvl'] ?? date('Y-m-d');
        
        $stmt->bind_param("ssss", $input['hoten'], $gt, $ns, $ngayvl);
        
        if ($stmt->execute()) {
            sendResponse([
                'success' => true, 
                'message' => 'Thêm nhân viên thành công',
                'manv' => $conn->insert_id
            ], 201);
        } else {
            sendError('Không thể thêm nhân viên: ' . $stmt->error, 500);
        }
        break;
        
    case 'PUT':
        // Cập nhật nhân viên
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['manv'])) {
            sendError('Thiếu mã nhân viên');
        }
        
        $sql = "UPDATE nhanvien SET hoten = ?, gt = ?, ns = ?, ngayvl = ? WHERE manv = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssi", 
            $input['hoten'], 
            $input['gt'], 
            $input['ns'], 
            $input['ngayvl'],
            $input['manv']
        );
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Cập nhật nhân viên thành công']);
            } else {
                sendError('Nhân viên không tồn tại hoặc không có thay đổi', 404);
            }
        } else {
            sendError('Không thể cập nhật nhân viên: ' . $stmt->error, 500);
        }
        break;
        
    case 'DELETE':
        // Xóa nhân viên
        if (!isset($_GET['manv'])) {
            sendError('Thiếu mã nhân viên');
        }
        
        $manv = intval($_GET['manv']);
        
        // Kiểm tra xem nhân viên có đơn hàng không
        $checkSql = "SELECT COUNT(*) as count FROM donhang WHERE manv = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("i", $manv);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        $count = $checkResult->fetch_assoc()['count'];
        
        if ($count > 0) {
            sendError('Không thể xóa nhân viên đã có đơn hàng', 400);
        }
        
        $sql = "DELETE FROM nhanvien WHERE manv = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $manv);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Xóa nhân viên thành công']);
            } else {
                sendError('Nhân viên không tồn tại', 404);
            }
        } else {
            sendError('Không thể xóa nhân viên: ' . $stmt->error, 500);
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}

$conn->close();
?>


