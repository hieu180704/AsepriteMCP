// Universal Safety Guard Hook
// Chặn thao tác ghi/sửa trực tiếp lên file chứa thông tin nhạy cảm.
const { getTargetPaths } = require('./hook-io.js');

const sensitivePatterns = [
  /\.env/i,
  /id_rsa/i,
  /\.pem$/i,
  /credentials\.json/i,
  /secrets/i
];

const targets = getTargetPaths();

for (const target of targets) {
  for (const pattern of sensitivePatterns) {
    if (pattern.test(target)) {
      console.error(`[SAFETY VIOLATION] Thao tác bị chặn trên "${target}": không được sửa đổi trực tiếp các file chứa thông tin nhạy cảm/bảo mật.`);
      // exit 2 = Claude Code chặn tool và đẩy stderr về cho model đọc.
      // Với client khác, non-zero vẫn được hiểu là lỗi nên cùng một mã phục vụ được cả hai.
      process.exit(2);
    }
  }
}

console.log(`[SAFETY GUARD] Đã kiểm ${targets.length} đường dẫn: SAFE`);
process.exit(0);
