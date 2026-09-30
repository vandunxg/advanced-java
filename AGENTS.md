# Repository Agent Instructions

Tài liệu này hướng dẫn agent khi dịch nội dung trong repository. Trước khi nhận task dịch hoặc review bản dịch, hãy đọc theo thứ tự:

1. `instructions/00-core-rules.md`
2. `instructions/01-translation-style.md`
3. `instructions/02-glossary.md`
4. `instructions/03-markdown-workflow.md`
5. `instructions/04-structure-and-context.md`
6. `instructions/05-markdown-preservation.md`
7. `instructions/06-qa-validation.md`
8. `instructions/07-progress-and-ownership.md`
9. `instructions/08-merge-and-delivery.md`
10. Prompt phù hợp trong `prompts/`

## Context của repository

`vandunxg/advanced-java` là bộ tài liệu học tập/phỏng vấn về Java backend, concurrency, message queues, databases, distributed systems, high availability, microservices và xử lý dữ liệu lớn. Nội dung nguồn hiện chủ yếu viết bằng tiếng Trung, xen kẽ thuật ngữ tiếng Anh, URL, Markdown và code.

Mục tiêu là tạo bản tiếng Việt đầy đủ, dễ đọc, chính xác về kỹ thuật và giữ cấu trúc/navigability của tài liệu. Dịch prose trong tài liệu; không thay đổi hành vi hay nội dung code.

## Phạm vi và nguyên tắc vận hành

- Mỗi task phải nêu rõ các file nguồn được giao và file đích dưới `docs/vi/`, giữ nguyên đường dẫn tương đối bên dưới `docs/`.
- Không tự ý sửa nội dung tiếng Trung nguồn, cấu hình build, giao diện, dependency hoặc file ngoài phạm vi.
- Mỗi file đích chỉ có một worker chỉnh tại một thời điểm.
- Mọi kết luận QA phải đối chiếu với file nguồn cụ thể; ghi lại nguồn, file dịch, trạng thái và lỗi còn lại.
- Chỉ báo hoàn thành những file đã được dịch và kiểm tra thực tế.
