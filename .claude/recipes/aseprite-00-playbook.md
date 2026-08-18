# Aseprite Playbook — Rule Cứng Khi AI Thao Tác Pixel Art Qua MCP

# Mục lục
1. [Phạm Vi & Cách Dùng](#1-phạm-vi--cách-dùng)
2. [Giới Hạn Đã Biết Của AI Khi Vẽ Pixel Art](#2-giới-hạn-đã-biết-của-ai-khi-vẽ-pixel-art)
3. [8 Rule Cứng](#3-8-rule-cứng)
4. [Giao Thức Kiểm Chứng Bắt Buộc](#4-giao-thức-kiểm-chứng-bắt-buộc)
5. [Bảng Tra Tool Theo Nhu Cầu](#5-bảng-tra-tool-theo-nhu-cầu)
6. [Nguồn Tham Chiếu](#6-nguồn-tham-chiếu)

---

# 1. Phạm Vi & Cách Dùng

Áp dụng cho **mọi** tác vụ thao tác Aseprite qua MCP server `diivi/aseprite-mcp` (116 tools).
Đọc file này trước, rồi chọn recipe theo tình huống:

| Tình huống | Recipe |
| :--- | :--- |
| Vẽ một sprite tĩnh từ đầu | `aseprite-static-sprite.md` |
| Làm animation nhiều frame | `aseprite-animation.md` |
| Sửa/recolor/resize asset đã có | `aseprite-edit-existing.md` |

Đây là rule **thao tác**, khác với các `recipe-*.md` universal (mẫu định dạng văn bản).

---

# 2. Giới Hạn Đã Biết Của AI Khi Vẽ Pixel Art

Không phải phỏng đoán — có dữ liệu đo được. Hiểu giới hạn này để chọn đúng cách làm.

- **Vẽ pixel-by-pixel là điểm yếu cấu trúc.** Benchmark bắt LLM xuất grid 24×24: model tốt nhất
  đạt định dạng hợp lệ 100% nhưng chất lượng chỉ ~0.42/1.0. Fine-tune không cứu được. Nguyên nhân
  gốc: mismatch giữa sinh token tuần tự 1D và tác vụ 2D cần giữ nhất quán toàn cục.
  → **Hệ quả: compose từ shape primitives, không rải pixel thủ công cho hình lớn.**

- **Ba failure mode lặp lại trong thực nghiệm tool-calling trên chính Aseprite MCP:**
  1. *Character inconsistency* — nhân vật biến dạng giữa các frame dù ý đồ chuyển động đúng.
  2. *Semantic drift* — vẽ kiếm ra thành súng; nhân vật thành khối màu vô định hình.
  3. *Tool blame-shifting* — model tự khẳng định đã gọi tool thành công trong khi tool không chạy.
  → **Hệ quả: rule 5, 6 và mục 4 (kiểm chứng) sinh ra để chặn đúng ba lỗi này.**

- **Server KHÔNG trả ảnh về cho model.** Đã kiểm chứng trên source: mọi tool đều có signature
  `-> str`, không tool nào trả `ImageContent`/base64. Model **không tự nhìn thấy** thứ nó vừa vẽ.
  → **Hệ quả: phải chủ động verify, xem mục 4. Đây là khác biệt lớn nhất so với người dùng Aseprite.**

- **Use-case mạnh nhất không phải "sáng tác từ con số 0".** Thực nghiệm cho thấy AI làm tốt nhất ở
  khâu *augment*: recolor palette, chuẩn hoá kích thước, batch export, sửa asset có sẵn.
  Sáng tác nhân vật phức tạp từ đầu vẫn là khâu yếu nhất.

---

# 3. 8 Rule Cứng

**R1 — Luôn dùng đường dẫn tuyệt đối.**
Server kiểm tra file bằng `os.path.exists(filename)` (`core/commands.py:77`), giải theo thư mục làm
việc của tiến trình server — không phải thư mục dự án. Đường dẫn tương đối sẽ gãy không báo trước.
Đúng: `D:/Project/AsepriteMCP/Output/knight/knight.aseprite`

**R2 — Chốt palette TRƯỚC khi vẽ pixel đầu tiên.**
Thứ tự: `apply_palette_preset` hoặc `set_palette` → vẽ → (nếu lỡ lệch màu) `quantize_to_palette`.
Preset có sẵn: `gameboy, monochrome, grayscale_4, cga, pico8, c64, dawnbringer16, dawnbringer32`
(`tools/palette.py:255-256`). Lưu ý `apply_palette_preset` **chỉ đổi bảng màu, không đổi pixel đã
vẽ** (`palette.py:250-251`).

**R3 — Shading lấy màu từ `generate_color_ramp`, không tự bịa màu sáng/tối.**
Tool này áp kỹ thuật hue-shifting chuẩn của pixel art: bóng lệch lạnh, sáng lệch ấm, độ bão hoà
điều chỉnh theo (`palette.py:274-289`). Tự lấy màu gốc rồi nhân/chia độ sáng sẽ ra kết quả "nhựa",
đây là lỗi nghiệp dư dễ nhận ra nhất.

**R4 — Bắt buộc dùng biến thể `*_at`, không dùng bản không hậu tố.**
`draw_pixels_at`, `draw_line_at`, `draw_rectangle_at`, `draw_circle_at`, `draw_ellipse_at`,
`fill_area_at` — nhóm này nhận `layer_name` + `frame_index` tường minh.
Bản không hậu tố (`draw_pixels`, `draw_line`...) vẽ lên *active cel*, mà active cel trôi theo thao
tác trước đó → vẽ nhầm layer/frame là lỗi phổ biến nhất và khó phát hiện nhất.

**R5 — Compose bằng hình khối, không rải pixel.**
`draw_rectangle_at` / `draw_ellipse_at` / `draw_polygon` / `draw_path` dựng khối lớn trước.
`draw_pixels_at` chỉ dùng cho **chi tiết ≤ ~30 pixel** (mắt, highlight, đầu mũi kiếm).
Cần vẽ mảng pixel lớn hơn thế = dấu hiệu chọn sai tool.

**R6 — Lập layer plan trước, đặt tên layer bằng tiếng Anh không dấu.**
Ví dụ chuẩn: `outline`, `body`, `armor`, `weapon`, `fx`. Tên layer là khoá tra cứu của mọi tool
`*_at`; sai tên → `ERROR:Layer not found`. Layer riêng cho phụ kiện chuyển động giúp animate mà
không phải vẽ lại.

**R7 — Canvas nhỏ. Mặc định 32×32.**
16/32/64 là vùng an toàn. Canvas càng lớn, số pixel model phải giữ nhất quán càng vượt khả năng.
Cần sprite to hơn thì vẽ ở 32×32 rồi `scale` khi export (`export_spritesheet(scale=N)`), **không**
vẽ trực tiếp ở 128×128.

**R8 — `run_lua_script` là phương án cuối.**
116 tool chuyên dụng đã bao phủ gần hết nhu cầu. Chỉ dùng Lua thô khi đã xác định không có tool nào
làm được, và phải nói rõ lý do cho người dùng trước khi chạy.

---

# 4. Giao Thức Kiểm Chứng Bắt Buộc

**Nguyên tắc gốc: không được báo "đã xong" khi chưa đọc lại kết quả bằng tool.**
Thông báo thành công của tool chỉ chứng minh lệnh chạy, **không** chứng minh hình vẽ đúng.

## 4.1. Tầng 1 — Verify bằng text (mọi MCP client đều chạy được)

| Kiểm cái gì | Tool | Ngưỡng cảnh báo |
| :--- | :--- | :--- |
| Kích thước, số frame, layer, tag | `get_sprite_info` | lệch so với kế hoạch |
| Vùng vừa vẽ có pixel thật không | `get_composite_rect(x,y,w,h,frame_index)` | toàn `a:0` = vẽ hụt |
| Kỷ luật palette | `get_color_stats(top=16)` | >16 màu unique trên sprite 32×32 |
| Frame có thực sự đổi không | `compare_frames(frame_a, frame_b)` | 0% = quên vẽ; >40% = mất nhất quán |
| Layer/cel thiếu trong dải frame | `validate_scene(required_layers=[...])` | có missing |
| Overlap & layer ngoài dải | `audit_animation` | có overlap bất thường |

`get_composite_rect` đọc **kết quả đã composite của mọi layer hiển thị**, còn `get_pixels_rect` chỉ
đọc một cel (`tools/pixel_read.py:236-239`). Muốn biết "người xem sẽ thấy gì" → dùng
`get_composite_rect`.

## 4.2. Tầng 2 — Verify bằng mắt (chỉ client đọc được ảnh, ví dụ Claude Code)

1. `export_sprite(filename, output_filename, format="png")`
2. Đọc file PNG đó bằng khả năng đọc ảnh của client.
3. Tự chấm: silhouette có nhận ra vật thể không? tỉ lệ có đúng không? có pixel rác lạc lõng không?

Client không đọc được ảnh thì **dừng ở tầng 1 và nói rõ với người dùng rằng chưa verify bằng mắt** —
không được im lặng bỏ qua rồi báo hoàn thành.

## 4.3. Chống blame-shifting

Nếu tool trả lỗi (`ERROR:Layer not found`, `ERROR:Frame index out of range`...): **báo nguyên văn
lỗi cho người dùng và dừng**. Cấm tuyệt đối việc mô tả kết quả như thể đã vẽ xong. Đây là failure
mode đã ghi nhận ở model yếu và là kiểu sai gây mất niềm tin nhanh nhất.

---

# 5. Bảng Tra Tool Theo Nhu Cầu

| Nhu cầu | Tool nên dùng |
| :--- | :--- |
| Tạo file mới | `create_canvas(width, height, filename)` |
| Thêm layer / nhóm | `add_layer(filename, layer_name, group)`, `add_group` |
| Vẽ khối | `draw_rectangle_at`, `draw_ellipse_at`, `draw_polygon`, `draw_path` |
| Vẽ chi tiết nhỏ | `draw_pixels_at(pixels=[{x,y,color}])` |
| Tô vùng kín | `fill_area_at` |
| Bảng màu | `list_palette_presets`, `apply_palette_preset`, `set_palette`, `quantize_to_palette` |
| Màu shading | `generate_color_ramp(base_color, steps, hue_shift_degrees, lightness_range)` |
| Viền nhân vật | `outline_cel(layer_name, frame_index, color, include_diagonals)` |
| Chuyển sắc / vân | `apply_dither_gradient`, `apply_dither_pattern` |
| Nhân frame | `add_frames`, `copy_frame`, `duplicate_frame_range` |
| Giữ layer tĩnh xuyên frame | `propagate_cels(layer_names, source_frame, start_frame, end_frame)` |
| Chuyển động | `tween_cel_positions`, `tween_cel_positions_eased`, `offset_cel_positions`, `oscillate_cel_positions` |
| Đặt tag animation | `set_tag(name, from_frame, to_frame, direction)` — `forward\|reverse\|pingpong\|pingpong_reverse` |
| Export sheet + JSON | `export_spritesheet(output_filename, sheet_type, data_filename, list_tags=True)` |
| Hướng dẫn animation của upstream | `animation_workflow_guide(use_case)` — `character\|environment` |

---

# 6. Nguồn Tham Chiếu

- Thực nghiệm tool-calling LLM trên Aseprite MCP, thang điểm SwordsBench:
  https://ljvmiranda921.github.io/notebook/2025/07/20/draw-me-a-swordsman/
- Pixel Art Bench — đo khả năng sinh grid pixel có cấu trúc:
  https://huggingface.co/blog/AINovice2005/pixel-art-bench
- Nguyên tắc thiết kế tool cho agent (Anthropic):
  https://www.anthropic.com/engineering/writing-tools-for-agents
- Source server đang dùng: `vendor/aseprite-mcp/aseprite_mcp/`
- Bối cảnh dự án: `Docs/SourceOfTruth/overview.txt`
