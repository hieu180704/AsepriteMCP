# AsepriteMCP

Dùng MCP để AI làm việc qua Aseprite — vẽ/sửa pixel art, tự động hoá export sprite sheet & atlas,
phục vụ pipeline game Unity. Dự án **sử dụng** server có sẵn `diivi/aseprite-mcp`, không tự xây server.

Thiết kế để chạy **giống hệt nhau trên mọi AI client**: Claude Code, Antigravity, Gemini CLI,
ChatGPT/Codex, Cursor. Cùng một prompt phải cho cùng một hành vi, bất kể model nào đang chạy.

# Mục lục
1. [Setup máy mới](#1-setup-máy-mới)
2. [Client nào đọc file nào](#2-client-nào-đọc-file-nào)
3. [Sửa rule / recipe / skill](#3-sửa-rule--recipe--skill)
4. [Đổi đường dẫn Aseprite hoặc uv](#4-đổi-đường-dẫn-aseprite-hoặc-uv)
5. [Giới hạn đã biết](#5-giới-hạn-đã-biết)
6. [Xử lý sự cố](#6-xử-lý-sự-cố)

---

# 1. Setup máy mới

Cần sẵn: **Git**, **Node.js** (chạy script sync/setup), **uv** (chạy server Python),
**Aseprite** (bản cài ở đường dẫn ổn định).

```bash
# 1. Clone kèm submodule — vendor/aseprite-mcp là submodule, thiếu bước này server sẽ rỗng
git clone --recurse-submodules <repo-url> AsepriteMCP
cd AsepriteMCP
# Nếu đã lỡ clone thiếu:  git submodule update --init --recursive

# 2. Cài dependency của server
uv --directory vendor/aseprite-mcp sync

# 3. Sinh cấu hình MCP cho mọi client trên máy này
node scripts/setup-mcp.js

# 4. Đồng bộ rules/recipes/skills ra các client
node scripts/sync-agents.js

# 5. Bật hook chống drift
git config core.hooksPath .githooks

# 6. Kiểm tra
node scripts/setup-mcp.js --check
node scripts/sync-agents.js --check
```

Bước 3 tự dò `uv` và `Aseprite`. Dò không ra thì script nói rõ thiếu gì — copy
`mcp.local.example.json` thành `mcp.local.json` rồi điền đường dẫn tay:

```json
{
  "UV_BIN": "C:\\Users\\<user>\\.local\\bin\\uv.exe",
  "ASEPRITE_PATH": "C:\\Program Files\\Aseprite\\Aseprite.exe"
}
```

`mcp.local.json` bị gitignore — đường dẫn máy cá nhân không lọt vào repo.

Sau bước 3, hai client sau cần một thao tác tay (config của chúng nằm ngoài repo):

| Client | Việc phải làm |
| :--- | :--- |
| Codex CLI | Copy `.codex/config.snippet.toml` vào `~/.codex/config.toml` |
| Antigravity | Import khối `mcpServers` trong `mcp-config.generated.json` vào phần cấu hình MCP của IDE |

---

# 2. Client nào đọc file nào

| Client | Ngữ cảnh & rules | Cấu hình MCP | Hooks |
| :--- | :--- | :--- | :--- |
| Claude Code / Desktop | `CLAUDE.md` + `.claude/rules/` + `.claude/commands/` | `.mcp.json` | ✅ `.claude/settings.json` |
| Antigravity | `AGENTS.md` + `.agents/rules/` | `mcp-config.generated.json` (import tay) | ✅ `.agents/hooks.json` |
| Gemini CLI | `GEMINI.md` + `.agents/rules/` | `.gemini/settings.json` | ❌ |
| Codex CLI | `AGENTS.md` + `.agents/rules/` | `~/.codex/config.toml` (copy tay) | ❌ |
| Cursor | `.cursor/rules/*.mdc` (và `.cursorrules` cho bản cũ) | `.cursor/mcp.json` | ❌ |
| VS Code / Copilot | `AGENTS.md` | `.vscode/mcp.json` | ❌ |
| ChatGPT web | Dán `.openai/system-prompt.txt` vào Instructions | Không chạy MCP được | ❌ |

Mọi entry point ở cột giữa đều chứa **cùng một** block ràng buộc cứng, nằm giữa marker
`<!-- BEGIN synced-hard-constraints -->`, sinh từ `.agents/shared/hard-constraints.md`.

---

# 3. Sửa rule / recipe / skill

**Nguồn duy nhất là `.agents/`.** Sơ đồ sinh:

```text
.agents/shared/hard-constraints.md ─┬─► AGENTS.md      (Antigravity, Codex, Copilot)
                                    ├─► CLAUDE.md      (Claude Code)
                                    ├─► GEMINI.md      (Gemini CLI)
                                    ├─► CHATGPT.md     (ChatGPT/Codex)
                                    ├─► .cursorrules   (Cursor cũ)
                                    └─► .openai/system-prompt.txt (ChatGPT web)

.agents/rules/*.md   ──► .claude/rules/*.md  +  .cursor/rules/*.mdc
.agents/recipes/*.md ──► .claude/recipes/*.md
.agents/hooks/*.js   ──► .claude/hooks/*.js
.agents/skills/<tên>/SKILL.md ──► .claude/commands/<tên>.md
```

Quy trình: sửa trong `.agents/` → `node scripts/sync-agents.js` → commit cả nguồn lẫn bản sinh.

Sửa thẳng vào bản sinh sẽ bị ghi đè ở lần sync sau, và **không đến được các model khác**.
Script xoá file mồ côi trong `.claude/rules`, `.claude/recipes`, `.claude/hooks`,
`.claude/commands`, `.cursor/rules` — muốn thêm command riêng cho Claude thì tạo skill trong
`.agents/skills/`, đừng bỏ file trực tiếp vào `.claude/commands/`.

Hook `pre-commit` (bước 5 mục 1) chạy `sync-agents.js --check` và chặn commit nếu lệch.

---

# 4. Đổi đường dẫn Aseprite hoặc uv

Chạy lại `node scripts/setup-mcp.js`, rồi mở lại AI client. Không sửa tay `.mcp.json` hay
`.cursor/mcp.json` — chúng là bản sinh và sẽ bị ghi đè.

Nguồn khai báo server là `mcp-servers.template.json`. Thêm MCP server khác thì thêm vào file đó,
mọi client sẽ nhận cùng lúc ở lần chạy `setup-mcp.js` kế tiếp.

---

# 5. Giới hạn đã biết

- **Hooks chỉ chạy trên Claude Code và Antigravity.** Script hook (`.agents/hooks/`) đã viết
  universal, nhưng file khai báo hook thì mỗi client một schema, và Gemini CLI / Codex CLI /
  Cursor hiện chưa được cấu hình. Trên các client đó, guard chặn ghi file nhạy cảm **không chạy**.
- **ChatGPT web không gọi được MCP** — chỉ dùng được phần rules, không thao tác Aseprite.
- **Codex CLI và Antigravity cần một bước import tay** vì config MCP của chúng nằm ngoài repo.
- **Server không trả ảnh về cho model.** Mọi tool signature là `-> str`, nên AI không tự nhìn thấy
  thứ nó vừa vẽ. Bắt buộc verify bằng tool đọc lại (`/asset-qc`).

---

# 6. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp |
| :--- | :--- |
| Client không thấy tool `aseprite` nào | Chưa chạy `setup-mcp.js`, hoặc chưa mở lại client sau khi sinh config |
| Tool chạy nhưng không có gì xảy ra | `ASEPRITE_PATH` sai — server fallback gọi `aseprite` trên PATH. Chạy `node scripts/setup-mcp.js --check` |
| `ModuleNotFoundError: aseprite_mcp` | Chưa `uv --directory vendor/aseprite-mcp sync`, hoặc submodule chưa init |
| `vendor/aseprite-mcp` rỗng | Clone thiếu submodule → `git submodule update --init --recursive` |
| AI trên client này hành xử khác client kia | Bản sinh lệch → `node scripts/sync-agents.js --check` |
| Pre-commit chặn commit | Chạy `node scripts/sync-agents.js`, `git add` lại |

Tài liệu gốc của dự án: `Docs/SourceOfTruth/overview.txt`.
