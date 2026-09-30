# Merge và bàn giao

## 1. Điều kiện bàn giao

Chỉ đánh dấu hoàn tất khi:
- mọi file trong scope có target tương ứng;
- QA đã kiểm tra source và bản dịch;
- không còn `NEEDS_FIX` hoặc `BLOCKED_SOURCE_UNCLEAR` bị che giấu;
- cấu trúc Markdown và liên kết trong phạm vi thay đổi đã được kiểm tra;
- thay đổi chỉ nằm trong scope được giao.

## 2. Tổ chức bản tiếng Việt

Bảo toàn đường dẫn dưới `docs/` trong `docs/vi/`, trừ khi cấu trúc song ngữ của dự án được thay đổi rõ ràng trong task. Không ghi đè file tiếng Trung nguồn. README/navigation tiếng Việt là thay đổi riêng; không tự đổi homepage hoặc link mặc định.

Không đưa QA report, progress note hoặc comment nội bộ vào nội dung hiển thị như tài liệu đã dịch.

## 3. Kiểm tra cuối

Kiểm tra:
- danh sách file source/target;
- heading/link path và anchor;
- code fence, table, list, diagram;
- không có source text bị bỏ hoặc lặp do dịch;
- không có marker nội bộ/review lọt vào prose;
- bản dịch không làm thay đổi Java code, config, route hoặc build.

## 4. Báo cáo

Báo cáo ngắn gọn:
- file đã dịch và file đã QA;
- trạng thái QA;
- link/path thay đổi;
- issue còn lại cụ thể (hoặc không có).

Không tuyên bố build/test đã chạy nếu chưa thực hiện; task dịch docs thường chỉ cần kiểm tra diff và cấu trúc Markdown/link liên quan.
