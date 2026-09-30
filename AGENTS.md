# Repository Agent Instructions

Tài liệu này áp dụng cho agent làm việc với nội dung repository. Trước task dịch/review, đọc theo thứ tự:

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

## Context

`vandunxg/advanced-java` là bộ tài liệu học tập/phỏng vấn về Java backend, concurrency, message queues, databases, distributed systems, high availability, microservices và xử lý dữ liệu lớn. Tài liệu có thể gồm bản tiếng Trung gốc, tài liệu tiếng Anh đối chiếu, Markdown, code, diagrams, metadata hoặc component của site.

## Quy tắc bắt buộc về cấu trúc đầu ra

Bản dịch phải có cấu trúc giống hệt tài liệu tiếng Anh tương ứng (nếu có) và tài liệu gốc: cùng file/đường dẫn tương ứng, thứ tự nội dung, tiêu đề, cấp mục, đoạn, ví dụ, bảng, danh sách, diagram, component, metadata và cách trình bày. Tài liệu gốc là căn cứ để không bỏ sót nội dung; bản tiếng Anh tương ứng là mẫu cấu trúc khi tồn tại. Nếu hai bản khác nhau về cấu trúc hoặc nội dung, không tự chọn/bỏ phần: giữ toàn bộ nội dung có trong bản gốc theo cấu trúc tương ứng và ghi sai khác trong QA.

Không áp đặt một template hay quy tắc Markdown chung lên tài liệu dịch. Giữ đúng cấu trúc và markup mà từng tài liệu nguồn/cặp đối chiếu thực sự dùng.

## Scope và vận hành

- Mỗi task phải nêu source gốc, English counterpart nếu có, source ref, target tương ứng và phạm vi được giao.
- Không sửa tài liệu nguồn, build, giao diện, dependency, route hoặc file ngoài scope.
- Mỗi file đích chỉ có một owner tại một thời điểm.
- QA phải so sánh bản dịch với source gốc và English counterpart khi có; chỉ báo PASS sau khi xác minh.
