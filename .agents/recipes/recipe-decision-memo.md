# Recipe: Bản Giải Trình Quyết Định 7 Phần (Decision Memo)

# Mục lục
1. [Mục Đích](#1-mục-đích)
2. [Cấu Trúc Chuẩn 7 Phần](#2-cấu-trúc-chuẩn-7-phần)

---

# 1. Mục Đích
Sử dụng khi đứng trước các ngã rẽ quan trọng (chọn công nghệ, hướng phát triển cốt truyện, quyết định cấu trúc tổ chức, giải pháp kỹ thuật) cần sự đồng thuận rõ ràng.

---

# 2. Cấu Trúc Chuẩn 7 Phần

```markdown
# DECISION MEMO: [Tên Quyết Định Cần Chốt]

## 1. Hiện Trạng & Bài Toán Cần Giải
Mô tả bối cảnh hiện tại và lý do tại sao phải đưa ra quyết định lúc này.

## 2. Tiêu Chí Đánh Giá (Decision Rubrics)
- Tiêu chí 1: Tính chính xác / logic / phù hợp bối cảnh.
- Tiêu chí 2: Độ đơn giản & khả năng bảo trì.
- Tiêu chí 3: Tối ưu chi phí / token / thời gian.

## 3. Các Phương Án Đã Loại Trừ & Lý Do (Options Ruled Out)
- **Phương án A:** [Mô tả] -> *Lý do loại:* ...
- **Phương án B:** [Mô tả] -> *Lý do loại:* ...

## 4. Phương Án Đề Xuất (Recommended Solution)
Mô tả chi tiết giải pháp được chọn và giải thích tại sao đây là phương án tối ưu nhất.

## 5. Rủi Ro Tiềm Ẩn & Bẫy Ngầm (Gotchas & Risks)
Các trường hợp biên (edge cases), tác dụng phụ hoặc bẫy logic có thể xảy ra và cách phòng ngừa.

## 6. Lộ Trình Triển Khai Cụ Thể (Action Steps)
Các bước hành động từng bước để thực hiện giải pháp.

## 7. Tiêu Chí Kiểm Chứng Nghiệm Thu (Verification Plan)
Cách kiểm tra để chứng minh quyết định đã được thực hiện thành công và không gây lỗi phát sinh.
```
