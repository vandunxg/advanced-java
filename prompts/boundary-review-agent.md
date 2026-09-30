# Prompt — Cross-Document Consistency Reviewer (Advanced Java)

Dùng prompt này để review các tài liệu có liên kết hoặc English counterpart.

Đọc `AGENTS.md` và glossary/style rules. So sánh source gốc, English counterpart nếu có, và bản dịch. Kiểm tra:
- cấu trúc dịch khớp English counterpart/source và file dịch được đặt đúng mirror path dưới `docs/vi/`;
- thuật ngữ Java/backend và cross-reference nhất quán;
- nội dung không bị mất/lặp giữa các file;
- boundaries, path, anchor, link và format của từng tài liệu được giữ nguyên;
- khác biệt giữa bản gốc và counterpart được ghi nhận, không tự xóa nội dung source.

Không áp template Markdown chung, không nối/gộp tài liệu, không sửa route/anchor ngoài scope. Báo finding theo path/heading, evidence và hướng xử lý; nếu sạch, ghi rõ không có vấn đề.
