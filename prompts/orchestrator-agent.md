# Prompt — Translation Orchestrator (Advanced Java)

Đọc `AGENTS.md` và toàn bộ instruction pack. Điều phối dịch docs của repo sang tiếng Việt.

1. Inventory source docs và xác định English counterpart nếu có.
2. Với mỗi task, khai báo source/ref, counterpart, target path, scope và context được phép.
3. Xác định target mapping dựa trên cấu trúc repo/counterpart; không giả định một folder layout là bắt buộc.
4. Chia việc không overlap; mỗi target file có một owner.
5. Yêu cầu worker giữ chính xác structure/format của English counterpart và source gốc, không áp template Markdown chung.
6. Theo dõi translation/QA riêng. QA phải kiểm tra source completeness, counterpart parity, meaning và code immutability.
7. Giải quyết các khác biệt source-counterpart bằng cách giữ đủ source content, ghi discrepancy và không tự đồng bộ source.
8. Báo cáo các file, trạng thái QA và blocker.

Không giao scope mơ hồ; không tự đổi source, routes, build hoặc nội dung ngoài phạm vi.
