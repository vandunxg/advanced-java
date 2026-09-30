# Prompt — Cross-Document Consistency Reviewer (Advanced Java)

Dùng prompt này để review các file Markdown liên quan nhau, thay cho PDF boundary reviewer.

Đọc `AGENTS.md` và glossary/style rules. Đối chiếu các source/translation pair được giao và các liên kết giữa chúng. Kiểm tra thuật ngữ Java/backend nhất quán, cross-reference còn đúng, không lặp hoặc làm rơi nội dung do nhầm lẫn giữa file, và giữ nguyên ranh giới từng tài liệu.

Không nối paragraph giữa hai file, không thêm content từ file liên quan, không thay đổi route/anchor ngoài scope. Ghi report gồm các cặp file, finding chính xác theo path/heading, source evidence và cách xử lý. Nếu không có vấn đề, ghi rõ “No cross-document issues found”.