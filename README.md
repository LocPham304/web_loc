# Hệ thống Quản lý Bán hàng

## Giới thiệu
Hệ thống quản lý bán hàng hoàn chỉnh được xây dựng bằng PHP, MySQL, HTML, CSS và Bootstrap. Hệ thống cung cấp các chức năng quản lý sản phẩm, danh mục, nhân viên, đơn hàng và thống kê doanh thu.

## Công nghệ sử dụng
- **Backend**: PHP 7.4+
- **Database**: MySQL 5.7+
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework CSS**: Bootstrap 5.3
- **Icons**: Bootstrap Icons
- **Server**: Apache (XAMPP)

## Tính năng

### 1. Quản lý Sản phẩm
- Thêm, sửa, xóa sản phẩm
- Tìm kiếm sản phẩm
- Phân trang danh sách
- Xem chi tiết sản phẩm

### 2. Quản lý Danh mục
- CRUD danh mục sản phẩm
- Hiển thị số lượng sản phẩm theo danh mục
- Giao diện dạng card thân thiện

### 3. Quản lý Nhân viên
- Quản lý thông tin nhân viên
- Theo dõi số lượng đơn hàng của từng nhân viên
- Giao diện card hiển thị nhân viên

### 4. Quản lý Đơn hàng
- Tạo đơn hàng mới với nhiều sản phẩm
- Xem chi tiết đơn hàng
- Tính toán tự động tổng tiền, giảm giá
- Xóa đơn hàng

### 5. Thống kê & Báo cáo
- Thống kê tổng quan (sản phẩm, đơn hàng, nhân viên, doanh thu)
- Top sản phẩm bán chạy
- Doanh thu theo tháng/năm
- Hiệu suất nhân viên
- Sản phẩm theo danh mục

## Cài đặt

### Yêu cầu hệ thống
- XAMPP (hoặc LAMP/WAMP)
- PHP >= 7.4
- MySQL >= 5.7
- Web Browser hiện đại (Chrome, Firefox, Edge)

### Các bước cài đặt

1. **Clone hoặc copy project vào thư mục htdocs**
   ```bash
   cd C:\xampp\htdocs
   # Copy thư mục lab-7-10 vào đây
   ```

2. **Tạo database**
   - Mở phpMyAdmin: http://localhost/phpmyadmin
   - Import file `database.sql` hoặc chạy các câu lệnh SQL trong file

