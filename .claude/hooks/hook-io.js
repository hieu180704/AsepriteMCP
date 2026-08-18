// Universal Hook Input Reader
// Dùng chung cho mọi AI client: Claude Code gửi payload JSON qua stdin, các client cũ
// (Antigravity, script gọi tay) truyền thẳng đường dẫn qua argv. Module này che khác biệt đó
// để hook script không phải giả định giao thức của một client cụ thể.
const fs = require('fs');

// Key chứa tên nhánh tham số của tool, tuỳ client đặt tên khác nhau.
const TOOL_INPUT_KEYS = ['tool_input', 'toolInput', 'arguments', 'params', 'input'];

// Key mang nghĩa "đường dẫn". Chỉ soi các key này, KHÔNG soi nội dung file —
// nếu match cả payload thì một lệnh ghi tài liệu có nhắc tên file nhạy cảm sẽ bị chặn oan.
const PATH_KEY = /(path|file|filename|target|uri|url)/i;

// stdin chỉ đọc được một lần, nên cache lại phòng khi hook gọi nhiều hàm.
let rawInputCache = null;

function readRawInput() {
  if (rawInputCache !== null) return rawInputCache;

  let raw = '';
  try {
    const stdin = fs.readFileSync(0, 'utf8');
    if (stdin && stdin.trim()) raw = stdin.trim();
  } catch (_) {
    // Không có stdin (chạy tay trên TTY) — rơi xuống argv.
  }
  if (!raw) raw = (process.argv[2] || '').trim();

  rawInputCache = raw;
  return raw;
}

// Ưu tiên nhánh tham số của tool. Duyệt cả payload sẽ quét nhầm metadata phiên
// (transcript_path, cwd...) — thứ người dùng không hề thao tác lên.
function pickScope(payload) {
  return TOOL_INPUT_KEYS
    .map((key) => payload[key])
    .find((value) => value && typeof value === 'object') || payload;
}

function collectPaths(node, keyMatched, out) {
  if (typeof node === 'string') {
    if (keyMatched && node.trim()) out.push(node);
    return out;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectPaths(item, keyMatched, out);
    return out;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      collectPaths(value, keyMatched || PATH_KEY.test(key), out);
    }
  }
  return out;
}

// Trả về danh sách đường dẫn mà thao tác sắp đụng tới. Rỗng = không xác định được, hook nên cho qua.
function getTargetPaths() {
  const raw = readRawInput();
  if (!raw) return [];

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    return [raw]; // Dạng argv: bản thân chuỗi là đường dẫn.
  }

  if (!payload || typeof payload !== 'object') return [String(payload)];

  return collectPaths(pickScope(payload), false, []);
}

// Trả về toàn bộ tham số tool dưới dạng chuỗi, dùng để dò từ khoá (ví dụ "git commit").
// Chuỗi rỗng = không xác định được input; hook tự chọn hành vi mặc định.
function getToolInputText() {
  const raw = readRawInput();
  if (!raw) return '';

  try {
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object') return String(payload);
    return JSON.stringify(pickScope(payload));
  } catch (_) {
    return raw;
  }
}

// Client nói JSON qua stdin thì hiểu được JSON trả về; client cũ chỉ đọc text thuần.
function speaksJson() {
  const raw = readRawInput();
  if (!raw) return false;
  try {
    const payload = JSON.parse(raw);
    return !!payload && typeof payload === 'object';
  } catch (_) {
    return false;
  }
}

module.exports = { getTargetPaths, getToolInputText, speaksJson };
