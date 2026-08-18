# Recipe: Thẩm Định Chất Lượng & Kiểm Lỗi Logic (Review & QC)

# Mục lục
1. [Mục Đích](#1-mục-đích)
2. [Bảng Đánh Giá QC Chuẩn](#2-bảng-đánh-giá-qc-chuẩn)

---

# 1. Mục Đích
Sử dụng trước khi nghiệm thu bất kỳ sản phẩm nào để rà soát lỗi logic, mâu thuẫn ngữ cảnh, lỗi hành văn hoặc lỗ hổng kỹ thuật.

---

# 2. Bảng Đánh Giá QC Chuẩn

```markdown
# BÁO CÁO THẨM ĐỊNH QC: [Tên Sản Phẩm / Tác Vụ]

## 1. Bảng Kiểm Tra Tiêu Chuẩn (QC Checklist)
| Hạng mục kiểm tra | Tiêu chuẩn đánh giá | Kết quả (PASS/FAIL) | Ghi chú cụ thể |
| :--- | :--- | :---: | :--- |
| **Tính Nhất Quán (Consistency)** | Khớp với tài liệu gốc trong `Docs/SourceOfTruth/` | PASS | Không mâu thuẫn |
| **Tính Logic & Chặt Chẽ** | Không có lỗ hổng suy luận hoặc mâu thuẫn nhân quả | PASS | Luồng lập luận mạch lạc |
| **Tính Đầy Đủ (Completeness)** | Hoàn thiện 100%, không bị cắt xén hoặc để sót ý | PASS | Đạt yêu cầu |
| **Tính Rõ Ràng (Clarity)** | Trình bày trực diện, dễ hiểu, đúng văn phong | PASS | Chuẩn định dạng |

## 2. Danh Sách Lỗi & Điểm Cần Khắc Phục (Defects & Fixes)
1. **[Mức độ: Nghiêm trọng / Trung bình / Nhẹ]**: [Vị trí] — [Mô tả lỗi] -> *Cách khắc phục:* ...

## 3. Kết Luận Nghiệm Thu (Verdict)
- [ ] **ĐẠT (PASS):** Sẵn sàng đưa vào sử dụng và đóng gói vào `Docs/Done/`.
- [ ] **CHƯA ĐẠT (REWORK):** Cần chỉnh sửa các điểm nêu trên trước khi nghiệm thu.
```
