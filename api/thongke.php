<?php
/**
 * API Thống kê
 * Endpoint: /api/thongke.php
 */

require_once '../config/database.php';

setAPIHeaders();
$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError('Method not allowed', 405);
}

$type = $_GET['type'] ?? 'overview';

switch ($type) {
    case 'overview':
        // Thống kê tổng quan
        $data = [];
        
        // Tổng số sản phẩm
        $result = $conn->query("SELECT COUNT(*) as total FROM sanpham");
        $data['tong_sanpham'] = $result->fetch_assoc()['total'];
        
        // Tổng số đơn hàng
        $result = $conn->query("SELECT COUNT(*) as total FROM donhang");
        $data['tong_donhang'] = $result->fetch_assoc()['total'];
        
        // Tổng số nhân viên
        $result = $conn->query("SELECT COUNT(*) as total FROM nhanvien");
        $data['tong_nhanvien'] = $result->fetch_assoc()['total'];
        
        // Tổng số danh mục
        $result = $conn->query("SELECT COUNT(*) as total FROM danhmuc");
        $data['tong_danhmuc'] = $result->fetch_assoc()['total'];
        
        // Tổng doanh thu (dùng tong_tien đã tính sẵn)
        $sql = "SELECT SUM(tong_tien) as doanhthu FROM donhang";
        $result = $conn->query($sql);
        $data['tong_doanhthu'] = $result->fetch_assoc()['doanhthu'] ?? 0;
        
        sendResponse(['success' => true, 'data' => $data]);
        break;
        
    case 'sanpham_banchay':
        // Top sản phẩm bán chạy
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        
        $sql = "SELECT sp.masp, sp.tensp, sp.hinhsp, sp.giaban, 
                SUM(ct.sl) as soluong_ban,
                SUM(ct.sl * ct.gia) as doanhthu
                FROM sanpham sp
                INNER JOIN chitietdn ct ON sp.masp = ct.masp
                GROUP BY sp.masp
                ORDER BY soluong_ban DESC
                LIMIT ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        sendResponse(['success' => true, 'data' => $data]);
        break;
        
    case 'doanhthu_thang':
        // Doanh thu theo tháng
        $year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
        
        $sql = "SELECT 
                MONTH(dh.ngay_dat) as thang,
                COUNT(dh.sodh) as soluong_dh,
                SUM(dh.tong_tien + dh.giam_gia - dh.phi_vanchuyen) as tongtien,
                SUM(dh.giam_gia) as tong_giamgia,
                SUM(dh.tong_tien) as doanhthu
                FROM donhang dh
                WHERE YEAR(dh.ngay_dat) = ?
                GROUP BY MONTH(dh.ngay_dat)
                ORDER BY thang";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $year);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        sendResponse(['success' => true, 'data' => $data, 'year' => $year]);
        break;
        
    case 'sanpham_danhmuc':
        // Thống kê sản phẩm theo danh mục
        $sql = "SELECT dm.madm, dm.tendm, COUNT(sp.masp) as soluong_sp,
                COALESCE(SUM(ct.sl), 0) as tong_ban
                FROM danhmuc dm
                LEFT JOIN sanpham sp ON dm.madm = sp.madm
                LEFT JOIN chitietdn ct ON sp.masp = ct.masp
                GROUP BY dm.madm
                ORDER BY soluong_sp DESC";
        $result = $conn->query($sql);
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        sendResponse(['success' => true, 'data' => $data]);
        break;
        
    case 'nhanvien_hieusuat':
        // Hiệu suất nhân viên (chỉ tính đơn có manv - đơn được tạo bởi nhân viên)
        $sql = "SELECT nv.manv, nv.hoten,
                COUNT(dh.sodh) as soluong_dh,
                COALESCE(SUM(dh.tong_tien), 0) as doanhthu
                FROM nhanvien nv
                LEFT JOIN donhang dh ON nv.manv = dh.manv
                WHERE dh.manv IS NOT NULL
                GROUP BY nv.manv
                ORDER BY doanhthu DESC";
        $result = $conn->query($sql);
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        // Nếu không có dữ liệu từ nhân viên, trả về empty array
        if (empty($data)) {
            $data = [];
        }
        
        sendResponse(['success' => true, 'data' => $data]);
        break;
        
    default:
        sendError('Loại thống kê không hợp lệ', 400);
}

$conn->close();
?>


