# CaCon Stock PRO V10.2

## Điểm mới
- Đã tách module thật bằng ES Modules
- Có dữ liệu mẫu trong `js/data/sample-data.js`
- Có liên kết dữ liệu giữa các file:
  - `journal.js` thêm lệnh -> `storage.js` lưu -> `dashboard.js` đọc lại số lệnh/winrate/vốn
  - `patterns.js` thêm mẫu -> `analysis.js` đọc điều kiện mẫu hình
  - `market.js` đổi ngày phân phối -> `dashboard.js` đổi khuyến nghị thị trường

## Cấu trúc
- `js/core/`: storage, state, utils, dom
- `js/data/`: dữ liệu mẫu
- `js/modules/`: từng tab riêng
- `js/app.js`: router tab và khởi động ứng dụng

## Cách dùng
Mở `index.html` hoặc upload toàn bộ lên GitHub Pages.
