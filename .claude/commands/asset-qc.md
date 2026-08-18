---
name: asset-qc
description: Chạy trọn bộ kiểm chứng một file .aseprite — sprite info, palette, layer/cel, animation, diff frame liền kề, export PNG rồi soi bằng mắt.
---

# Kỹ năng /asset-qc — Kiểm Chứng Asset Aseprite

# Mục lục
1. Đầu vào & Ngưỡng
2. Quy trình 6 bước
3. Mẫu báo cáo
4. Kỷ luật bắt buộc

---

## 1. Đầu vào & Ngưỡng

**Đầu vào:** một đường dẫn **tuyệt đối** tới file `.aseprite` (R1 — đường dẫn tương đối giải theo cwd
của tiến trình server, gãy không báo trước). Không có đường dẫn thì hỏi, không đoán.

**Ngưỡng cảnh báo:** dùng bảng tại mục 4.1 của `.agents/recipes/aseprite-00-playbook.md`.
Đọc bảng đó trước khi chấm điểm. **Không tự định nghĩa lại ngưỡng trong phiên** — một ngưỡng chỉ
được sống ở một chỗ, chép ra là hai nguồn lệch nhau.

**Frame index:** mọi tool nhận **1-based**. JSON export ra lại ghi 0-based — đừng lẫn khi đối chiếu tag.

---

## 2. Quy trình 6 bước

**Bước 1 — `get_sprite_info(filename)`**
Đây là bước định phạm vi cho mọi bước sau: lấy kích thước, số frame, **danh sách layer thật**, tag.
Các bước sau dùng danh sách layer này làm đầu vào — không bịa tên layer.
Đối chiếu với kế hoạch/yêu cầu ban đầu; lệch là FAIL, không phải WARN.

**Bước 2 — `get_color_stats(filename, frame_index=1, top=16)`**
Kỷ luật palette. Soi cả số màu unique lẫn các màu gần trùng nhau (dấu hiệu tự bịa màu shading thay
vì lấy từ `generate_color_ramp` — R3).

**Bước 3 — `validate_scene(filename, required_layers=[...], start_frame=1, end_frame=N)`**
`required_layers` lấy từ danh sách layer ở bước 1. Bắt layer/cel thiếu trong dải frame.

**Bước 4 — `audit_animation(filename, start_frame=1, end_frame=N)`**
Overlap bất thường và layer hoạt động ngoài dải frame của nó.
Sprite tĩnh (1 frame): **bỏ bước này và nói rõ đã bỏ vì sao**, không im lặng.

**Bước 5 — `compare_frames(filename, frame_a, frame_b)` cho mọi cặp frame liền kề**
(1,2), (2,3), ... (N-1,N). Đây là bước bắt hai lỗi nặng nhất của animation: frame quên vẽ và
nhân vật biến dạng giữa các frame. Sprite tĩnh: bỏ, nói rõ.

**Bước 6 — Export rồi nhìn**
`export_sprite(filename, output_filename, format="png")` → đọc file PNG bằng khả năng đọc ảnh của
client → tự chấm: silhouette có nhận ra vật thể không, tỉ lệ có đúng không, có pixel rác lạc lõng không.

Client **không** đọc được ảnh thì dừng ở bước 5, báo rõ với người dùng là **chưa verify bằng mắt**.
Không được im lặng bỏ qua rồi kết luận đạt.

Cần soi kỹ một vùng cụ thể thì thêm `get_composite_rect(x,y,w,h,frame_index)` — nó đọc kết quả đã
composite của mọi layer hiển thị, tức đúng thứ người xem sẽ thấy.

---

## 3. Mẫu báo cáo

| # | Hạng mục | Tool | Kết quả đo được | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Kích thước / frame / layer / tag | `get_sprite_info` | *(số liệu thật)* | PASS / WARN / FAIL |
| 2 | Kỷ luật palette | `get_color_stats` | *(số màu unique)* | |
| 3 | Layer & cel trong dải frame | `validate_scene` | *(missing gì)* | |
| 4 | Overlap & layer ngoài dải | `audit_animation` | | |
| 5 | Chênh lệch frame liền kề | `compare_frames` | *(% từng cặp)* | |
| 6 | Soi bằng mắt | `export_sprite` + đọc ảnh | *(nhận xét)* | |

Kết luận: **ĐẠT** / **ĐẠT CÓ ĐIỀU KIỆN** (kèm danh sách việc phải sửa) / **KHÔNG ĐẠT**.
Mỗi WARN/FAIL phải nêu: đo được bao nhiêu, ngưỡng là bao nhiêu, sửa bằng cách nào.

---

## 4. Kỷ luật bắt buộc

- **Số liệu thật, không mô tả chung chung.** Mỗi dòng verdict phải dẫn được con số tool trả về.
- **Tool báo lỗi thì dừng và báo nguyên văn** (`ERROR:Layer not found`, `ERROR:Frame index out of range`...).
  Cấm mô tả kết quả như thể đã kiểm xong — mục 4.3 của playbook.
- **Bỏ bước nào phải nói rõ bỏ bước nào và vì sao.** Báo cáo thiếu bước mà không ghi chú là báo cáo sai.
