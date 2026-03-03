// firebase.js
// Cấu hình kết nối dự án CaCon Stock của anh Hiền [cite: 2026-03-02]
const firebaseConfig = {
  apiKey: "AIzaSyCapUGa35wIhvA2Y0NcCzUYCqLnOXEFkJc",
  authDomain: "cacon-stock-b4cab.firebaseapp.com",
  projectId: "cacon-stock-b4cab",
  storageBucket: "cacon-stock-b4cab.firebasestorage.app",
  messagingSenderId: "835007942800",
  appId: "1:835007942800:web:2e91579fae013d56b10815",
  measurementId: "G-RFNN6PYY8R"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ cốt lõi
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Biến trạng thái người dùng
let currentUser = null;
let userRole = 'user'; // Mặc định là người dùng thường

/**
 * Kiểm tra quyền Admin dựa trên ID người dùng [cite: 2026-02-16]
 * Lưu ý: Anh cần tạo collection 'users' trên Firestore thủ công
 */
async function checkAdminRole(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists && doc.data().role === 'admin') {
            userRole = 'admin';
            document.body.classList.add('is-admin'); // Hiển thị các nút dành riêng cho anh
            return true;
        }
    } catch (error) {
        console.error("Lỗi kiểm tra quyền hạn:", error);
    }
    userRole = 'user';
    document.body.classList.remove('is-admin');
    return false;
}