3. **Cấu hình database**
   - Mở file `config/database.php`
   - Kiểm tra và điều chỉnh thông tin kết nối nếu cần:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('DB_NAME', 'qlthuocanhangca1');
   ```

4. **Chạy ứng dụng**
   - Khởi động XAMPP (Apache và MySQL)
   - Truy cập: http://localhost/lab-7-10

## Cấu trúc thư mục

```
lab-7-10/
├── api/                        # API endpoints
│   ├── sanpham.php            # API sản phẩm
│   ├── danhmuc.php            # API danh mục
│   ├── donvitinh.php          # API đơn vị tính
│   ├── nhanvien.php           # API nhân viên
│   ├── donhang.php            # API đơn hàng
│   └── thongke.php            # API thống kê
├── config/
│   └── database.php           # Cấu hình database
├── pages/                     # Các trang giao diện
│   ├── sanpham.html
│   ├── danhmuc.html
│   ├── nhanvien.html
│   ├── donhang.html
│   └── thongke.html
├── assets/
│   ├── css/
│   │   └── style.css          # Custom CSS
│   └── js/
│       ├── api.js             # API helper functions
│       ├── dashboard.js       # Dashboard logic
│       ├── sanpham.js         # Products logic
│       ├── danhmuc.js         # Categories logic
│       ├── nhanvien.js        # Employees logic
│       ├── donhang.js         # Orders logic
│       └── thongke.js         # Statistics logic
├── database.sql               # SQL database schema
├── postman_collection.json    # Postman API collection
├── index.html                 # Trang chủ
└── README.md                  # Tài liệu hướng dẫn
```

## API Documentation

### Base URL
```
http://localhost/lab-7-10/api
```

### Endpoints

#### 1. Sản phẩm (Products)

**GET** `/sanpham.php` - Lấy danh sách sản phẩm
- Query params: `page`, `limit`, `search`
- Response: Danh sách sản phẩm với pagination

**GET** `/sanpham.php?masp={id}` - Lấy chi tiết sản phẩm
- Response: Thông tin chi tiết sản phẩm

**POST** `/sanpham.php` - Thêm sản phẩm mới
```json
{
  "tensp": "Tên sản phẩm",
  "giaban": 50000,
  "giamgia": 5000,
  "madm": 1,
  "madv": 1
}
```

**PUT** `/sanpham.php` - Cập nhật sản phẩm
```json
{
  "masp": 1,
  "tensp": "Tên mới",
  "giaban": 60000
}
```

**DELETE** `/sanpham.php?masp={id}` - Xóa sản phẩm

#### 2. Danh mục (Categories)

**GET** `/danhmuc.php` - Lấy tất cả danh mục

**POST** `/danhmuc.php` - Thêm danh mục
```json
{
  "tendm": "Tên danh mục"
}
```

**PUT** `/danhmuc.php` - Cập nhật danh mục
```json
{
  "madm": 1,
  "tendm": "Tên mới"
}
```

**DELETE** `/danhmuc.php?madm={id}` - Xóa danh mục

#### 3. Đơn vị tính (Units)

**GET** `/donvitinh.php` - Lấy tất cả đơn vị tính
**POST** `/donvitinh.php` - Thêm đơn vị tính
**PUT** `/donvitinh.php` - Cập nhật đơn vị tính
**DELETE** `/donvitinh.php?madv={id}` - Xóa đơn vị tính

#### 4. Nhân viên (Employees)

**GET** `/nhanvien.php` - Lấy tất cả nhân viên

**POST** `/nhanvien.php` - Thêm nhân viên
```json
{
  "hoten": "Nguyễn Văn A",
  "gt": "Nam",
  "ns": "1990-01-01",
  "ngayvl": "2024-01-01"
}
```

**PUT** `/nhanvien.php` - Cập nhật nhân viên
**DELETE** `/nhanvien.php?manv={id}` - Xóa nhân viên

#### 5. Đơn hàng (Orders)

**GET** `/donhang.php` - Lấy danh sách đơn hàng
**GET** `/donhang.php?sodh={id}` - Lấy chi tiết đơn hàng

**POST** `/donhang.php` - Tạo đơn hàng mới
```json
{
  "manv": 1,
  "giamgia": 10000,
  "chitiet": [
    {
      "masp": 1,
      "sl": 2,
      "gia": 25000
    }
  ]
}
```

**DELETE** `/donhang.php?sodh={id}` - Xóa đơn hàng

#### 6. Thống kê (Statistics)

**GET** `/thongke.php?type=overview` - Thống kê tổng quan
**GET** `/thongke.php?type=sanpham_banchay&limit=10` - Top sản phẩm bán chạy
**GET** `/thongke.php?type=doanhthu_thang&year=2024` - Doanh thu theo tháng
**GET** `/thongke.php?type=sanpham_danhmuc` - Sản phẩm theo danh mục
**GET** `/thongke.php?type=nhanvien_hieusuat` - Hiệu suất nhân viên

## Testing với Postman

1. Import file `postman_collection.json` vào Postman
2. Collection bao gồm tất cả các API endpoints
3. Điều chỉnh base URL nếu cần
4. Chạy các request để test API

### Import Postman Collection
1. Mở Postman
2. Click **Import**
3. Chọn file `postman_collection.json`
4. Collection sẽ xuất hiện trong sidebar

## Sử dụng

### Dashboard
- Hiển thị thống kê tổng quan
- Top sản phẩm bán chạy
- Sản phẩm theo danh mục

### Quản lý Sản phẩm
1. Click menu **Sản phẩm**
2. Click **Thêm sản phẩm** để tạo mới
3. Click icon **Mắt** để xem chi tiết
4. Click icon **Bút chì** để sửa
5. Click icon **Thùng rác** để xóa

### Tạo Đơn hàng
1. Click menu **Đơn hàng**
2. Click **Tạo đơn hàng**
3. Chọn nhân viên và nhập giảm giá
4. Click **Thêm sản phẩm**
5. Chọn sản phẩm, nhập số lượng
6. Click **Lưu**

## Tính năng nổi bật

### Giao diện
- ✅ Responsive, tương thích mobile
- ✅ Modern UI với Bootstrap 5
- ✅ Animations mượt mà
- ✅ Icons đẹp mắt
- ✅ Thông báo real-time

### API
- ✅ RESTful API chuẩn
- ✅ JSON response
- ✅ Error handling đầy đủ
- ✅ Pagination support
- ✅ Search functionality

### Bảo mật
- ✅ Prepared statements (SQL injection prevention)
- ✅ Input validation
- ✅ Error handling
- ✅ CORS headers

## Xử lý lỗi thường gặp

### 1. Lỗi kết nối database
- Kiểm tra MySQL đã khởi động
- Kiểm tra thông tin database trong `config/database.php`
- Kiểm tra database đã được tạo

### 2. Lỗi 404 Not Found
- Kiểm tra đường dẫn URL
- Kiểm tra file tồn tại
- Kiểm tra cấu hình Apache

### 3. CORS Error
- API đã được cấu hình CORS headers
- Nếu vẫn lỗi, kiểm tra browser console

### 4. API không trả về dữ liệu
- Kiểm tra database có dữ liệu
- Mở browser Developer Tools > Network tab
- Kiểm tra response từ server

## Screenshots

### Dashboard
![Dashboard với thống kê tổng quan và top sản phẩm]

### Quản lý Sản phẩm
![Danh sách sản phẩm với tìm kiếm và phân trang]

### Quản lý Đơn hàng
![Tạo đơn hàng với nhiều sản phẩm]

## Tác giả
- Được phát triển cho môn Lab 7-10
- Sử dụng công nghệ web hiện đại
- UI/UX thân thiện người dùng

## License
MIT License - Free to use for educational purposes

## Support
Nếu gặp vấn đề, vui lòng:
1. Kiểm tra lại các bước cài đặt
2. Xem phần xử lý lỗi
3. Kiểm tra browser console
4. Kiểm tra PHP error log

## Future Enhancements
- [ ] Thêm chức năng upload hình ảnh
- [ ] Export báo cáo PDF/Excel
- [ ] Thêm authentication/authorization
- [ ] Real-time notifications
- [ ] Advanced charts với Chart.js
- [ ] Mobile app version

---

**Chúc bạn sử dụng hệ thống hiệu quả!** 🚀


