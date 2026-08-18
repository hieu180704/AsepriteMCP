// Universal Read & Context Token Guard
// Cảnh báo khi đọc file nhị phân/media để tránh tràn context. Chỉ cảnh báo, không chặn.
const { getTargetPaths } = require('./hook-io.js');

const binaryExtensions = ['.exe', '.dll', '.zip', '.tar', '.iso', '.bin', '.png', '.jpg', '.mp4', '.pdf'];

for (const target of getTargetPaths()) {
  const lower = target.toLowerCase();
  const hit = binaryExtensions.find((ext) => lower.endsWith(ext));
  if (hit) {
    console.warn(`[READ GUARD WARNING] Đang đọc file nhị phân/media (${hit}). Lưu ý chỉ đọc khi thật sự cần thiết để tránh tràn context.`);
  }
}

process.exit(0);
