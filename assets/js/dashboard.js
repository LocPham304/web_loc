// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
});

async function loadDashboard() {
    try {
        // Load overview statistics
        await loadOverviewStats();
        
        // Load top products
        await loadTopProducts();
        
        // Load category statistics
        await loadCategoryStats();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadOverviewStats() {
    try {
        const response = await StatisticsAPI.getOverview();
        
        if (response.success) {
            const data = response.data;
            document.getElementById('totalProducts').textContent = data.tong_sanpham;
            document.getElementById('totalOrders').textContent = data.tong_donhang;
            document.getElementById('totalEmployees').textContent = data.tong_nhanvien;
            document.getElementById('totalRevenue').textContent = formatCurrency(data.tong_doanhthu);
        }
    } catch (error) {
        console.error('Error loading overview stats:', error);
    }
}

async function loadTopProducts() {
    const tableBody = document.getElementById('topProductsTable');
    
    try {
        const response = await StatisticsAPI.getTopProducts(5);
        
        if (response.success && response.data.length > 0) {
            tableBody.innerHTML = response.data.map((product, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${product.tensp}</td>
                    <td>${formatCurrency(product.giaban)}</td>
                    <td><span class="badge bg-primary">${product.soluong_ban}</span></td>
                    <td class="text-success fw-bold">${formatCurrency(product.doanhthu)}</td>
                </tr>
            `).join('');
        } else {
            showEmptyState(tableBody, 'Chưa có dữ liệu bán hàng');
        }
    } catch (error) {
        console.error('Error loading top products:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Không thể tải dữ liệu
                </td>
            </tr>
        `;
    }
}

async function loadCategoryStats() {
    const chartDiv = document.getElementById('categoryChart');
    
    try {
        const response = await StatisticsAPI.getProductsByCategory();
        
        if (response.success && response.data.length > 0) {
            let html = '<div class="list-group">';
            
            response.data.forEach(cat => {
                const percentage = cat.tong_ban > 0 ? (cat.tong_ban / 100) : 0;
                html += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold">${cat.tendm}</span>
                            <span class="badge bg-primary">${cat.soluong_sp} SP</span>
                        </div>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${Math.min(percentage, 100)}%" 
                                 aria-valuenow="${cat.tong_ban}" aria-valuemin="0" aria-valuemax="100">
                                ${cat.tong_ban} đã bán
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            chartDiv.innerHTML = html;
        } else {
            showEmptyState(chartDiv, 'Chưa có dữ liệu danh mục');
        }
    } catch (error) {
        console.error('Error loading category stats:', error);
        chartDiv.innerHTML = '<div class="alert alert-danger">Không thể tải dữ liệu</div>';
    }
}


