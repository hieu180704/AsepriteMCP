// Universal Closeout & Living Docs Trigger
// Nhắc cập nhật tài liệu sống ngay trước khi commit.
const { getToolInputText, speaksJson } = require('./hook-io.js');

const REMINDER = `[LIVING DOCS REMINDER]
Bạn đang thực hiện thao tác hoàn tất/commit công việc:
1. Đã cập nhật tài liệu sống tại Docs/SourceOfTruth/ chưa?
2. Đã tạo Worklog Fragment tại Docs/Done/YYYY-MM-DD-task.txt chưa?
3. Đã ghi nhận quyết định quan trọng vào Docs/Decisions/ nếu có chưa?`;

// Claude Code chỉ khớp matcher theo TÊN tool nên hook nhận mọi lệnh Bash — phải tự lọc ở đây.
// Client khác (Antigravity) đã lọc sẵn bằng matcher và có thể không truyền gì:
// input rỗng = tin bộ lọc phía client, cứ nhắc. Chỉ im lặng khi biết chắc không phải git commit.
const input = getToolInputText();
if (input && !/git\s+commit/i.test(input)) process.exit(0);

if (speaksJson()) {
  // Dạng này mới đẩy được nội dung nhắc vào ngữ cảnh của model; in text thuần chỉ hiện ở transcript.
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: REMINDER
    }
  }));
} else {
  console.log(`\n${REMINDER}\n`);
}

process.exit(0);
