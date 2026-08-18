# Recipe: Animation Nhiều Frame

# Mục lục
1. [Khi Nào Dùng](#1-khi-nào-dùng)
2. [Nguyên Tắc Sống Còn: Không Vẽ Lại Từng Frame](#2-nguyên-tắc-sống-còn-không-vẽ-lại-từng-frame)
3. [Quy Trình 8 Bước](#3-quy-trình-8-bước)
4. [Tham Chiếu Thực Tế: knight.aseprite](#4-tham-chiếu-thực-tế-knightaseprite)
5. [Checklist Nghiệm Thu](#5-checklist-nghiệm-thu)
6. [Lỗi Thường Gặp](#6-lỗi-thường-gặp)

---

# 1. Khi Nào Dùng

Làm animation: idle, walk, attack, hurt, death, hiệu ứng môi trường.
Đọc `aseprite-00-playbook.md` trước.

Trước khi bắt đầu, gọi `animation_workflow_guide(use_case="character")` hoặc `"environment"` —
đây là hướng dẫn do chính server upstream cung cấp, ngắn và luôn khớp phiên bản server đang chạy.

---

# 2. Nguyên Tắc Sống Còn: Không Vẽ Lại Từng Frame

**Failure mode số 1 của AI khi làm animation là nhân vật biến dạng giữa các frame** (đã ghi nhận
trong thực nghiệm, xem mục 2 playbook). Nguyên nhân luôn giống nhau: model vẽ lại nhân vật ở mỗi
frame, và mỗi lần vẽ lại là một lần lệch.

Cách chặn triệt để — **vẽ một lần, rồi nhân bản và dịch chuyển:**

| Cần gì | Làm thế nào | Cấm làm |
| :--- | :--- | :--- |
| Layer tĩnh xuyên frame (thân, giáp) | `propagate_cels` | Vẽ lại mỗi frame |
| Bộ phận di chuyển | `tween_cel_positions`, `offset_cel_positions` | Vẽ lại vị trí mới |
| Chuyển động dao động (thở, bập bênh) | `oscillate_cel_positions` | Vẽ tay từng frame |
| Fade in/out | `tween_cel_opacity_eased` | Vẽ lại với màu nhạt dần |
| Phóng to/thu nhỏ | `tween_cel_scale_eased` | Vẽ lại kích thước khác |

Chỉ vẽ tay ở frame **key pose** — thường 2-4 frame cho một chu kỳ. Phần còn lại là nhân bản + biến đổi.

---

# 3. Quy Trình 8 Bước

## Bước 1 — Plan trước khi gọi tool
Chốt và nói rõ với người dùng:
- Danh sách animation và số frame mỗi loại (ví dụ: idle 4, walk 6, attack 4).
- Tổng số frame và **dải frame của từng tag** (1-based khi gọi tool).
- Frame duration (mặc định 150ms là điểm khởi đầu hợp lý).
- Layer plan — tách riêng bộ phận sẽ chuyển động.

## Bước 2 — Dựng nhân vật ở frame 1
Theo toàn bộ `aseprite-static-sprite.md`. **Frame 1 phải đạt chất lượng cuối cùng trước khi sang
bước 3** — mọi frame sau đều kế thừa từ nó, sai ở đây thì sai toàn bộ.

## Bước 3 — Tạo đủ frame
```
add_frames(filename, count=18, duration_ms=150)
```
Kiểm ngay: `get_sprite_info` phải trả đúng tổng số frame.

## Bước 4 — Propagate layer tĩnh
```
propagate_cels(filename, layer_names=["body","armor"],
               source_frame=1, start_frame=2, end_frame=19, replace=True)
```
Đây là bước giữ nhân vật không biến dạng. Bỏ bước này = chấp nhận failure mode số 1.

## Bước 5 — Animate bằng biến đổi
```
tween_cel_positions(filename, layer_name="weapon",
                    start_frame=10, end_frame=13,
                    start_x=0, start_y=0, end_x=6, end_y=-4,
                    create_missing_cels=True, source_frame_index=1)
```
`source_frame_index=1` nghĩa là lấy hình từ frame 1 làm gốc — giữ nhất quán.
Chuyển động có gia tốc thì dùng `tween_cel_positions_eased`.

## Bước 6 — Key pose vẽ tay (chỉ khi thật cần)
Một số pose không thể tạo bằng dịch chuyển (ví dụ chân đổi bước). Vẽ tay các frame đó, nhưng:
- Vẽ trên **layer riêng** của bộ phận đó, không đụng layer thân.
- Vẽ xong verify ngay bằng `compare_frames` với frame 1.

## Bước 7 — Đặt tag
```
set_tag(filename, name="idle",   from_frame=1,  to_frame=4,  direction="pingpong")
set_tag(filename, name="walk",   from_frame=5,  to_frame=10, direction="forward")
set_tag(filename, name="attack", from_frame=11, to_frame=14, direction="forward")
```
Hướng hợp lệ: `forward | reverse | pingpong | pingpong_reverse`.
`pingpong` rất hợp cho idle — 4 frame cho ra chu kỳ 6 frame mượt mà không tốn thêm frame.

**Lưu ý index:** tool nhận frame **1-based**, còn JSON export ra ghi tag theo **0-based**. Đừng
nhầm khi đối chiếu.

## Bước 8 — Kiểm chứng và export
```
validate_scene(filename, required_layers=["body","armor","weapon"], start_frame=1, end_frame=19)
audit_animation(filename, start_frame=1, end_frame=19)
compare_frames(filename, frame_a=1, frame_b=2)
export_spritesheet(filename,
                   output_filename="<ABS_PATH>/knight_sheet.png",
                   sheet_type="horizontal",
                   data_filename="<ABS_PATH>/knight.json",
                   data_format="json-array",
                   list_tags=True)
export_tag(filename, ...)   # xuất GIF từng animation để xem nhịp
```

---

# 4. Tham Chiếu Thực Tế: knight.aseprite

Sản phẩm đã chạy thật trong dự án — dùng làm mốc so sánh:
`Output/knight/`

| Thông số | Giá trị |
| :--- | :--- |
| Canvas | 32×32 |
| Tổng frame | 19 |
| Duration | 150ms |
| Sheet | horizontal, 608×32 |
| Data | `json-array`, có `frameTags` |
| Tags | idle 0-3 (pingpong), walk 4-9, attack 10-13, hurt 14-15, death 16-18 *(0-based trong JSON)* |

Quy mô này — 5 animation, 19 frame, canvas 32×32 — là mức AI xử lý được ổn định. Vượt xa hơn thì
chia nhỏ thành nhiều file thay vì dồn vào một sprite.

---

# 5. Checklist Nghiệm Thu

- [ ] `get_sprite_info`: đúng tổng frame, đúng tag, đúng dải frame mỗi tag.
- [ ] `validate_scene`: không layer/cel nào thiếu trong dải frame.
- [ ] `audit_animation`: không overlap bất thường.
- [ ] `compare_frames` giữa các frame liền kề: **khác 0%** (frame có đổi) và **không quá ~40%**
      (nhân vật không biến dạng).
- [ ] Đã export GIF từng tag và xem lại nhịp chuyển động.
- [ ] Sheet + JSON export ra đúng đường dẫn tuyệt đối đã chốt.

---

# 6. Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Cách xử lý |
| :--- | :--- | :--- |
| Nhân vật biến dạng giữa frame | Vẽ lại từng frame | Làm lại theo mục 2 — propagate + tween |
| `compare_frames` trả 0% | Quên vẽ / tween không có tác dụng | Kiểm `create_missing_cels`, kiểm đúng `layer_name` |
| `compare_frames` > 40% | Frame vẽ tay lệch quá nhiều | Vẽ lại từ cel gốc frame 1 |
| Tag lệch một frame | Nhầm 0-based (JSON) với 1-based (tool) | Đối chiếu lại bằng `get_sprite_info` |
| `ERROR:Frame range out of bounds` | Tạo thiếu frame trước khi propagate | `add_frames` cho đủ rồi chạy lại |
| Animation giật | Duration đồng loạt, thiếu nhấn | `set_frame_duration` riêng cho frame key |
| Cel trôi sang layer khác | Dùng tool không có hậu tố `_at` | Chuyển sang biến thể `*_at` (R4) |
