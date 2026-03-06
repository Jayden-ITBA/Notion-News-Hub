# Hướng dẫn sử dụng Notion News Hub

Chào mừng bạn đến với **Notion News Hub** - Hệ thống tự động thu thập và tóm tắt tin tức thông minh bằng AI, đồng bộ trực tiếp vào Notion của bạn.

---

## 1. Yêu cầu Hệ thống (Chuẩn bị API Keys)

Để hệ thống hoạt động, bạn cần chuẩn bị các thông tin sau:

1.  **Google Gemini API Key**: 
    *   Truy cập [Google AI Studio](https://aistudio.google.com/).
    *   Tạo bản ghi mới và lấy API Key. (Hệ thống sử dụng model `gemini-1.5-flash`).
2.  **Notion API Key (Internal Integration Token)**:
    *   Truy cập [Notion My Integrations](https://www.notion.so/my-integrations).
    *   Tạo một Integration mới và sao chép `Internal Integration Token`.
3.  **Notion Database ID**:
    *   Tạo một Database trong Notion với các thuộc tính:
        *   `Title` (Kiểu Title)
        *   `Link` (Kiểu URL)
        *   `Source` (Kiểu Select)
        *   `Date` (Kiểu Date)
        *   `Insights` (Kiểu Rich Text)
    *   Kết nối Integration vừa tạo vào Database này (Top right -> Connect to).
    *   Lấy ID của Database từ URL (Chuỗi ký tự sau dấu `/` và trước `?v=`).
4.  **Admin PIN**:
    *   Một mã PIN tự chọn (ví dụ: `1234`) để bảo mật quyền truy cập Admin UI.

---

## 2. Cài đặt và Triển khai

### Triển khai lên Vercel
1. Đảm bảo bạn đã có tài khoản Vercel và Git.
2. Thiết lập các **Environment Variables** trên Vercel:
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
