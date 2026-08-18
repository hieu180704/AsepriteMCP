#!/usr/bin/env node
// MCP Config Generator — sinh khai báo MCP server cho mọi AI client trên máy hiện tại.
//
// Vì sao cần script này: đường dẫn tới `uv` và `Aseprite.exe` khác nhau trên từng máy, còn mỗi
// client lại đọc config ở một file và một schema riêng. Commit đường dẫn cá nhân vào repo thì máy
// khác gãy; để mỗi client tự cấu hình tay thì các model chạy không giống nhau. Nên: nguồn duy nhất
// là `mcp-servers.template.json`, script này resolve rồi ghi ra đúng file của từng client.
//
//   node scripts/setup-mcp.js           → sinh config
//   node scripts/setup-mcp.js --check   → chỉ báo cáo, không ghi file
//
// Thứ tự ưu tiên khi tìm đường dẫn: mcp.local.json → biến môi trường → dò tự động.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check');
const isWindows = process.platform === 'win32';

// ---------------------------------------------------------------------------
// Tìm đường dẫn của máy này
// ---------------------------------------------------------------------------

function readLocalOverrides() {
  const file = path.join(root, 'mcp.local.json');
  if (!fs.existsSync(file)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.error(`⚠️  mcp.local.json không phải JSON hợp lệ (${err.message}) — bỏ qua file này.`);
    return {};
  }
}

const overrides = readLocalOverrides();

function whichBinary(name) {
  try {
    const finder = isWindows ? 'where' : 'which';
    const out = execFileSync(finder, [name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const first = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0];
    return first || null;
  } catch (_) {
    return null;
  }
}

const home = os.homedir();
const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

// Bản portable/giải nén thường nằm trong một thư mục con của Downloads với tên không đoán trước
// được, nên quét theo pattern thay vì liệt kê đường dẫn cứng.
function scanPortableCopies() {
  const bases = [path.join(home, 'Downloads'), path.join(home, 'Desktop')];
  const found = [];
  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    let entries;
    try {
      entries = fs.readdirSync(base, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || !/aseprite/i.test(entry.name)) continue;
      const exe = path.join(base, entry.name, isWindows ? 'Aseprite.exe' : 'aseprite');
      if (fs.existsSync(exe)) found.push(exe);
    }
  }
  return found;
}

const ASEPRITE_CANDIDATES = isWindows
  ? [
      path.join(programFiles, 'Aseprite', 'Aseprite.exe'),
      path.join(programFilesX86, 'Steam', 'steamapps', 'common', 'Aseprite', 'Aseprite.exe'),
      path.join(programFiles, 'Steam', 'steamapps', 'common', 'Aseprite', 'Aseprite.exe'),
      path.join(localAppData, 'Aseprite', 'Aseprite.exe'),
      path.join(localAppData, 'itch', 'apps', 'aseprite', 'Aseprite.exe'),
      path.join(localAppData, 'Programs', 'Aseprite', 'Aseprite.exe'),
      ...scanPortableCopies(),
    ]
  : process.platform === 'darwin'
    ? [
        '/Applications/Aseprite.app/Contents/MacOS/aseprite',
        path.join(home, 'Applications/Aseprite.app/Contents/MacOS/aseprite'),
      ]
    : ['/usr/bin/aseprite', '/usr/local/bin/aseprite', path.join(home, '.local/bin/aseprite')];

const UV_CANDIDATES = isWindows
  ? [path.join(home, '.local', 'bin', 'uv.exe'), path.join(localAppData, 'Programs', 'uv', 'uv.exe')]
  : [path.join(home, '.local/bin/uv'), '/usr/local/bin/uv', '/opt/homebrew/bin/uv'];

/**
 * @param {string} key       tên placeholder / biến môi trường
 * @param {string[]} paths   các vị trí cài đặt phổ biến để dò
 * @param {string} binary    tên lệnh để dò trên PATH
 */
function resolvePath(key, paths, binary) {
  const fromLocal = (overrides[key] || '').trim();
  if (fromLocal) return { value: fromLocal, source: 'mcp.local.json' };

  const fromEnv = (process.env[key] || '').trim();
  if (fromEnv) return { value: fromEnv, source: `biến môi trường ${key}` };

  const found = paths.find((p) => fs.existsSync(p));
  if (found) return { value: found, source: 'dò vị trí cài đặt phổ biến' };

  const onPath = binary ? whichBinary(binary) : null;
  if (onPath) return { value: onPath, source: `dò trên PATH (${binary})` };

  return { value: null, source: null };
}

const uv = resolvePath('UV_BIN', UV_CANDIDATES, 'uv');
const aseprite = resolvePath('ASEPRITE_PATH', ASEPRITE_CANDIDATES, 'aseprite');

// ---------------------------------------------------------------------------
// Dựng khai báo server từ template
// ---------------------------------------------------------------------------

const templatePath = path.join(root, 'mcp-servers.template.json');
if (!fs.existsSync(templatePath)) {
  console.error('❌ Thiếu mcp-servers.template.json — không có nguồn để sinh config.');
  process.exit(1);
}

const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
const replacements = {
  '${PROJECT_ROOT}': root,
  '${UV_BIN}': uv.value || '',
  '${ASEPRITE_PATH}': aseprite.value || '',
};

// Đường dẫn trong template viết bằng `/`; đổi sang dấu phân cách của OS để client nào cũng gọi được.
function substitute(node) {
  if (typeof node === 'string') {
    let out = node;
    for (const [token, value] of Object.entries(replacements)) out = out.split(token).join(value);
    return out.includes(path.sep) || out.includes('/') ? path.normalize(out) : out;
  }
  if (Array.isArray(node)) return node.map(substitute);
  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node)
        .filter(([key]) => !key.startsWith('_')) // bỏ các khoá chú thích của template
        .map(([key, value]) => [key, substitute(value)])
    );
  }
  return node;
}

