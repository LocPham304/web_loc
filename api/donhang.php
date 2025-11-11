<?php
require_once '../config/database.php';

setAPIHeaders();
$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['sodh'])) {
            // Lấy một đơn hàng chi tiết
            $sodh = intval($_GET['sodh']);
            
            // Thông tin đơn hàng
            $sql = "SELECT dh.*, nv.hoten as tennv 
                    FROM donhang dh 
                    LEFT JOIN nhanvien nv ON dh.manv = nv.manv 
                    WHERE dh.sodh = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $sodh);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($donhang = $result->fetch_assoc()) {
                // Chi tiết đơn hàng
                $sqlCT = "SELECT ct.*, sp.tensp, sp.hinhsp 
                          FROM chitietdn ct 
                          INNER JOIN sanpham sp ON ct.masp = sp.masp 
                          WHERE ct.sodh = ?";
                $stmtCT = $conn->prepare($sqlCT);
                $stmtCT->bind_param("i", $sodh);
                $stmtCT->execute();
                $resultCT = $stmtCT->get_result();
                
                $chitiet = [];
                while ($row = $resultCT->fetch_assoc()) {
                    $chitiet[] = $row;
                }
                
                $donhang['chitiet'] = $chitiet;
                // tong_tien đã bao gồm tất cả (sản phẩm + ship - giảm giá)
                // Không cần tính lại
                
                sendResponse(['success' => true, 'data' => $donhang]);
            } else {
                sendError('Đơn hàng không tồn tại', 404);
            }
        } elseif (isset($_GET['mand'])) {
            // Lấy đơn hàng theo user ID (cho trang "Đơn hàng của tôi")
            $mand = intval($_GET['mand']);
            
            $sql = "SELECT dh.*, nd.hoten as tennguoidung
                    FROM donhang dh 
                    LEFT JOIN nguoidung nd ON dh.mand = nd.mand 
                    WHERE dh.mand = ?
                    ORDER BY dh.sodh DESC";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $mand);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                // Lấy chi tiết đơn hàng
                $sqlCT = "SELECT ct.*, sp.tensp, sp.hinhsp 
                          FROM chitietdn ct 
                          INNER JOIN sanpham sp ON ct.masp = sp.masp 
                          WHERE ct.sodh = ?";
                $stmtCT = $conn->prepare($sqlCT);
                $stmtCT->bind_param("i", $row['sodh']);
                $stmtCT->execute();
                $resultCT = $stmtCT->get_result();
                
                $chitiet = [];
                while ($itemRow = $resultCT->fetch_assoc()) {
                    $chitiet[] = [
                        'tensp' => $itemRow['tensp'],
                        'sl' => $itemRow['sl'],
                        'gia' => $itemRow['gia'],
                        'giam_gia' => $itemRow['giam_gia'] ?? 0,
                        'hinhsp' => $itemRow['hinhsp']
                    ];
                }
                
                $row['chi_tiet'] = $chitiet;
                // tong_tien từ database đã đúng (bao gồm sản phẩm + ship - giảm giá)
                $data[] = $row;
            }
            
            sendResponse([
                'success' => true,
                'data' => $data
            ]);
        } else {
            // Lấy danh sách đơn hàng với phân trang (cho Admin)
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
            $offset = ($page - 1) * $limit;
            
            $sql = "SELECT dh.*, nv.hoten as tennv, nd.hoten as tennguoidung
                    FROM donhang dh 
                    LEFT JOIN nhanvien nv ON dh.manv = nv.manv 
                    LEFT JOIN nguoidung nd ON dh.mand = nd.mand
                    ORDER BY dh.sodh DESC 
                    LIMIT ? OFFSET ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                // tong_tien đã bao gồm tất cả (sản phẩm + phí ship - giảm giá)
                $data[] = $row;
            }
            
            // Đếm tổng số
            $countResult = $conn->query("SELECT COUNT(*) as total FROM donhang");
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
        // Tạo đơn hàng mới
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['chi_tiet']) || empty($input['chi_tiet'])) {
            sendError('Đơn hàng phải có ít nhất một sản phẩm');
        }
        
        if (!isset($input['mand'])) {
            sendError('Thiếu thông tin người dùng');
        }
        
        $conn->begin_transaction();
        
        try {
            // Thêm đơn hàng với đầy đủ thông tin
            $sql = "INSERT INTO donhang (
                mand, nguoi_nhan, sdt_nhan, diachi_nhan, 
                phi_vanchuyen, ma_giam_gia, giam_gia, tong_tien,
                ghi_chu, phuong_thuc_thanh_toan, trang_thai, ngay_dat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            
            $stmt = $conn->prepare($sql);
            
            $mand = $input['mand'];
            $nguoi_nhan = $input['nguoi_nhan'] ?? '';
            $sdt_nhan = $input['sdt_nhan'] ?? '';
            $diachi_nhan = $input['diachi_nhan'] ?? '';
            $phi_vanchuyen = $input['phi_vanchuyen'] ?? 0;
            $ma_giam_gia = $input['ma_giam_gia'] ?? null;
            $giam_gia = $input['giam_gia'] ?? 0;
            $tong_tien = $input['tong_tien'] ?? 0;
            $ghi_chu = $input['ghi_chu'] ?? null;
            $phuong_thuc_thanh_toan = $input['phuong_thuc_thanh_toan'] ?? 'cod';
            $trang_thai = $input['trang_thai'] ?? 'pending';
            
            $stmt->bind_param("isssdsddsss", 
                $mand, $nguoi_nhan, $sdt_nhan, $diachi_nhan,
                $phi_vanchuyen, $ma_giam_gia, $giam_gia, $tong_tien,
                $ghi_chu, $phuong_thuc_thanh_toan, $trang_thai
            );
            
            $stmt->execute();
            $sodh = $conn->insert_id;
            
            // Thêm chi tiết đơn hàng
            $sqlCT = "INSERT INTO chitietdn (sodh, masp, sl, gia, giam_gia) VALUES (?, ?, ?, ?, ?)";
            $stmtCT = $conn->prepare($sqlCT);
            
            foreach ($input['chi_tiet'] as $item) {
                if (!isset($item['masp']) || !isset($item['sl']) || !isset($item['gia'])) {
                    throw new Exception('Thông tin chi tiết đơn hàng không đầy đủ');
                }
                
                $giam_gia_sp = $item['giam_gia'] ?? 0;
                $stmtCT->bind_param("iiidd", $sodh, $item['masp'], $item['sl'], $item['gia'], $giam_gia_sp);
                $stmtCT->execute();
            }
            
            $conn->commit();
            
            sendResponse([
                'success' => true, 
                'message' => 'Tạo đơn hàng thành công',
                'sodh' => $sodh
            ], 201);
            
        } catch (Exception $e) {
            $conn->rollback();
            sendError('Không thể tạo đơn hàng: ' . $e->getMessage(), 500);
        }
        break;
        
    case 'PUT':
        // Cập nhật đơn hàng
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['sodh'])) {
            sendError('Thiếu số đơn hàng');
        }
        
        $conn->begin_transaction();
        
        try {
            // Cập nhật trạng thái đơn hàng (dùng cho cancel order)
            if (isset($input['trang_thai'])) {
                $sql = "UPDATE donhang SET trang_thai = ? WHERE sodh = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("si", $input['trang_thai'], $input['sodh']);
                $stmt->execute();
                
                if ($stmt->affected_rows === 0) {
                    $checkSql = "SELECT sodh FROM donhang WHERE sodh = ?";
                    $checkStmt = $conn->prepare($checkSql);
                    $checkStmt->bind_param("i", $input['sodh']);
                    $checkStmt->execute();
                    if ($checkStmt->get_result()->num_rows === 0) {
                        throw new Exception('Đơn hàng không tồn tại');
                    }
                }
                
                $conn->commit();
                sendResponse(['success' => true, 'message' => 'Cập nhật trạng thái đơn hàng thành công']);
                break;
            }
            
            // Cập nhật thông tin đơn hàng (admin)
            $sql = "UPDATE donhang SET giamgia = ?, manv = ? WHERE sodh = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("dii", $input['giamgia'], $input['manv'], $input['sodh']);
            $stmt->execute();
            
            if ($stmt->affected_rows === 0) {
                // Kiểm tra xem đơn hàng có tồn tại không
                $checkSql = "SELECT sodh FROM donhang WHERE sodh = ?";
                $checkStmt = $conn->prepare($checkSql);
                $checkStmt->bind_param("i", $input['sodh']);
                $checkStmt->execute();
                if ($checkStmt->get_result()->num_rows === 0) {
                    throw new Exception('Đơn hàng không tồn tại');
                }
            }
            
            // Nếu có cập nhật chi tiết, xóa chi tiết cũ và thêm mới
            if (isset($input['chitiet'])) {
                // Xóa chi tiết cũ
                $sqlDel = "DELETE FROM chitietdn WHERE sodh = ?";
                $stmtDel = $conn->prepare($sqlDel);
                $stmtDel->bind_param("i", $input['sodh']);
                $stmtDel->execute();
                
                // Thêm chi tiết mới
                $sqlCT = "INSERT INTO chitietdn (sodh, masp, sl, gia) VALUES (?, ?, ?, ?)";
                $stmtCT = $conn->prepare($sqlCT);
                
                foreach ($input['chitiet'] as $item) {
                    $stmtCT->bind_param("iiid", 
                        $input['sodh'], 
                        $item['masp'], 
                        $item['sl'], 
                        $item['gia']
                    );
                    $stmtCT->execute();
                }
            }
            
            $conn->commit();
            sendResponse(['success' => true, 'message' => 'Cập nhật đơn hàng thành công']);
            
        } catch (Exception $e) {
            $conn->rollback();
            sendError('Không thể cập nhật đơn hàng: ' . $e->getMessage(), 500);
        }
        break;
        
    case 'DELETE':
        // Xóa đơn hàng
        if (!isset($_GET['sodh'])) {
            sendError('Thiếu số đơn hàng');
        }
        
        $sodh = intval($_GET['sodh']);
        
        // Chi tiết đơn hàng sẽ tự động xóa do ON DELETE CASCADE
        $sql = "DELETE FROM donhang WHERE sodh = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $sodh);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Xóa đơn hàng thành công']);
            } else {
                sendError('Đơn hàng không tồn tại', 404);
            }
        } else {
            sendError('Không thể xóa đơn hàng: ' . $stmt->error, 500);
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}

$conn->close();
?>


