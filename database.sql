-- Database: Nhà Thuốc Chuyên Nghiệp
-- Professional Pharmacy Management System

CREATE DATABASE IF NOT EXISTS qlithuoc_7_10 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qlithuoc_7_10;

-- Table: donvitinh (Đơn vị tính)
CREATE TABLE IF NOT EXISTS donvitinh (
    madv INT(11) PRIMARY KEY AUTO_INCREMENT,
    tendv VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: danhmuc (Danh mục sản phẩm)
CREATE TABLE IF NOT EXISTS danhmuc (
    madm INT(11) PRIMARY KEY AUTO_INCREMENT,
    tendm VARCHAR(100) NOT NULL,
    mota TEXT,
    icon VARCHAR(100),
    thutu INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: sanpham (Sản phẩm) - Nâng cấp với nhiều thông tin hơn
CREATE TABLE IF NOT EXISTS sanpham (
    masp INT(11) PRIMARY KEY AUTO_INCREMENT,
    tensp VARCHAR(255) NOT NULL,
    giaban DECIMAL(10,2) NOT NULL,
    giamgia DECIMAL(10,2) DEFAULT 0,
    hinhsp VARCHAR(255),
    mota_ngan TEXT,
    congdung TEXT,
    thanh_phan TEXT,
    ham_luong VARCHAR(255),
    quy_cach VARCHAR(100),
    dang_bao_che VARCHAR(100),
    xuatxu VARCHAR(100),
    hang_sx VARCHAR(200),
    so_dang_ky VARCHAR(100),
    cachdung TEXT,
    chong_chi_dinh TEXT,
    tac_dung_phu TEXT,
    bao_quan TEXT,
    luot_xem INT DEFAULT 0,
    luot_ban INT DEFAULT 0,
    ton_kho INT DEFAULT 0,
    noibat BOOLEAN DEFAULT FALSE,
    trangthai ENUM('available','outofstock','discontinued') DEFAULT 'available',
    madm INT(11),
    madv INT(11),
    ngaytao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngaycapnhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (madm) REFERENCES danhmuc(madm) ON DELETE SET NULL,
    FOREIGN KEY (madv) REFERENCES donvitinh(madv) ON DELETE SET NULL,
    INDEX idx_tensp (tensp),
    INDEX idx_noibat (noibat),
    INDEX idx_trangthai (trangthai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: nhanvien (Nhân viên)
CREATE TABLE IF NOT EXISTS nhanvien (
    manv INT(11) PRIMARY KEY AUTO_INCREMENT,
    hoten VARCHAR(100) NOT NULL,
    gt ENUM('Nam','Nữ','Khác') DEFAULT 'Nam',
    ns DATE,
    ngayvl DATE,
    chucvu VARCHAR(100),
    sodienthoai VARCHAR(20),
    email VARCHAR(100),
    diachi TEXT,
    trangthai ENUM('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: nguoidung (Người dùng)
CREATE TABLE IF NOT EXISTS nguoidung (
    mand INT(11) PRIMARY KEY AUTO_INCREMENT,
    tendangnhap VARCHAR(50) NOT NULL UNIQUE,
    matkhau VARCHAR(255) NOT NULL,
    hoten VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    sodienthoai VARCHAR(20),
    diachi TEXT,
    vaitro ENUM('admin','nhanvien','khachhang') DEFAULT 'khachhang',
    trangthai ENUM('active','inactive') DEFAULT 'active',
    ngaytao DATETIME DEFAULT CURRENT_TIMESTAMP,
    langsau DATETIME,
    INDEX idx_tendangnhap (tendangnhap),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ma_giam_gia (Coupon/Voucher) - Di chuyển lên trước bảng donhang
CREATE TABLE IF NOT EXISTS ma_giam_gia (
    ma_code VARCHAR(50) PRIMARY KEY,
    ten_chuong_trinh VARCHAR(255) NOT NULL,
    loai ENUM('percent','fixed') DEFAULT 'percent',
    gia_tri DECIMAL(10,2) NOT NULL,
    gia_tri_don_hang_toi_thieu DECIMAL(10,2) DEFAULT 0,
    giam_toi_da DECIMAL(10,2),
    so_luong INT,
    da_su_dung INT DEFAULT 0,
    ngay_bat_dau DATETIME,
    ngay_ket_thuc DATETIME,
    trang_thai ENUM('active','inactive','expired') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: donhang (Đơn hàng) - Nâng cấp với nhiều thông tin hơn
CREATE TABLE IF NOT EXISTS donhang (
    sodh INT(11) PRIMARY KEY AUTO_INCREMENT,
    mand INT(11),
    nguoi_nhan VARCHAR(100) NOT NULL,
    sdt_nhan VARCHAR(20) NOT NULL,
    diachi_nhan TEXT NOT NULL,
    phi_vanchuyen DECIMAL(10,2) DEFAULT 0,
    ma_giam_gia VARCHAR(50),
    giam_gia DECIMAL(10,2) DEFAULT 0,
    tong_tien DECIMAL(10,2) NOT NULL,
    ghi_chu TEXT,
    phuong_thuc_thanh_toan ENUM('cod','bank_transfer','credit_card','momo') DEFAULT 'cod',
    trang_thai ENUM('pending','confirmed','processing','shipping','delivered','cancelled') DEFAULT 'pending',
    ngay_dat DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_xac_nhan DATETIME,
    ngay_giao DATETIME,
    manv INT(11),
    FOREIGN KEY (mand) REFERENCES nguoidung(mand) ON DELETE SET NULL,
    FOREIGN KEY (manv) REFERENCES nhanvien(manv) ON DELETE SET NULL,
    FOREIGN KEY (ma_giam_gia) REFERENCES ma_giam_gia(ma_code) ON DELETE SET NULL,
    INDEX idx_mand (mand),
    INDEX idx_trangthai (trang_thai),
    INDEX idx_ngaydat (ngay_dat),
    INDEX idx_ma_giam_gia (ma_giam_gia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: chitietdn (Chi tiết đơn hàng)
CREATE TABLE IF NOT EXISTS chitietdn (
    sodh INT(11),
    masp INT(11),
    sl INT(11) NOT NULL,
    gia DECIMAL(10,2) NOT NULL,
    giam_gia DECIMAL(10,2) DEFAULT 0,
    PRIMARY KEY (sodh, masp),
    FOREIGN KEY (sodh) REFERENCES donhang(sodh) ON DELETE CASCADE,
    FOREIGN KEY (masp) REFERENCES sanpham(masp) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: danhgia (Đánh giá sản phẩm)
CREATE TABLE IF NOT EXISTS danhgia (
    madg INT(11) PRIMARY KEY AUTO_INCREMENT,
    masp INT(11),
    mand INT(11),
    diem_so INT CHECK (diem_so >= 1 AND diem_so <= 5),
    noi_dung TEXT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    trang_thai ENUM('pending','approved','rejected') DEFAULT 'pending',
    FOREIGN KEY (masp) REFERENCES sanpham(masp) ON DELETE CASCADE,
    FOREIGN KEY (mand) REFERENCES nguoidung(mand) ON DELETE CASCADE,
    INDEX idx_masp (masp),
    INDEX idx_trangthai (trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Đơn vị tính
INSERT INTO donvitinh (tendv) VALUES 
('Hộp'), ('Chai'), ('Viên'), ('Gói'), ('Ống'), ('Lọ'), ('Tuýp'), ('Vỉ');

-- Danh mục sản phẩm
INSERT INTO danhmuc (tendm, mota, icon, thutu) VALUES 
('Thuốc không kê đơn', 'Thuốc OTC - Over The Counter', 'bi-capsule', 1),
('Thuốc giảm đau hạ sốt', 'Giảm đau, hạ sốt, kháng viêm', 'bi-heart-pulse', 2),
('Thuốc cảm cúm', 'Điều trị cảm cúm, sổ mũi', 'bi-snow', 3),
('Vitamin & Thực phẩm chức năng', 'Bổ sung vitamin, khoáng chất', 'bi-gem', 4),
('Thuốc tiêu hóa', 'Điều trị rối loạn tiêu hóa', 'bi-clipboard-pulse', 5),
('Thuốc da liễu', 'Điều trị các bệnh về da', 'bi-bandaid', 6),
('Thuốc mắt - Tai - Mũi - Họng', 'Chăm sóc mắt, tai, mũi, họng', 'bi-eye', 7),
('Thuốc tim mạch', 'Điều trị bệnh tim mạch', 'bi-heart', 8),
('Dược mỹ phẩm', 'Mỹ phẩm làm đẹp, chăm sóc da', 'bi-stars', 9),
('Chăm sóc sức khỏe', 'Thiết bị y tế, chăm sóc sức khỏe', 'bi-shield-check', 10);

-- Nhân viên
INSERT INTO nhanvien (hoten, gt, ns, ngayvl, chucvu, sodienthoai, email, trangthai) VALUES 
('Dược sĩ Nguyễn Văn An', 'Nam', '1990-05-15', '2020-01-10', 'Dược sĩ chính', '0901234567', 'an.nguyen@pharmacy.vn', 'active'),
('Dược sĩ Trần Thị Bình', 'Nữ', '1995-08-20', '2021-03-15', 'Dược sĩ tư vấn', '0901234568', 'binh.tran@pharmacy.vn', 'active'),
('Lê Văn Cường', 'Nam', '1988-12-03', '2019-06-20', 'Quản lý kho', '0901234569', 'cuong.le@pharmacy.vn', 'active'),
('Phạm Thị Diễm', 'Nữ', '1992-10-05', '2021-06-01', 'Nhân viên bán hàng', '0901234570', 'diem.pham@pharmacy.vn', 'active');

-- Người dùng (password: 123456)
INSERT INTO nguoidung (tendangnhap, matkhau, hoten, email, sodienthoai, vaitro, trangthai) VALUES 
('admin', '$2y$10$WOi7UjF4n/7xNhExFwFHvuuWbtmnqtr/QXAM1GUNU554xE.TJD/fS', 'Quản trị viên', 'admin@pharmacy.vn', '0901234567', 'admin', 'active'),
('nhanvien1', '$2y$10$TGt5r8b5iJU1yF0Uzwqhcu1R7RkxWG8IdvJVN1oIIx/HwejFV6DRe', 'Dược sĩ Nguyễn An', 'nhanvien@pharmacy.vn', '0901234568', 'nhanvien', 'active'),
('khachhang1', '$2y$10$5TqUobRDZWwEn1go1IRDd.tuarFe6oUxNqroTekAZnb0fInEZNPW6', 'Nguyễn Văn Khách', 'khach@gmail.com', '0901234569', 'khachhang', 'active'),
('khachhang2', '$2y$10$XupryJskBxYdQVLXAv60V.sc0Zmzq9RaZtbNsVtD8z9xd0B1ZMokG', 'Trần Thị Minh', 'minh@gmail.com', '0901234570', 'khachhang', 'active');

-- Sản phẩm (Nhiều sản phẩm thật như nhà thuốc)
INSERT INTO sanpham (tensp, giaban, giamgia, hinhsp, mota_ngan, congdung, thanh_phan, ham_luong, quy_cach, dang_bao_che, xuatxu, hang_sx, cachdung, chong_chi_dinh, bao_quan, ton_kho, noibat, trangthai, madm, madv) VALUES 

-- Thuốc giảm đau hạ sốt
('Paracetamol 500mg', 15000, 2000, 'paracetamol.jpg', 
'Thuốc giảm đau, hạ sốt hiệu quả', 
'Giảm đau nhẹ và vừa. Hạ sốt.', 
'Paracetamol', '500mg', 'Hộp 10 vỉ x 10 viên', 'Viên nén', 
'Việt Nam', 'Pymepharco', 
'Người lớn: 1-2 viên/lần, ngày 3-4 lần. Không quá 8 viên/ngày.', 
'Quá mẫn với Paracetamol', 'Nơi khô mát, tránh ánh sáng', 
500, TRUE, 'available', 2, 3),

('Efferalgan 500mg', 45000, 5000, 'efferalgan.jpg',
'Giảm đau hạ sốt nhanh, tan trong nước',
'Giảm đau và hạ sốt trong các trường hợp đau đầu, đau răng, đau sau chấn thương.',
'Paracetamol', '500mg', 'Tuýp 10 viên sủi', 'Viên sủi',
'Pháp', 'Sanofi',
'Hòa 1 viên trong 1 cốc nước (200ml). Uống 1 viên/lần, cách nhau 4-6 giờ.',
'Suy gan nặng, quá mẫn với thành phần thuốc', 'Nơi khô, nhiệt độ dưới 25°C',
200, TRUE, 'available', 2, 8),

-- Thuốc cảm cúm
('Decolgen', 35000, 3000, 'decolgen.jpg',
'Điều trị cảm cúm, sổ mũi, đau đầu',
'Giảm các triệu chứng cảm cúm: sốt, đau đầu, nghẹt mũi, sổ mũi.',
'Paracetamol 300mg, Phenylephrine 5mg, Chlorpheniramine 2mg', 'Viên phối hợp', 'Hộp 5 vỉ x 6 viên', 'Viên nén',
'Philippines', 'United Laboratories',
'Người lớn: 1 viên x 3 lần/ngày, sau ăn.',
'Quá mẫn thành phần, tăng huyết áp nặng', 'Nơi khô mát, tránh ánh sáng',
300, TRUE, 'available', 3, 3),

('Tiffy Day & Night', 48000, 0, 'tiffy.jpg',
'Trị cảm cúm ngày và đêm',
'Điều trị các triệu chứng cảm cúm. Viên ngày không gây buồn ngủ, viên đêm giúp ngủ ngon.',
'Paracetamol, Phenylephrine, Dextromethorphan', 'Phối hợp', 'Hộp 2 vỉ (Day 6 viên + Night 4 viên)', 'Viên nén',
'Singapore', 'Taisho',
'Viên ngày: 1 viên x 3 lần. Viên đêm: 1 viên trước khi ngủ.',
'Trẻ dưới 12 tuổi, phụ nữ có thai', 'Nơi khô mát',
150, TRUE, 'available', 3, 1),

-- Vitamin & TPCN
('Vitamin C 1000mg Blackmores', 320000, 30000, 'blackmores-vit-c.jpg',
'Tăng cường sức đề kháng',
'Bổ sung Vitamin C, tăng cường hệ miễn dịch, chống oxy hóa, làm đẹp da.',
'Ascorbic acid (Vitamin C)', '1000mg', 'Hộp 150 viên', 'Viên nén',
'Úc', 'Blackmores',
'Uống 1 viên/ngày sau bữa ăn.',
'Quá mẫn với thành phần', 'Nơi khô mát, tránh ánh sáng',
80, TRUE, 'available', 4, 3),

('Centrum Silver Adults 50+', 450000, 50000, 'centrum-silver.jpg',
'Vitamin tổng hợp cho người trên 50 tuổi',
'Bổ sung vitamin và khoáng chất thiết yếu cho người cao tuổi, hỗ trợ tim mạch, xương khớp.',
'Multivitamin & Multimineral', 'Phối hợp', 'Hộp 100 viên', 'Viên nén bao phim',
'Mỹ', 'Pfizer',
'Uống 1 viên/ngày với bữa ăn.',
'Quá mẫn với thành phần thuốc', 'Nơi khô, nhiệt độ 15-30°C',
50, FALSE, 'available', 4, 1),

-- Thuốc tiêu hóa
('Smecta', 78000, 8000, 'smecta.jpg',
'Điều trị tiêu chảy cấp và mãn tính',
'Điều trị triệu chứng của tiêu chảy cấp và mãn tính. Điều trị triệu chứng đau do bệnh lý dạ dày - thực quản - tà tràng.',
'Diosmectite', '3g', 'Hộp 10 gói', 'Bột uống',
'Pháp', 'Ipsen Pharma',
'Người lớn: 1 gói x 3 lần/ngày. Pha với 50ml nước, uống trước bữa ăn.',
'Tắc ruột, quá mẫn với thành phần', 'Nhiệt độ dưới 25°C',
120, TRUE, 'available', 5, 4),

('Buscopan 10mg', 65000, 0, 'buscopan.jpg',
'Giảm đau co thắt cơ trơn',
'Giảm đau co thắt đường tiêu hóa, đường mật, đường tiết niệu.',
'Hyoscine butylbromide', '10mg', 'Hộp 3 vỉ x 10 viên', 'Viên nén bao phim',
'Đức', 'Boehringer Ingelheim',
'1-2 viên x 3 lần/ngày.',
'Tắc ruột, tăng nhãn áp, phì đại tiền liệt tuyến', 'Nơi khô mát',
100, FALSE, 'available', 5, 3),

-- Thuốc da liễu
('Kem trị mụn Acnes 25g', 45000, 5000, 'acnes.jpg',
'Trị mụn trứng cá hiệu quả',
'Điều trị và ngăn ngừa mụn trứng cá, giảm sưng viêm, kháng khuẩn.',
'Sulfur, Vitamin E', 'Phối hợp', 'Tuýp 25g', 'Kem bôi',
'Việt Nam', 'Rohto',
'Rửa mặt sạch, lau khô. Thoa một lớp mỏng lên vùng da bị mụn 2-3 lần/ngày.',
'Quá mẫn với thành phần', 'Nơi khô mát, tránh ánh sáng trực tiếp',
200, TRUE, 'available', 6, 7),

('Gel bôi Acyclovir 5g', 35000, 0, 'acyclovir-gel.jpg',
'Điều trị Herpes simplex',
'Điều trị nhiễm virus Herpes simplex trên da và niêm mạc.',
'Acyclovir', '5%', 'Tuýp 5g', 'Gel bôi',
'Ấn Độ', 'Cipla',
'Thoa lên vùng da bị tổn thương 5 lần/ngày, cách nhau 4 giờ, trong 5-10 ngày.',
'Quá mẫn với Acyclovir', 'Nhiệt độ dưới 25°C',
80, FALSE, 'available', 6, 7),

-- Thuốc mắt tai mũi họng
('Nước muối sinh lý Sodium Chloride 0.9%', 12000, 0, 'nacl.jpg',
'Rửa mũi, rửa mắt, vệ sinh vùng kín',
'Dung dịch muối sinh lý dùng để rửa mũi, rửa mắt, vệ sinh vết thương.',
'Sodium Chloride', '0.9%', 'Hộp 20 ống x 5ml', 'Dung dịch',
'Việt Nam', 'Dược phẩm Hà Tây',
'Rửa mũi: nhỏ 1-2 ống mỗi bên mũi. Rửa mắt: 1-2 giọt mỗi mắt.',
'Không có', 'Nơi khô mát',
500, TRUE, 'available', 7, 5),

('Thuốc nhỏ mũi Otrivin 0.05%', 55000, 5000, 'otrivin.jpg',
'Giảm nghẹt mũi nhanh chóng',
'Làm co mạch, giảm nghẹt mũi do cảm lạnh, viêm mũi dị ứng.',
'Xylometazoline HCl', '0.05%', 'Chai 10ml', 'Dung dịch nhỏ mũi',
'Thụy Sĩ', 'Novartis',
'Người lớn: 2-3 giọt mỗi bên mũi, 3-4 lần/ngày. Không dùng quá 7 ngày.',
'Viêm mũi khô, trẻ dưới 6 tuổi', 'Nhiệt độ dưới 25°C',
150, FALSE, 'available', 7, 2),

-- Dược mỹ phẩm
('Kem chống nắng La Roche-Posay Anthelios SPF50+', 385000, 35000, 'laroche-anthelios.jpg',
'Kem chống nắng phổ rộng',
'Bảo vệ da khỏi tia UVA/UVB, phù hợp cho da nhạy cảm.',
'Avobenzone, Octocrylene', 'SPF 50+', 'Tuýp 50ml', 'Kem bôi',
'Pháp', 'La Roche-Posay',
'Thoa đều lên da 15 phút trước khi ra nắng. Thoa lại sau 2 giờ.',
'Quá mẫn với thành phần', 'Nơi khô mát, tránh nhiệt độ cao',
80, TRUE, 'available', 9, 7),

('Serum Vitamin C Vichy LiftActiv', 650000, 50000, 'vichy-serum.jpg',
'Serum dưỡng da chống lão hóa',
'Làm sáng da, mờ thâm nám, chống oxy hóa, kích thích collagen.',
'Vitamin C, Vitamin E, Hyaluronic Acid', '15% Vitamin C', 'Chai 20ml', 'Serum',
'Pháp', 'Vichy',
'Sau khi rửa mặt, lấy 3-4 giọt thoa đều lên mặt và cổ. Dùng 1-2 lần/ngày.',
'Da đang kích ứng, tổn thương', 'Nơi khô mát, tránh ánh sáng',
60, TRUE, 'available', 9, 6),

-- Chăm sóc sức khỏe
('Khẩu trang y tế 4 lớp', 35000, 5000, 'mask-4layer.jpg',
'Khẩu trang kháng khuẩn 4 lớp',
'Lọc bụi, vi khuẩn, virus. Thích hợp đi đường, nơi đông người.',
'Vải không dệt 4 lớp', 'BFE > 95%', 'Hộp 50 cái', 'Khẩu trang',
'Việt Nam', 'Nam Anh',
'Đeo khẩu trang che kín mũi và miệng. Thay sau 4 giờ sử dụng.',
'Không có', 'Nơi khô ráo, thoáng mát',
1000, FALSE, 'available', 10, 1);

-- Mã giảm giá
INSERT INTO ma_giam_gia (ma_code, ten_chuong_trinh, loai, gia_tri, gia_tri_don_hang_toi_thieu, giam_toi_da, so_luong, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES
('KHACHMOI50', 'Giảm 50K cho khách hàng mới', 'fixed', 50000, 200000, 50000, 100, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'active'),
('VITAMIN20', 'Giảm 20% Vitamin & TPCN', 'percent', 20, 300000, 100000, 200, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 'active'),
('FREESHIP', 'Miễn phí vận chuyển', 'fixed', 30000, 500000, 30000, 500, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 'active');

-- Đơn hàng mẫu
INSERT INTO donhang (mand, nguoi_nhan, sdt_nhan, diachi_nhan, phi_vanchuyen, ma_giam_gia, giam_gia, tong_tien, phuong_thuc_thanh_toan, trang_thai, ngay_dat, manv) VALUES
(3, 'Nguyễn Văn Khách', '0901234569', '123 Nguyễn Trãi, Q.1, TP.HCM', 30000, 'KHACHMOI50', 50000, 243000, 'cod', 'delivered', DATE_SUB(NOW(), INTERVAL 5 DAY), 1),
(3, 'Nguyễn Văn Khách', '0901234569', '123 Nguyễn Trãi, Q.1, TP.HCM', 30000, NULL, 0, 408000, 'bank_transfer', 'shipping', DATE_SUB(NOW(), INTERVAL 2 DAY), 2),
(4, 'Trần Thị Minh', '0901234570', '456 Lê Lợi, Q.3, TP.HCM', 30000, 'VITAMIN20', 64000, 344000, 'cod', 'confirmed', DATE_SUB(NOW(), INTERVAL 1 DAY), 1);

-- Chi tiết đơn hàng
INSERT INTO chitietdn (sodh, masp, sl, gia, giam_gia) VALUES
(1, 1, 2, 15000, 2000),
(1, 3, 1, 35000, 3000),
(1, 9, 1, 45000, 5000),
(2, 5, 1, 320000, 30000),
(2, 11, 1, 385000, 35000),
(3, 5, 1, 320000, 30000);

-- Đánh giá sản phẩm
INSERT INTO danhgia (masp, mand, diem_so, noi_dung, trang_thai) VALUES
(1, 3, 5, 'Thuốc giảm đau rất tốt, giá rẻ. Nhà thuốc giao hàng nhanh.', 'approved'),
(5, 3, 5, 'Vitamin C Blackmores chính hãng, đóng gói kỹ. Sẽ ủng hộ shop dài dài!', 'approved'),
(9, 4, 4, 'Kem trị mụn hiệu quả, da đỡ sưng đỏ sau 3 ngày dùng. Giá hơi cao một chút.', 'approved'),
(11, 4, 5, 'Kem chống nắng rất tốt, không gây nhờn. Đúng hàng Pháp.', 'approved');
