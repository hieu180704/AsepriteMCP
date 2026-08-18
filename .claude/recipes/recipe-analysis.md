# Recipe: Bóc Tách & Phân Tích Vấn Đề (Root-Cause Analysis)

# Mục lục
1. [Mục Đích](#1-mục-đích)
2. [Cấu Trúc Mẫu Phân Tích](#2-cấu-trúc-mẫu-phân-tích)
3. [Checklist Kiểm Thẩm](#3-checklist-kiểm-thẩm)

---

# 1. Mục Đích
Sử dụng khi cần mổ xẻ một vấn đề phức tạp, điều tra sự cố, phân tích lỗ hổng logic hoặc đánh giá hiện trạng một hệ thống/văn bản.

---

# 2. Cấu Trúc Mẫu Phân Tích

```markdown
# BẢN PHÂN TÍCH: [Tên Vấn Đề / Hiện Tượng]

## 1. Tóm Tắt Hiện Trạng & Dấu Hiệu (Symptoms)
- **Mô tả ngắn:** Điều gì đang xảy ra?
- **Phạm vi ảnh hưởng:** Ai/bộ phận/phân hệ nào bị tác động?
- **Dữ kiện thực tế (Facts):** Các trích dẫn, số liệu hoặc bằng chứng trực tiếp.

## 2. Phân Tích Nguyên Nhân Gốc Rễ (Root-Cause Investigation)
- **Chuỗi nhân quả (5 Whys / Cause-and-Effect):**
  - Cấp 1 (Bề mặt): ...
  - Cấp 2 (Trung gian): ...
  - Cấp 3 (Gốc rễ): ...
- **Yếu tố loại trừ:** Những giả thuyết ban đầu đã được chứng minh là sai.

## 3. Rủi Ro & Tác Động Tiềm Ẩn (Impact & Risks)
- Nếu không xử lý ngay: Rủi ro ngắn hạn vs dài hạn.
- Tác động dây chuyền tới các phân hệ/nhân vật/tiến độ khác.

## 4. Đề Xuất Hướng Xử Lý
- **Giải pháp triệt để (Khuyến nghị):** ...
- **Giải pháp tạm thời (nếu cấp bách):** ...
```
