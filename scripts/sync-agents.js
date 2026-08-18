#!/usr/bin/env node
// Universal Agent Sync — đồng bộ rules/recipes/hooks/skills từ nguồn `.agents/` sang mọi AI client.
//
// Nguồn duy nhất là `.agents/`. Mọi thứ script này ghi ra đều là bản sinh: sửa tay vào đó sẽ bị
// ghi đè ở lần chạy sau, và quan trọng hơn là không bao giờ đến được các model khác.
//
//   node scripts/sync-agents.js           → đồng bộ
//   node scripts/sync-agents.js --check   → chỉ kiểm tra, exit 1 nếu lệch (dùng cho pre-commit/CI)

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check');

// ---------------------------------------------------------------------------
// Cấu hình
// ---------------------------------------------------------------------------

// Copy nguyên văn `.agents/<src>` → `<dest>`.
const MIRROR_DIRS = [
  { src: '.agents/rules', dest: '.claude/rules' },
  { src: '.agents/recipes', dest: '.claude/recipes' },
  { src: '.agents/hooks', dest: '.claude/hooks' },
];

// Entry point của từng client. Mỗi file nhận bản nhúng của hard-constraints giữa cặp marker.
// Client nào đọc file nào:
//   AGENTS.md                  Antigravity, Codex CLI, Cursor (agent mode), phần lớn client mới
//   CLAUDE.md                  Claude Code, Claude Desktop
//   GEMINI.md                  Gemini CLI
//   CHATGPT.md                 ChatGPT (dán tay / project files)
//   .cursorrules               Cursor bản cũ (< 0.45)
//   .openai/system-prompt.txt  Custom GPT (dán vào ô Instructions)
const ENTRY_POINTS = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  'CHATGPT.md',
  '.cursorrules',
  '.openai/system-prompt.txt',
];

const BEGIN_MARKER = '<!-- BEGIN synced-hard-constraints -->';
const END_MARKER = '<!-- END synced-hard-constraints -->';
const GENERATED_NOTE =
  '<!-- Sinh tự động từ .agents/shared/hard-constraints.md — sửa nguồn rồi chạy ' +
  '`node scripts/sync-agents.js`. Sửa trực tiếp ở đây sẽ bị ghi đè. -->';

// Thư mục sinh hoàn toàn: file nào không nằm trong kế hoạch sync là file mồ côi và sẽ bị xoá.
const PRUNED_DIRS = [
  '.claude/rules',
  '.claude/recipes',
  '.claude/hooks',
  '.claude/commands',
  '.cursor/rules',
];

// ---------------------------------------------------------------------------
// Thu thập kế hoạch (không ghi gì ở bước này — nhờ vậy --check dùng chung được logic)
// ---------------------------------------------------------------------------

/** @type {Map<string, Buffer>} đường dẫn tương đối (dùng `/`) → nội dung mong muốn */
const plan = new Map();

function rel(absPath) {
  return path.relative(root, absPath).split(path.sep).join('/');
}

function planFile(relPath, content) {
  plan.set(relPath, Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'));
}

function planDir(srcRel, destRel) {
  const srcAbs = path.join(root, srcRel);
  if (!fs.existsSync(srcAbs)) return;

  for (const entry of fs.readdirSync(srcAbs, { withFileTypes: true })) {
    const childSrc = `${srcRel}/${entry.name}`;
    const childDest = `${destRel}/${entry.name}`;
    if (entry.isDirectory()) planDir(childSrc, childDest);
    else planFile(childDest, fs.readFileSync(path.join(root, childSrc)));
  }
}

// --- 1. Mirror rules/recipes/hooks sang .claude/ ---------------------------
for (const { src, dest } of MIRROR_DIRS) planDir(src, dest);

// --- 2. Skills → Claude commands ------------------------------------------
const skillsDir = path.join(root, '.agents/skills');
if (fs.existsSync(skillsDir)) {
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      planFile(`.claude/commands/${entry.name}.md`, fs.readFileSync(skillFile));
    }
  }
}

