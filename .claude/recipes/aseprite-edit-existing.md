# Recipe: Sửa Asset Đã Có (Recolor / Resize / Batch)

# Mục lục
1. [Khi Nào Dùng](#1-khi-nào-dùng)
2. [Rule An Toàn Dữ Liệu](#2-rule-an-toàn-dữ-liệu)
3. [Quy Trình Chung 5 Bước](#3-quy-trình-chung-5-bước)
4. [Bốn Tình Huống Cụ Thể](#4-bốn-tình-huống-cụ-thể)
5. [Checklist Nghiệm Thu](#5-checklist-nghiệm-thu)
6. [Lỗi Thường Gặp](#6-lỗi-thường-gặp)

---

# 1. Khi Nào Dùng

Thao tác trên asset đã tồn tại: đổi bảng màu, tạo biến thể màu, chuẩn hoá kích thước, xuất lại theo
format khác, xử lý hàng loạt file.

**Đây là nhóm việc AI làm tốt nhất.** Khác với vẽ từ đầu, ở đây model không phải tự nghĩ ra hình —
chỉ biến đổi thứ đã đúng sẵn. Thực nghiệm cho thấy đây mới là use-case đáng dùng MCP nhất
(mục 2, playbook). Ưu tiên đề xuất hướng này khi người dùng phân vân.

---

# 2. Rule An Toàn Dữ Liệu

**A1 — Không bao giờ sửa đè lên file gốc.**
Luôn `copy_sprite` ra bản làm việc trước:
```
copy_sprite(filename="<ABS>/orig.aseprite", output_filename="<ABS>/orig_variant.aseprite")
```
Asset gốc là công sức đã bỏ ra, thao tác của AI không có undo qua MCP.

**A2 — Chụp trạng thái trước khi sửa.**
`get_sprite_info` + `get_color_stats` trước, để sau đó đối chiếu được thứ gì đã đổi.

**A3 — Batch thì làm mẫu một file trước.**
Chạy trọn quy trình trên **một** file, người dùng duyệt kết quả, rồi mới nhân ra cả loạt. Sai
convention trên 50 file tốn hơn nhiều so với một vòng xác nhận.

**A4 — `flatten_sprite` và `merge_layer_down` là thao tác một chiều.**
Mất layer là mất vĩnh viễn. Hỏi trước khi chạy, và chỉ chạy trên bản copy.

---

# 3. Quy Trình Chung 5 Bước

1. **Đọc hiện trạng:** `get_sprite_info` — kích thước, color mode, layer, tag, số frame.
2. **Chụp màu hiện tại:** `get_palette` + `get_color_stats(top=16)`.
3. **Copy ra bản làm việc:** `copy_sprite` (A1).
4. **Biến đổi** — xem mục 4.
5. **Đối chiếu và export:** chạy lại bước 1-2 trên bản mới, so với số liệu đã chụp; rồi export.

---

# 4. Bốn Tình Huống Cụ Thể

## 4.1. Đổi bảng màu / tạo biến thể màu

Đổi sang preset retro:
```
apply_palette_preset(filename, "gameboy")   # chỉ đổi bảng màu, pixel giữ nguyên
quantize_to_palette(filename)               # snap pixel về bảng màu mới
```
Hai bước này **phải đi cùng nhau**. Chỉ chạy bước đầu thì bảng màu đổi mà hình không đổi
(`palette.py:250-251`).

Đổi đúng một màu (ví dụ giáp đỏ → giáp xanh):
```
replace_color(filename, ...)
```
Đổi cả tông màu của một layer:
```
adjust_hsl(filename, ...)          # hoặc adjust_hsl_native
```
Đổi màu theo ánh xạ cụ thể trên dải frame:
```
remap_colors_in_cel_range(filename, ...)
```

**Verify:** `get_color_stats` phải cho ra số màu unique ≤ số màu của palette mới.

## 4.2. Chuẩn hoá kích thước

| Nhu cầu | Tool | Lưu ý |
| :--- | :--- | :--- |
| Đổi khung canvas, giữ nguyên pixel | `resize_canvas(width, height)` | Nội dung không co giãn, chỉ đổi khung |
| Cắt bớt viền thừa | `crop_canvas(x, y, width, height)` | Xác định vùng bằng `get_composite_rect` trước |
| Phóng to khi xuất | `export_spritesheet(scale=N)` | **Cách đúng** để có sprite lớn |

Pixel art phóng to **chỉ được dùng bội số nguyên** (2x, 3x, 4x). Scale lẻ làm pixel méo, hỏng toàn
bộ thẩm mỹ. Không có tool scale nội dung tại chỗ — đó là chủ ý, hãy scale ở khâu export.

## 4.3. Xuất lại theo format khác

```
export_spritesheet(filename, output_filename="<ABS>/sheet.png",
                   sheet_type="packed",          # horizontal|vertical|rows|columns|packed
                   data_filename="<ABS>/sheet.json",
                   data_format="json-array",
                   padding=1, scale=2, list_tags=True)
export_tag(filename, ...)      # GIF theo từng animation
export_layers(filename, ...)   # tách từng layer ra file riêng
export_frame(filename, ...)    # một frame cụ thể
```
`padding=1` tránh lỗi chảy màu (bleeding) giữa các frame khi engine lấy mẫu texture.

## 4.4. Batch nhiều file

1. Liệt kê file cần xử lý, **đọc lại danh sách đó cho người dùng xác nhận**.
2. Chạy trọn quy trình cho file đầu tiên (A3).
3. Người dùng duyệt.
4. Lặp cho phần còn lại, mỗi file vẫn `copy_sprite` riêng.
5. Báo cáo cuối: file nào xong, file nào lỗi, lỗi gì — **liệt kê đủ, không gộp thành "tất cả OK"**.

---

# 5. Checklist Nghiệm Thu

- [ ] File gốc còn nguyên vẹn, chưa bị ghi đè.
- [ ] `get_sprite_info` bản mới: layer/frame/tag không mất mát ngoài dự kiến.
- [ ] `get_color_stats`: số màu khớp palette đích.
- [ ] Scale (nếu có) là bội số nguyên.
- [ ] Batch: đã báo cáo từng file, kể cả file lỗi.

---

# 6. Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Cách xử lý |
| :--- | :--- | :--- |
| Đổi preset mà hình không đổi màu | Thiếu `quantize_to_palette` | Chạy bước 2 của 4.1 |
| Màu ra sai lệch sau quantize | Palette đích quá ít màu so với ảnh gốc | Chọn preset nhiều màu hơn (`dawnbringer32`) |
| Sprite méo sau khi phóng to | Scale không nguyên | Dùng bội số nguyên qua `export_spritesheet(scale=N)` |
| Frame lem màu sang nhau trong engine | Sheet không có padding | Export lại với `padding=1` |
| Mất layer sau khi sửa | Đã chạy `flatten_sprite`/`merge_layer_down` | Không khôi phục được — làm lại từ file gốc (A1, A4) |
| `Invalid filename: parent directory traversal not allowed` | Đường dẫn chứa `..` | Dùng đường dẫn tuyệt đối (R1) |
