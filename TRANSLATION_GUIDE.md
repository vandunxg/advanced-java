# Hướng dẫn dịch tài liệu Advanced Java

Bộ instruction này dùng để dịch docs của repository sang tiếng Việt. Nội dung tập trung vào Java backend, JVM, concurrency, message queue, database, distributed systems, high availability, microservices và big data.

## Quy tắc cấu trúc

Cấu trúc bản dịch phải giống hệt tài liệu gốc và tài liệu tiếng Anh tương ứng nếu có. Giữ đúng thứ tự và hierarchy nội dung, đường dẫn/file tương ứng, heading, paragraph, bảng, list, ví dụ, code, diagram, component, metadata và cách trình bày thực tế của tài liệu. Source gốc quyết định nội dung cần dịch; English counterpart là structural reference khi tồn tại. Nếu hai bản không khớp, bảo toàn nội dung source và ghi khác biệt trong QA.

Không chuẩn hóa đầu ra theo một template Markdown chung hoặc theo các quy tắc định dạng không có trong tài liệu tham chiếu. Không thêm/bớt/di chuyển thành phần để làm tài liệu trông “đúng Markdown” hơn.

## Quy tắc nội dung

- Dịch đầy đủ, không tóm tắt, tự thêm giải thích, hiện đại hóa hay sửa ý tác giả.
- Giữ nguyên Java code, identifier, API, command, query, config, URL và các token kỹ thuật.
- Dùng tiếng Việt tự nhiên, thuật ngữ Java/backend nhất quán và chính xác.

## Thứ tự đọc

1. `instructions/00-core-rules.md`
2. `instructions/01-translation-style.md`
3. `instructions/02-glossary.md`
4. `instructions/03-markdown-workflow.md`
5. `instructions/04-structure-and-context.md`
6. `instructions/05-markdown-preservation.md`
7. `instructions/06-qa-validation.md`
8. `instructions/07-progress-and-ownership.md`
9. `instructions/08-merge-and-delivery.md`
10. Prompt task trong `prompts/`

## Định vị bản dịch

Đích dịch phải theo đúng cấu trúc thư mục và tên file của English counterpart nếu có; nếu không có, theo đúng đường dẫn tài liệu gốc trong layout ngôn ngữ mà task chỉ định. Ví dụ `docs/vi/<source-relative-path>` chỉ là ví dụ mapping khi nó khớp repo; không được xem là template bắt buộc. Không ghi đè source. Không tự tạo navigation hoặc đổi route.
