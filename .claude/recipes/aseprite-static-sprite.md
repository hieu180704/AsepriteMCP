# Recipe: Vẽ Sprite Tĩnh Từ Đầu

# Mục lục
1. [Khi Nào Dùng](#1-khi-nào-dùng)
2. [Quy Trình 7 Bước](#2-quy-trình-7-bước)
3. [Checklist Nghiệm Thu](#3-checklist-nghiệm-thu)
4. [Lỗi Thường Gặp](#4-lỗi-thường-gặp)

---

# 1. Khi Nào Dùng

Tạo một sprite tĩnh (nhân vật, item, tile, icon) từ con số 0.
Đọc `aseprite-00-playbook.md` trước — recipe này giả định đã nắm 8 rule cứng ở đó.

**Cảnh báo phạm vi:** đây là tác vụ AI làm yếu nhất (xem mục 2 của playbook). Với nhân vật phức tạp,
hãy nói trước với người dùng rằng kết quả vòng đầu thường cần vài vòng sửa, đừng hứa quá tay.

---

# 2. Quy Trình 7 Bước

## Bước 1 — Chốt thông số trước khi gọi tool
Nói rõ với người dùng và tự ghi lại:
- Kích thước canvas: mặc định **32×32** (R7).
- Đường dẫn tuyệt đối file đích (R1).
- Palette dự kiến: preset có sẵn hay bảng màu tự đặt.
- Danh sách layer dự kiến (R6).

Đây là bước rẻ nhất để phát hiện hiểu sai yêu cầu. Đừng bỏ.

## Bước 2 — Tạo canvas và layer
```
create_canvas(width=32, height=32, filename="<ABS_PATH>/hero.aseprite")
add_layer(filename, layer_name="body")
add_layer(filename, layer_name="armor")
add_layer(filename, layer_name="detail")
```
Vẽ từ layer dưới lên trên. Layer `outline` (nếu có) nằm dưới cùng hoặc trên cùng tuỳ phong cách —
chốt ở bước 1, đừng đổi giữa chừng.

## Bước 3 — Chốt palette
```
list_palette_presets()                    # xem có gì trước khi quyết
apply_palette_preset(filename, "pico8")   # hoặc set_palette(filename, ["#1D2B53", ...])
```
Rồi sinh ramp cho từng màu chủ đạo:
```
generate_color_ramp(base_color="#D04648", steps=4)
```
Trả về mảng hex **từ tối nhất đến sáng nhất**. Giữ nguyên mảng này để dùng suốt bước 4-5 — không tự
chế thêm màu ngoài ramp.

## Bước 4 — Dựng khối lớn (silhouette)
Vẽ hình bóng tổng thể trước, chưa cần chi tiết. Silhouette đọc được là tiêu chí sống còn của pixel
art — nhìn bóng đen phải đoán ra vật thể.
```
draw_rectangle_at(filename, layer_name="body", frame_index=1, x, y, width, height, color, fill=True)
draw_ellipse_at(filename, layer_name="body", frame_index=1, ...)
```
**Verify ngay:**
```
get_composite_rect(filename, x=0, y=0, width=32, height=32, frame_index=1)
```
Nếu vùng thân toàn `a:0` → chưa vẽ được gì, dừng sửa ngay chứ đừng vẽ tiếp lên trên.

## Bước 5 — Shading
Tô mảng tối/sáng bằng đúng các màu từ ramp ở bước 3.
```
fill_area_at(filename, layer_name, frame_index, x, y, color)        # vùng kín
apply_dither_gradient(...)                                          # chuyển sắc mượt
```
Quy ước ánh sáng: chọn **một** hướng sáng và giữ nhất quán toàn sprite. Nói rõ hướng đó cho người
dùng biết (ví dụ "sáng từ trên-trái").

## Bước 6 — Chi tiết và viền
Chi tiết nhỏ mới dùng `draw_pixels_at` (R5):
```
draw_pixels_at(filename, layer_name="detail", frame_index=1,
               pixels=[{"x":12,"y":10,"color":"#FFFFFF"}, ...])
```
Viền:
```
outline_cel(filename, layer_name="body", frame_index=1, color="#000000")
```
`include_diagonals=True` cho viền dày/bo tròn hơn.

## Bước 7 — Kiểm chứng và export
```
get_color_stats(filename, frame_index=1, top=16)
export_sprite(filename, output_filename="<ABS_PATH>/hero.png", format="png")
```
Nếu client đọc được ảnh → mở PNG ra nhìn (tầng 2, mục 4.2 playbook).
Nếu số màu unique vượt xa palette đã chốt → `quantize_to_palette(filename)`.

---

# 3. Checklist Nghiệm Thu

- [ ] `get_sprite_info` trả đúng kích thước và đúng danh sách layer đã plan.
- [ ] `get_composite_rect` xác nhận có pixel ở vùng chủ thể, nền vẫn trong suốt (`a:0`).
- [ ] `get_color_stats`: số màu unique ≤ số màu trong palette đã chốt.
- [ ] Một hướng sáng duy nhất, nhất quán.
- [ ] Silhouette đọc được — nhận ra vật thể khi chỉ nhìn hình bóng.
- [ ] Đã export PNG và **đã thực sự nhìn** (hoặc đã báo rõ là không nhìn được).

---

# 4. Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Cách xử lý |
| :--- | :--- | :--- |
| `ERROR:Layer not found` | Sai tên layer, hoặc layer nằm trong group | Gọi `get_sprite_info` lấy tên chính xác |
| Vẽ xong không thấy gì | Vẽ nhầm layer/frame do dùng bản không `*_at` | Chuyển sang biến thể `*_at` (R4) |
| Màu ra khác màu đã chỉ định | Sprite ở chế độ indexed, màu bị snap về palette | `get_sprite_info` xem `color_mode`; dùng `set_color_mode` hoặc chọn màu trong palette |
| Sprite trông "nhựa", thiếu chiều sâu | Tự chế màu sáng/tối thay vì dùng ramp | Làm lại bước 3, dùng `generate_color_ramp` (R3) |
| Quá nhiều màu gần giống nhau | Vẽ tự do không bám palette | `quantize_to_palette` rồi kiểm lại `get_color_stats` |
| Hình bị nhiễu pixel lạc | Rải `draw_pixels_at` cho mảng lớn | Dựng lại bằng shape primitives (R5) |
