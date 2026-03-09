# CaCon Stock PRO V8

Bộ website tĩnh sẵn sàng đưa lên GitHub Pages.

## Tính năng chính
- Tổng quan có chữ chạy, equity curve, thống kê theo tháng, xếp hạng mẫu hình theo tỷ lệ thắng.
- Tab Thị trường tự diễn giải số ngày phân phối.
- Tab Nhật ký có form thêm/sửa/xóa lệnh.
- Tab Phân tích hệ thống có checklist điều kiện mẫu hình và chèn ảnh chart để so sánh.
- Tab Mẫu hình lưu thư viện mẫu hình.
- Tab Radar cho phép thêm mã và chấm điểm 6 tiêu chí.
- Tab Thư viện và Tâm lý để ghi chú và checklist kỷ luật.
- Lưu dữ liệu bằng LocalStorage nên chạy ngay trên GitHub Pages, không cần backend.

## Cách chạy local
Chỉ cần mở file `index.html` trong trình duyệt.

## Đưa lên GitHub Pages
1. Tạo repo mới trên GitHub.
2. Upload toàn bộ file và thư mục `assets`.
3. Vào `Settings -> Pages`.
4. Chọn `Deploy from branch`.
5. Chọn nhánh `main` và thư mục `/root`.
6. Chờ GitHub xuất link website.

## Gợi ý nâng cấp tiếp
- Kết nối Firebase để đồng bộ đa thiết bị.
- Nhúng TradingView hoặc chart VN để theo dõi realtime.
- Tách dữ liệu user theo tài khoản.
- Tạo export Excel/PDF cho nhật ký giao dịch.
