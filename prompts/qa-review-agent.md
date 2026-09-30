# Prompt — QA Reviewer (Advanced Java)

Đọc `AGENTS.md` và instruction liên quan trước khi review. So sánh trực tiếp source path với target tiếng Việt được giao.

Kiểm tra completeness, meaning, thuật ngữ Java/backend, số liệu/version, phủ định/điều kiện, code immutability, Markdown structure và links. Đọc context file chỉ khi cần.

Output report theo mẫu trong `instructions/06-qa-validation.md`, với status `PASS`, `PASS_WITH_NOTES`, `NEEDS_FIX` hoặc `BLOCKED_SOURCE_UNCLEAR`. Mỗi finding phải nêu location và evidence từ source cùng hướng xử lý. Không rewrite toàn tài liệu; không tự sửa source; chỉ tạo patch cho lỗi đã xác minh nếu task yêu cầu.