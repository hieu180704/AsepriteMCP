# Universal Recipes Index

# Mục lục
1. [Tổng quan](#1-tổng-quan)
2. [Bảng Tra Cứu Mẫu Cấu Trúc](#2-bảng-tra-cứu-mẫu-cấu-trúc)
3. [Recipes Thao Tác Aseprite Qua MCP](#3-recipes-thao-tác-aseprite-qua-mcp)

---

# 1. Tổng quan
Hai nhóm recipe khác nhau về bản chất:
- **Nhóm `recipe-*.md`** (mục 2) — mẫu cấu trúc tư duy và định dạng tài liệu, dùng cho mọi tác vụ.
- **Nhóm `aseprite-*.md`** (mục 3) — quy trình thao tác tool MCP khi làm việc với Aseprite.

---

# 2. Bảng Tra Cứu Mẫu Cấu Trúc

| File | Tên Mẫu | Mục đích & Ứng dụng |
| :--- | :--- | :--- |
| **`recipe-analysis.md`** | Bóc Tách & Phân Tích | Bóc tách vấn đề phức tạp, tìm nguyên nhân gốc rễ, phân tích dữ liệu |
| **`recipe-plan.md`** | Lập Kế Hoạch & Lộ Trình | Phân rã mục tiêu, thiết lập WBS, Milestones, quản lý rủi ro |
| **`recipe-decision-memo.md`** | Quyết Định & Đánh Giá | So sánh trade-offs, bản giải trình 7 phần trước khi chốt giải pháp |
| **`recipe-deliverable.md`** | Soạn Thảo Văn Bản Chuẩn | Mẫu sáng tác truyện, tài liệu nghiệp vụ, bài viết, báo cáo hoàn chỉnh |
| **`recipe-synthesis.md`** | Tổng Hợp & Nghiên Cứu | Nghiên cứu sâu đa nguồn, đối chiếu thông tin, hỏi đáp chuyên sâu |
| **`recipe-review-qc.md`** | Thẩm Định & Kiểm Lỗi | Kiểm tra tính logic, mâu thuẫn lore/nghiệp vụ, checklist nghiệm thu |

---

# 3. Recipes Thao Tác Aseprite Qua MCP

Áp dụng khi làm việc với MCP server `diivi/aseprite-mcp` (116 tools).
**Luôn đọc `aseprite-00-playbook.md` trước tiên** — nó chứa 8 rule cứng và giao thức kiểm chứng bắt
buộc mà ba recipe còn lại đều giả định đã nắm.

| File | Tên Mẫu | Mục đích & Ứng dụng |
| :--- | :--- | :--- |
| **`aseprite-00-playbook.md`** | Rule Cứng & Kiểm Chứng | Đọc trước tiên: giới hạn đã biết của AI, 8 rule cứng, giao thức verify 2 tầng, bảng tra tool |
| **`aseprite-static-sprite.md`** | Vẽ Sprite Tĩnh | Tạo nhân vật/item/tile/icon từ đầu — quy trình 7 bước |
| **`aseprite-animation.md`** | Animation Nhiều Frame | Idle/walk/attack/hurt/death — propagate + tween thay vì vẽ lại từng frame |
| **`aseprite-edit-existing.md`** | Sửa Asset Đã Có | Recolor, resize, đổi format, batch nhiều file — nhóm việc AI làm tốt nhất |
