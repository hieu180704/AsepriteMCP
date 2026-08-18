# AsepriteMCP — AI Agent Starter Kit

> 💡 **Khởi tạo nhanh:** Gõ `/init` để AI tự động phỏng vấn bối cảnh và cập nhật toàn bộ tài liệu dự án.

# Mục lục
1. [Mục Tiêu Dự Án](#1-mục-tiêu-dự-án)
2. [Bản Đồ Ngữ Cảnh](#2-bản-đồ-ngữ-cảnh)
3. [Quy Tắc Đặc Thù](#3-quy-tắc-đặc-thù)

---


# 1. Mục Tiêu Dự Án
- **Tên:** AsepriteMCP
- **Mô tả:** Dự án **dùng MCP để AI làm việc qua Aseprite**. Đây là dự án ứng dụng — sử dụng một MCP server có sẵn, **KHÔNG tự xây server**.
- **Server đang dùng:** `diivi/aseprite-mcp` (clone tại `vendor/aseprite-mcp`, 116 tools, đã kiểm chứng chạy thật).
- **Ba mục tiêu cốt lõi:**
  1. **AI tự tạo pixel art:** AI vẽ, sửa, quản lý layer/frame và animate sprite thông qua tool calls.
  2. **Tự động hoá export asset:** Batch export sprite sheet, atlas và JSON metadata theo convention cố định.
  3. **Phục vụ game Unity nội bộ:** Đầu ra phải khớp trực tiếp với pipeline import asset của Unity.

---

# 2. Bản Đồ Ngữ Cảnh
- **Tổng quan dự án (đọc trước tiên):** `Docs/SourceOfTruth/overview.txt`
- **Tài liệu gốc (Source of Truth):** `Docs/SourceOfTruth/`
- **Nhật ký quyết định:** `Docs/Decisions/`
- **Tiêu chí nghiệm thu:** `Docs/QC/`
- **Tiến độ đã hoàn thành:** `Docs/Done/`
- **MCP server bên thứ ba:** `vendor/aseprite-mcp/` (code upstream, không sửa trừ khi có lý do rõ ràng)
- **Cấu hình MCP mẫu cho client khác:** `mcp-client-config.example.json` ở gốc dự án (Claude Code dùng scope `local`, không đọc file này)

---

# 3. Quy Tắc Đặc Thù
- Tuân thủ quy trình 4 pha: `explore -> propose -> confirm -> execute`.
- Luôn hiển thị Status Line ở cuối phản hồi.
- **KHÔNG đề xuất tự xây MCP server.** Đây là ràng buộc cứng do người dùng chốt ngày 2026-08-18. Dự án dùng server có sẵn; mọi đề xuất kiểu "nên tự viết server bằng ngôn ngữ X" đều đi ngược định nghĩa dự án.
- **Model-agnostic là ràng buộc cứng:** cấu hình và quy ước không được gắn cứng vào một AI client cụ thể. Giữ `.mcp.json` ở dạng chuẩn để client nào cũng copy sang được.
- **Điểm mở còn lại:** convention export cho Unity, và xử lý bản cài Aseprite hiện tại (bản bẻ khoá nằm trong `Downloads/`, đường dẫn không ổn định). Chi tiết ở mục 5 và 6 của `Docs/SourceOfTruth/overview.txt`.
- **Đầu ra hướng Unity:** khi thiết kế format export, ưu tiên thứ Unity đọc được ngay (sprite sheet + JSON metadata) thay vì format trung gian phải convert thêm.
