<?php
require_once '../config/database.php';

setAPIHeaders();
$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['masp'])) {
            // Lấy một sản phẩm theo mã
            $masp = intval($_GET['masp']);
            $sql = "SELECT sp.*, dm.tendm, dv.tendv 
                    FROM sanpham sp 
                    LEFT JOIN danhmuc dm ON sp.madm = dm.madm 
                    LEFT JOIN donvitinh dv ON sp.madv = dv.madv 
                    WHERE sp.masp = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $masp);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                sendResponse(['success' => true, 'data' => $row]);
            } else {
                sendError('Sản phẩm không tồn tại', 404);
            }
        } else {
            // Lấy danh sách sản phẩm với phân trang và tìm kiếm
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
            $offset = ($page - 1) * $limit;
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            
            $where = "";
            if ($search) {
                $where = "WHERE sp.tensp LIKE '%" . $conn->real_escape_string($search) . "%'";
            }
            
            $sql = "SELECT sp.*, dm.tendm, dv.tendv 
                    FROM sanpham sp 
                    LEFT JOIN danhmuc dm ON sp.madm = dm.madm 
                    LEFT JOIN donvitinh dv ON sp.madv = dv.madv 
                    $where 
                    ORDER BY sp.masp ASC 
                    LIMIT ? OFFSET ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            // Đếm tổng số
            $countSql = "SELECT COUNT(*) as total FROM sanpham sp $where";
            $countResult = $conn->query($countSql);
            $total = $countResult->fetch_assoc()['total'];
            
            sendResponse([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => ceil($total / $limit)
                ]
            ]);
        }
        break;
        
    case 'POST':
        // Thêm sản phẩm mới
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['tensp']) || !isset($input['giaban'])) {
            sendError('Thiếu thông tin bắt buộc');
        }
        
        $sql = "INSERT INTO sanpham (tensp, giaban, giamgia, hinhsp, hinhanh_arr, congdung, xuatxu, cachdung, madm, madv) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        
        $giamgia = $input['giamgia'] ?? 0;
        $hinhsp = $input['hinhsp'] ?? null;
        $hinhanh_arr = $input['hinhanh_arr'] ?? null;
        $congdung = $input['congdung'] ?? null;
        $xuatxu = $input['xuatxu'] ?? null;
        $cachdung = $input['cachdung'] ?? null;
        $madm = $input['madm'] ?? null;
        $madv = $input['madv'] ?? null;
        
        $stmt->bind_param("sddsssssii", 
            $input['tensp'], 
            $input['giaban'], 
            $giamgia, 
            $hinhsp,
            $hinhanh_arr,
            $congdung, 
            $xuatxu, 
            $cachdung, 
            $madm, 
            $madv
        );
        
        if ($stmt->execute()) {
            sendResponse([
                'success' => true, 
                'message' => 'Thêm sản phẩm thành công',
                'masp' => $conn->insert_id
            ], 201);
        } else {
            sendError('Không thể thêm sản phẩm: ' . $stmt->error, 500);
        }
        break;
        
    case 'PUT':
        // Cập nhật sản phẩm
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['masp'])) {
            sendError('Thiếu mã sản phẩm');
        }
        
        $sql = "UPDATE sanpham SET 
                tensp = ?, giaban = ?, giamgia = ?, hinhsp = ?, hinhanh_arr = ?,
                congdung = ?, xuatxu = ?, cachdung = ?, madm = ?, madv = ? 
                WHERE masp = ?";
        $stmt = $conn->prepare($sql);
        
        $giamgia = $input['giamgia'] ?? 0;
        $hinhanh_arr = $input['hinhanh_arr'] ?? null;
        
        $stmt->bind_param("sddsssssiii", 
            $input['tensp'], 
            $input['giaban'], 
            $giamgia, 
            $input['hinhsp'],
            $hinhanh_arr,
            $input['congdung'], 
            $input['xuatxu'], 
            $input['cachdung'], 
            $input['madm'], 
            $input['madv'],
            $input['masp']
        );
        
        if ($stmt->execute()) {
            // affected_rows == 0 means no changes or product doesn't exist
            // We should check if product exists first
            $checkSql = "SELECT masp FROM sanpham WHERE masp = ?";
            $checkStmt = $conn->prepare($checkSql);
            $checkStmt->bind_param("i", $input['masp']);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows > 0) {
                // Product exists, update was successful (even if no changes)
                sendResponse(['success' => true, 'message' => 'Cập nhật sản phẩm thành công']);
            } else {
                sendError('Sản phẩm không tồn tại', 404);
            }
        } else {
            sendError('Không thể cập nhật sản phẩm: ' . $stmt->error, 500);
        }
        break;
        
    case 'DELETE':
        // Xóa sản phẩm
        if (!isset($_GET['masp'])) {
            sendError('Thiếu mã sản phẩm');
        }
        
        $masp = intval($_GET['masp']);
        $sql = "DELETE FROM sanpham WHERE masp = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $masp);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Xóa sản phẩm thành công']);
            } else {
                sendError('Sản phẩm không tồn tại', 404);
            }
        } else {
            sendError('Không thể xóa sản phẩm: ' . $stmt->error, 500);
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}

$conn->close();
?>


