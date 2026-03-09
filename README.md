# CaCon Stock PRO V10

Bản V10 đã được tách thành các module riêng để dễ sửa, dễ nâng cấp và dễ triển khai trên GitHub Pages.

## Cấu trúc thư mục
- `index.html`
- `style.css`
- `assets/`
- `js/core/`
  - `utils.js`
  - `storage.js`
  - `state.js`
  - `dom.js`
- `js/modules/`
  - `dashboard.js`
  - `market.js`
  - `journal.js`
  - `patterns.js`
  - `analysis.js`
  - `radar.js`
  - `notes.js`
- `js/app.js`

## Tính năng
- Không cần đăng nhập
- Chạy trực tiếp trên GitHub Pages
- Dashboard tổng quan
- Nhật ký giao dịch
- Mẫu hình + upload ảnh
- Phân tích hệ thống
- Radar 3 mô-đun
- Ghi chú Tâm lý / Thư viện
- Xuất nhập dữ liệu JSON

## Cách dùng
1. Upload toàn bộ thư mục lên GitHub
2. Bật GitHub Pages
3. Mở web là dùng ngay

## Dữ liệu
Dữ liệu lưu bằng `localStorage` với key `cacon-stock-v10`.