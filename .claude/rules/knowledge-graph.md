# Universal Knowledge Graph Dispatcher (Node-0)

# Mục lục
1. [Nguyên Tắc Điều Hướng 2 Tầng](#1-nguyên-tắc-điều-hướng-2-tầng)
2. [Bảng Phân Vùng Kiến Thức Tổng Quát (Node-0)](#2-bảng-phân-vùng-kiến-thức-tổng-quát-node-0)
3. [Định Dạng Lưu Trỏ Nội Dung (Pointer Contract)](#3-định-dạng-lưu-trỏ-nội-dung-pointer-contract)
4. [Quy Trình Mở Rộng Khi Thêm Phân Vùng Mới](#4-quy-trình-mở-rộng-khi-thêm-phân-vùng-mới)

---

# 1. Nguyên Tắc Điều Hướng 2 Tầng
- **Tầng 1 (Dispatcher Node-0 - File này):** Bản đồ tổng quan phân chia các phân vùng kiến thức (Domains) trong không gian làm việc. AI tra cứu bảng này để định vị nhanh khu vực tài liệu liên quan mà không cần quét toàn bộ workspace.
- **Tầng 2 (Leaf Nodes / Domain Specs):** Nằm tại `Docs/SourceOfTruth/<Domain>/` hoặc `.agents/rules/kg-<domain>.md`, chứa thông tin chi tiết, luồng hoạt động và danh mục thực thể của riêng phân vùng đó.
- **Mục tiêu:** Giảm 80-90% token tiêu hao cho việc tìm kiếm thông tin ngữ cảnh.

---

# 2. Bảng Phân Vùng Kiến Thức Tổng Quát (Node-0)

| Phân vùng (Domain) | Trách nhiệm & Nội dung chính | Vị trí Dữ liệu / Mã nguồn | Vị trí Doc Tầng 2 |
| :--- | :--- | :--- | :--- |
| **Core / Specifications** | Định nghĩa mục tiêu, yêu cầu cốt lõi, quy chuẩn chung | `Docs/SourceOfTruth/Core/` | `Docs/SourceOfTruth/Core/spec.txt` |
| **Lore / Content / Story** | Hồ sơ nhân vật, bối cảnh thế giới, dòng thời gian cốt truyện | `Docs/SourceOfTruth/Content/` | `Docs/SourceOfTruth/Content/lore.txt` |
| **Business / Operations** | Quy trình chuẩn (SOP), mục tiêu dự án, tài liệu vận hành | `Docs/SourceOfTruth/Operations/` | `Docs/SourceOfTruth/Operations/sop.txt` |
| **Research & Knowledge** | Dữ liệu kiểm chứng, nguồn tài liệu tham khảo, luận điểm | `Docs/SourceOfTruth/Research/` | `Docs/SourceOfTruth/Research/summary.txt` |
| **Architecture & Code** | Kiến trúc hệ thống, sơ đồ dữ liệu, API, module phần mềm | `src/` hoặc thư mục code chính | `Docs/SourceOfTruth/Architecture/` |

---

# 3. Định Dạng Lưu Trỏ Nội Dung (Pointer Contract)
Tất cả các tham chiếu trong Knowledge Graph phải tuân thủ dạng **THƯ MỤC + TÊN THỰC THỂ/SYMBOL BỀN VỮNG**:
- **ĐÚNG (Bền vững):** `Docs/SourceOfTruth/Content/` → `CharacterProfile: JohnDoe`, `Timeline: Chapter3`
- **SAI (Dễ bị lệch):** `Docs/SourceOfTruth/Content/lore.txt:L45-L80` *(Vì số dòng sẽ thay đổi khi tài liệu được cập nhật)*.

---

# 4. Quy Trình Mở Rộng Khi Thêm Phân Vùng Mới
1. Khi không gian làm việc mở rộng thêm một lĩnh vực mới (VD: `Finance`, `Marketing`, `Sub-System`):
2. Thêm 1 dòng vào Bảng Phân Vùng ở Tầng 1 (File này).
3. Khởi tạo tài liệu mô tả spec chi tiết tại `Docs/SourceOfTruth/<Domain>/spec.txt`.
