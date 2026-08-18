// Universal Safety Guard Hook
const input = process.argv[2] || '';
const sensitivePatterns = [
  /\.env/i,
  /id_rsa/i,
  /\.pem$/i,
  /credentials\.json/i,
  /secrets/i
];

for (const pattern of sensitivePatterns) {
  if (pattern.test(input)) {
    console.error('[SAFETY VIOLATION] Thao tác bị chặn: Không được sửa đổi trực tiếp các file chứa thông tin nhạy cảm/bảo mật.');
    process.exit(1);
  }
}
console.log('[SAFETY GUARD] File path checked: SAFE');
process.exit(0);
