# Hướng dẫn sử dụng Notion News Hub

Chào mừng bạn đến với **Notion News Hub** - Hệ thống tự động thu thập và tóm tắt tin tức thông minh bằng AI, đồng bộ trực tiếp vào Notion của bạn.

---

## 1. Yêu cầu Hệ thống (Chuẩn bị API Keys)

Để hệ thống hoạt động, bạn cần chuẩn bị các thông tin sau:

1.  **Google Gemini API Key**: 
    *   Truy cập [Google AI Studio](https://aistudio.google.com/).
    *   Tạo bản ghi mới và lấy API Key. (Hệ thống sử dụng model `gemini-1.5-flash`).
2.  **Notion API Key & Database ID**: Làm theo hướng dẫn trong Admin UI hoặc mục 3 bên dưới để kết nối.
3.  **Vercel KV (Database)**: 
    *   Trong Dashboard Vercel, chọn tab **Storage**.
    *   Nhấn **Create** -> **KV (Redis)**.
    *   Làm theo hướng dẫn để tạo Database và kết nối vào Project (Vercel sẽ tự động thêm biến môi trường `KV_URL`, `KV_REST_API_URL`).
4.  **Admin PIN**: Mã PIN tự chọn để bảo mật.

---

## 2. Cài đặt và Triển khai

### Bước 1: Kết nối Vercel KV
Sau khi tạo KV Storage trong Vercel, hãy đảm bảo bạn đã nhấn nút **Connect** để Vercel tự động thêm các biến môi trường cần thiết vào project.

### Bước 2: Thiết lập Environment Variables
Thiết lập các biến còn lại trên Vercel:
*   `GEMINI_API_KEY`: API Key của Google Gemini.
*   `NOTION_API_KEY`: Token của Notion Integration.
*   `NOTION_DATABASE_ID`: ID của Notion Database.
*   `ADMIN_PIN`: Mã PIN bảo mật của bạn.
3. Deploy project.

---

## 3. Hướng dẫn sử dụng Admin UI

Giao diện Admin cho phép bạn cấu hình hệ thống mà không cần sửa code.

### Quản lý nguồn RSS (RSS Sources)
*   **Thêm nguồn**: Nhập Tên (ví dụ: BBC) và link RSS URL, sau đó nhấn nút `+`.
*   **Xóa nguồn**: Nhấn nút `×` bên cạnh tên nguồn.

### Quản lý từ khóa (Keywords)
*   Hệ thống chỉ thu thập tin tức có chứa từ khóa bạn liệt kê.
*   Nhập từ khóa và nhấn `Enter` hoặc nút `+`.
*   Ví dụ: `AI`, `Công nghệ`, `Kinh tế`.

### Cài đặt Hệ thống (System Settings)
*   **Sync Interval**: Chọn tần suất hệ thống tự động quét tin (phút hoặc giờ).
*   **Admin PIN**: Nhập mã PIN bạn đã cài đặt ở Environment Variables để xác thực.

### Lưu thay đổi
*   Sau khi điều chỉnh, nhấn **Submit Changes** ở cuối trang để cập nhật cấu hình.

---

## 4. Cách thức hoạt động

1.  **Crawl**: Hệ thống tự động quét các nguồn RSS bạn đã cấu hình theo chu kỳ.
2.  **Lọc (Filter)**: Chỉ những bài viết chứa từ khóa mới được xử lý.
3.  **AI Summarize**: Sử dụng Gemini 1.5 Flash để tóm tắt bài viết thành 3 ý chính (Vietnamese).
4.  **Sync**: Đưa bài viết, link gốc và tóm tắt vào Notion Database dưới dạng một trang mới (Page).

---

## 5. Xử lý sự cố

*   **Lỗi "Unauthorized: Invalid Admin PIN"**: Kiểm tra kỹ mã PIN bạn nhập trong Admin UI có khớp với biến `ADMIN_PIN` trên Vercel không.
*   **Tin tức không về Notion**:
    *   Kiểm tra xem bạn đã "Connect" Integration vào Database chưa.
    *   Kiểm tra API Key của Notion và Gemini có còn hạn không.
    *   Xem Logs trên Vercel để biết chi tiết lỗi kỹ thuật.

---
**Notion News Hub** - Biến dữ liệu thế giới thành tri thức cá nhân của bạn.