const servers = substitute(template).mcpServers;

// ---------------------------------------------------------------------------
// Kiểm tra tiền đề
// ---------------------------------------------------------------------------

const problems = [];
if (!uv.value) {
  problems.push(
    'Không tìm thấy `uv`. Cài bằng `winget install astral-sh.uv` (hoặc `pipx install uv`), ' +
      'rồi chạy lại; hoặc điền UV_BIN vào mcp.local.json.'
  );
}
if (!aseprite.value) {
  problems.push(
    'Không tìm thấy Aseprite. Điền ASEPRITE_PATH vào mcp.local.json (đường dẫn tới Aseprite.exe). ' +
      'Bỏ trống thì server sẽ fallback gọi `aseprite` trên PATH và gãy im lặng khi không có.'
  );
}
if (!fs.existsSync(path.join(root, 'vendor', 'aseprite-mcp', 'aseprite_mcp'))) {
  problems.push(
    'Thiếu mã nguồn server tại vendor/aseprite-mcp. Chạy `git submodule update --init --recursive`.'
  );
}

// ---------------------------------------------------------------------------
// Sinh file cho từng client
// ---------------------------------------------------------------------------

const json = (value) => JSON.stringify(value, null, 2) + '\n';

// VS Code / GitHub Copilot dùng khoá `servers` thay vì `mcpServers`.
const vscodeShape = { servers };

// Gemini CLI để chung MCP với các setting khác trong .gemini/settings.json — phải merge, không đè.
function mergeGeminiSettings() {
  const file = path.join(root, '.gemini', 'settings.json');
  let current = {};
  if (fs.existsSync(file)) {
    try {
      current = JSON.parse(fs.readFileSync(file, 'utf8')) || {};
    } catch (err) {
      console.error(`⚠️  .gemini/settings.json hỏng (${err.message}) — sẽ ghi đè bằng bản mới.`);
      current = {};
    }
  }
  return { ...current, mcpServers: { ...(current.mcpServers || {}), ...servers } };
}

// Codex CLI đọc TOML ở ~/.codex/config.toml (global, không có bản per-project) → chỉ sinh snippet.
function codexSnippet() {
  const s = servers.aseprite;
  const argList = s.args.map((a) => JSON.stringify(a)).join(', ');
  const envList = Object.entries(s.env || {})
    .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
    .join(', ');
  return [
    '# Codex CLI đọc file global ~/.codex/config.toml — không có bản per-project.',
    '# Copy khối dưới vào file đó (tạo mới nếu chưa có), rồi mở lại Codex.',
    '# Sinh bởi `node scripts/setup-mcp.js`; chạy lại script sau khi đổi máy hoặc đổi đường dẫn.',
    '',
    '[mcp_servers.aseprite]',
    `command = ${JSON.stringify(s.command)}`,
    `args = [${argList}]`,
    envList ? `env = { ${envList} }` : 'env = {}',
    '',
  ].join('\n');
}

const outputs = [
  { file: '.mcp.json', content: json({ mcpServers: servers }), client: 'Claude Code / Claude Desktop' },
  { file: '.cursor/mcp.json', content: json({ mcpServers: servers }), client: 'Cursor' },
  { file: '.vscode/mcp.json', content: json(vscodeShape), client: 'VS Code / GitHub Copilot' },
  { file: '.gemini/settings.json', content: json(mergeGeminiSettings()), client: 'Gemini CLI' },
  { file: '.codex/config.snippet.toml', content: codexSnippet(), client: 'Codex CLI (copy tay)' },
  {
    file: 'mcp-config.generated.json',
    content: json({ mcpServers: servers }),
    client: 'Antigravity / Cline / Continue / client khác — import hoặc dán khối mcpServers này',
  },
];

console.log('🔍 Đường dẫn phát hiện được trên máy này:');
console.log(`   uv            : ${uv.value || '(KHÔNG TÌM THẤY)'}${uv.source ? `  ← ${uv.source}` : ''}`);
console.log(`   Aseprite      : ${aseprite.value || '(KHÔNG TÌM THẤY)'}${aseprite.source ? `  ← ${aseprite.source}` : ''}`);
console.log(`   Gốc dự án     : ${root}`);
console.log('');

if (checkOnly) {
  for (const out of outputs) {
    const exists = fs.existsSync(path.join(root, out.file));
    console.log(`   ${exists ? '✓' : '✗'} ${out.file.padEnd(28)} ${out.client}`);
  }
  console.log('');
  if (problems.length) {
    for (const p of problems) console.error(`❌ ${p}`);
    process.exit(1);
  }
  console.log('✅ Tiền đề đầy đủ.');
  process.exit(0);
}

for (const out of outputs) {
  const abs = path.join(root, out.file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, out.content, 'utf8');
  console.log(`   ✍  ${out.file.padEnd(28)} ${out.client}`);
}

console.log('');
console.log('📌 Việc còn phải làm tay:');
console.log('   • Codex CLI  : copy .codex/config.snippet.toml vào ~/.codex/config.toml');
console.log('   • Antigravity: import khối mcpServers trong mcp-config.generated.json vào phần cấu hình MCP của IDE');
console.log('   • ChatGPT web: không chạy MCP được — dùng .openai/system-prompt.txt để giữ đúng ràng buộc');
console.log('');

if (problems.length) {
  console.error('⚠️  Config đã sinh nhưng CHƯA chạy được, còn thiếu:');
  for (const p of problems) console.error(`   • ${p}`);
  process.exit(1);
}

console.log('✅ Xong. Mở lại AI client để nó nạp config mới.');
