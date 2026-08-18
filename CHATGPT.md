# AsepriteMCP — ChatGPT Guide

> 💡 Gõ `/init` để AI tự động phỏng vấn và hoàn tất thiết lập tài liệu dự án.

**Dự án:** Dùng MCP để AI làm việc qua Aseprite — vẽ/sửa pixel art, tự động hoá export sprite sheet & atlas, phục vụ pipeline game Unity.

**KHÔNG tự xây MCP server.** Dự án dùng server có sẵn `diivi/aseprite-mcp` (tại `vendor/aseprite-mcp`, 116 tools). Đừng đề xuất viết server mới.

Áp dụng quy trình 4 pha: `explore -> propose -> confirm -> execute`.
Đọc thông tin tại `Docs/SourceOfTruth/` — bắt đầu từ `overview.txt`.

**Trước khi thao tác Aseprite qua MCP, đọc `.agents/recipes/aseprite-00-playbook.md`** — 8 rule cứng và giao thức kiểm chứng bắt buộc. Chọn recipe theo việc: `aseprite-static-sprite.md` (vẽ mới), `aseprite-animation.md` (animation), `aseprite-edit-existing.md` (sửa asset có sẵn).
