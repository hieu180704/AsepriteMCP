// Universal Read & Context Token Guard
const targetFile = process.argv[2] || '';
const binaryExtensions = ['.exe', '.dll', '.zip', '.tar', '.iso', '.bin', '.png', '.jpg', '.mp4', '.pdf'];

for (const ext of binaryExtensions) {
  if (targetFile.toLowerCase().endsWith(ext)) {
    console.warn(`[READ GUARD WARNING] Đang đọc file nhị phân/media (${ext}). Lưu ý chỉ đọc khi thật sự cần thiết để tránh tràn context.`);
    break;
  }
}
process.exit(0);
