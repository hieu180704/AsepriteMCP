# AsepriteMCP — Gemini CLI

> 💡 Gõ `/init` để AI phỏng vấn bối cảnh và hoàn tất thiết lập tài liệu dự án.

**Cách nạp ngữ cảnh trên Gemini CLI**

- File này được Gemini CLI đọc tự động ở gốc dự án.
- Rules đầy đủ nằm ở `.agents/rules/` (5 file) — đọc khi cần chi tiết ngoài phần ràng buộc cứng bên dưới.
- Recipes thao tác Aseprite ở `.agents/recipes/`, bắt đầu từ `aseprite-00-playbook.md`.
- Skills (`/asset-qc`, `/verify`, `/doc`, `/plan`...) ở `.agents/skills/<tên>/SKILL.md` — Gemini CLI
  không tự đăng ký slash command, nên khi người dùng gõ `/asset-qc` thì đọc file SKILL.md tương ứng
  rồi thực hiện đúng quy trình trong đó.
- MCP server Aseprite khai báo tại `.gemini/settings.json`, sinh bằng `node scripts/setup-mcp.js`.

---

<!-- BEGIN synced-hard-constraints -->
<!-- Sinh tự động từ .agents/shared/hard-constraints.md — sửa nguồn rồi chạy `node scripts/sync-agents.js`. Sửa trực tiếp ở đây sẽ bị ghi đè. -->

# Ràng Buộc Cứng — áp dụng như nhau cho mọi AI client

## 1. Định nghĩa dự án

- **AsepriteMCP dùng MCP để AI làm việc qua Aseprite:** vẽ/sửa pixel art, tự động hoá export
  sprite sheet & atlas, phục vụ pipeline game Unity.
- **KHÔNG tự xây MCP server.** Ràng buộc cứng, người dùng chốt 2026-08-18. Dự án **sử dụng**
  server có sẵn `diivi/aseprite-mcp` (`vendor/aseprite-mcp`, 116 tools, git submodule).
  Mọi đề xuất kiểu "nên tự viết server bằng ngôn ngữ X" đều đi ngược định nghĩa dự án — từ chối.
- **Đầu ra hướng Unity:** ưu tiên thứ Unity đọc được ngay (sprite sheet + JSON metadata), không
  đẻ format trung gian phải convert thêm.

## 2. Quy trình 4 pha — bắt buộc

`explore -> propose -> confirm -> execute`

- **Explore:** đọc tài liệu/dữ liệu thật, trích dẫn đường dẫn + số dòng. Không đoán.
- **Propose:** nêu hiện trạng, nguyên nhân gốc, phương án và trade-off, phạm vi file sẽ đụng.
- **Confirm:** **dừng ở cuối pha Propose để chờ người dùng duyệt.** Cấm tự nhảy sang Execute.
- **Execute:** làm đúng phạm vi đã duyệt, không over-scope, kiểm chứng lại, ghi worklog.

## 3. Giao thức Aseprite — đọc playbook trước khi gọi tool MCP

Bản đầy đủ: `.agents/recipes/aseprite-00-playbook.md`. Recipe theo việc:
`aseprite-static-sprite.md` (vẽ mới) · `aseprite-animation.md` (animation) ·
`aseprite-edit-existing.md` (sửa asset có sẵn).

- **R1 — Đường dẫn tuyệt đối.** Đường dẫn tương đối giải theo cwd của tiến trình server, gãy im lặng.
- **R2 — Chốt palette trước khi vẽ pixel đầu tiên.** `apply_palette_preset` chỉ đổi bảng màu,
  không đổi pixel đã vẽ.
- **R3 — Màu shading lấy từ `generate_color_ramp`.** Tự nhân/chia độ sáng ra màu "nhựa".
- **R4 — Luôn dùng biến thể `*_at`.** Bản không hậu tố vẽ lên active cel, mà active cel trôi
  theo thao tác trước.
- **R5 — Compose bằng shape primitives.** `draw_pixels_at` chỉ cho chi tiết ≤ ~30 pixel.
- **R6 — Lập layer plan trước, tên layer tiếng Anh không dấu.** Tên layer là khoá tra cứu của
  mọi tool `*_at`.
