---
name: newsession
description: Đóng gói phiên làm việc, tạo worklog fragment trong Docs/Done/ và sinh prompt bàn giao cho phiên tiếp theo.
---

# Kỹ năng /newsession — Đóng Phiên & Bàn Giao

Quy trình đóng phiên chuẩn 4 bước:
1. **Sync Docs:** Kiểm tra và đồng bộ các thay đổi vào `Docs/SourceOfTruth/`.
2. **Tạo Worklog Fragment:** Tạo file `Docs/Done/YYYY-MM-DD-task-name.txt` tóm tắt những gì đã làm.
3. **Cập nhật Handoff:** Ghi nhận bài học kinh nghiệm và điểm chú ý vào `Docs/Handoffs/`.
4. **Sinh Prompt Bàn Giao:** Tạo một đoạn prompt súc tích để người dùng dán vào phiên chat mới tiếp theo.