// --- 3. Rules → Cursor .mdc ------------------------------------------------
// Cursor >= 0.45 đọc `.cursor/rules/*.mdc`; `alwaysApply: true` cho rule nạp thường trực.
const rulesDir = path.join(root, '.agents/rules');
if (fs.existsSync(rulesDir)) {
  for (const name of fs.readdirSync(rulesDir)) {
    if (!name.endsWith('.md')) continue;
    const body = fs.readFileSync(path.join(rulesDir, name), 'utf8');
    const heading = (body.match(/^#\s+(.+)$/m) || [, name.replace(/\.md$/, '')])[1].trim();
    const mdc = [
      '---',
      `description: ${heading}`,
      'alwaysApply: true',
      '---',
      '',
      body.trimEnd(),
      '',
    ].join('\n');
    planFile(`.cursor/rules/${name.replace(/\.md$/, '.mdc')}`, mdc);
  }
}

// --- 4. Nhúng hard-constraints vào entry point của mọi client --------------
const constraintsPath = path.join(root, '.agents/shared/hard-constraints.md');
if (!fs.existsSync(constraintsPath)) {
  console.error('❌ Thiếu nguồn .agents/shared/hard-constraints.md — không thể đồng bộ entry point.');
  process.exit(1);
}

// Bỏ tiêu đề + blockquote hướng dẫn của file nguồn, chỉ nhúng phần nội dung sau `---` đầu tiên.
const constraintsRaw = fs.readFileSync(constraintsPath, 'utf8').replace(/\r\n/g, '\n');
const splitAt = constraintsRaw.indexOf('\n---\n');
const constraintsBody = (splitAt === -1 ? constraintsRaw : constraintsRaw.slice(splitAt + 5)).trim();

const block = [
  BEGIN_MARKER,
  GENERATED_NOTE,
  '',
  '# Ràng Buộc Cứng — áp dụng như nhau cho mọi AI client',
  '',
  constraintsBody,
  '',
  END_MARKER,
].join('\n');

for (const relPath of ENTRY_POINTS) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    console.error(`❌ Thiếu entry point ${relPath} — tạo file này trước khi đồng bộ.`);
    process.exit(1);
  }

  const current = fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n');
  const begin = current.indexOf(BEGIN_MARKER);
  const end = current.indexOf(END_MARKER);

  let next;
  if (begin !== -1 && end !== -1 && end > begin) {
    next = current.slice(0, begin) + block + current.slice(end + END_MARKER.length);
  } else if (begin !== -1 || end !== -1) {
    console.error(`❌ ${relPath} chỉ có một nửa cặp marker — sửa tay trước khi chạy lại.`);
    process.exit(1);
  } else {
    next = `${current.trimEnd()}\n\n---\n\n${block}\n`;
  }

  planFile(relPath, next.trimEnd() + '\n');
}

// ---------------------------------------------------------------------------
// So sánh & áp dụng
// ---------------------------------------------------------------------------

function currentBytes(relPath) {
  const abs = path.join(root, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs) : null;
}

// File thừa trong thư mục sinh hoàn toàn = file mồ côi.
function findOrphans() {
  const orphans = [];
  for (const dirRel of PRUNED_DIRS) {
    const dirAbs = path.join(root, dirRel);
    if (!fs.existsSync(dirAbs)) continue;
    const walk = (abs) => {
      for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
        const childAbs = path.join(abs, entry.name);
        if (entry.isDirectory()) walk(childAbs);
        else if (!plan.has(rel(childAbs))) orphans.push(rel(childAbs));
      }
    };
    walk(dirAbs);
  }
  return orphans;
}

const outdated = [];
for (const [relPath, want] of plan) {
  const have = currentBytes(relPath);
  if (have === null) outdated.push({ relPath, reason: 'thiếu' });
  else if (!have.equals(want)) outdated.push({ relPath, reason: 'lệch nội dung' });
}
const orphans = findOrphans();

if (checkOnly) {
  if (outdated.length === 0 && orphans.length === 0) {
    console.log(`✅ Đồng bộ khớp — ${plan.size} file bản sinh đúng với nguồn .agents/.`);
    process.exit(0);
  }
  console.error('❌ Bản sinh đã lệch khỏi nguồn `.agents/`. Chạy `node scripts/sync-agents.js`.\n');
  for (const item of outdated) console.error(`   [${item.reason}] ${item.relPath}`);
  for (const item of orphans) console.error(`   [mồ côi]      ${item}`);
  process.exit(1);
}

for (const [relPath, want] of plan) {
  const abs = path.join(root, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, want);
}
for (const relPath of orphans) fs.rmSync(path.join(root, relPath));

console.log(`🔄 Đồng bộ ${plan.size} file từ .agents/ → Claude, Cursor và entry point các client.`);
if (outdated.length) console.log(`   Đã cập nhật ${outdated.length} file lệch/thiếu.`);
if (orphans.length) console.log(`   Đã xoá ${orphans.length} file mồ côi: ${orphans.join(', ')}`);
console.log('✅ Xong. Cấu hình MCP là việc riêng — chạy `node scripts/setup-mcp.js`.');