- **R7 — Canvas nhỏ, mặc định 32×32.** Cần to hơn thì `scale` lúc export.
- **R8 — `run_lua_script` là phương án cuối.** Phải nêu lý do cho người dùng trước khi chạy.

**Kiểm chứng — cấm báo "đã xong" khi chưa đọc lại kết quả bằng tool.** Server không trả ảnh về
cho model (mọi tool `-> str`), nên thông báo thành công của tool chỉ chứng minh lệnh chạy, không
chứng minh hình vẽ đúng. Chạy `/asset-qc`, hoặc tối thiểu `get_sprite_info` +
`get_composite_rect` + `compare_frames`. Client không đọc được ảnh thì nói thẳng là chưa verify
bằng mắt. **Tool báo lỗi thì dừng và báo nguyên văn.**

## 4. Model-agnostic — ràng buộc cứng

Dự án phải chạy y hệt nhau trên **mọi AI client**: Claude Code, Antigravity, Gemini CLI,
ChatGPT/Codex, Cursor, Cline, Continue và client MCP tương lai. Hệ quả bắt buộc:

- **Nguồn duy nhất của rules/recipes/hooks/skills là `.agents/`.** Sửa ở `.agents/` rồi chạy
  `node scripts/sync-agents.js`. Sửa thẳng trong `.claude/`, `.cursor/` hay bản nhúng của entry
  point sẽ tạo file mồ côi — không bao giờ đến được các model khác, và bị ghi đè ở lần sync sau.
- **Không dùng tính năng riêng của một client** cho thứ nằm trên đường đi chính của công việc.
- **Cấu hình MCP không commit đường dẫn máy cá nhân.** Nguồn là `mcp-servers.template.json`;
  `node scripts/setup-mcp.js` sinh config thật cho từng client trên từng máy.
- **Nền tảng phát triển là Windows 11.** Đường dẫn, script và cách gọi tiến trình phải chạy đúng
  trên Windows.

## 5. Chuẩn output

- **Correct, Minimal, Verifiable.** Root cause, không vá triệu chứng.
- **Ngôn ngữ:** Tiếng Việt ~90%, giữ nguyên thuật ngữ kỹ thuật tiếng Anh.
- **Hoàn chỉnh 100%:** không `// ... phần còn lại giữ nguyên`, không placeholder dở dang.
- **Phản biện thẳng thắn:** thấy rủi ro logic/hiệu năng/mất dữ liệu thì nói ngay, đề xuất phương
  án an toàn hơn. Phát hiện mình sai giữa chừng thì nói thẳng, không âm thầm vá.
- **Phát hiện lỗi trong tài liệu gốc → đề xuất cách sửa, KHÔNG tự ghi đè.**
- **Living Docs:** tài liệu cập nhật song song với thực thi. Xong một đầu việc thì ghi worklog
  `Docs/Done/YYYY-MM-DD-task-name.txt`. Ưu tiên `.txt`, mọi file có mục lục ở đầu.
- **Luôn hiển thị Status Line ở cuối phản hồi.**

## 6. Bản đồ ngữ cảnh

| Cần gì | Ở đâu |
| :--- | :--- |
| Tổng quan dự án (đọc trước tiên) | `Docs/SourceOfTruth/overview.txt` |
| Tài liệu gốc | `Docs/SourceOfTruth/` |
| Nhật ký quyết định | `Docs/Decisions/` |
| Tiêu chí nghiệm thu | `Docs/QC/` |
| Việc đã xong | `Docs/Done/` |
| Rules đầy đủ | `.agents/rules/` |
| Recipes thao tác Aseprite | `.agents/recipes/` |
| Skills (`/asset-qc`, `/doc`, `/verify`...) | `.agents/skills/` |
| Server MCP bên thứ ba | `vendor/aseprite-mcp/` (upstream, không sửa) |
| Setup máy mới | `README.md` |

<!-- END synced-hard-constraints -->
