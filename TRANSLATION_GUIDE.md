# Hướng dẫn dịch tài liệu Advanced Java

Bộ instruction này dùng để dịch tài liệu Markdown của repository sang tiếng Việt. Tài liệu nguồn chủ yếu là tiếng Trung và thuộc các chủ đề Java backend, JVM/runtime liên quan, concurrency, message queue, database, distributed systems, high availability, microservices và big data.

## Quy tắc cốt lõi

- File nguồn trong repository tại commit/ref được giao là source of truth.
- Dịch đầy đủ nội dung có nghĩa; không tóm tắt, tự thêm giải thích, cập nhật theo kiến thức mới hay sửa quan điểm của tác giả.
- Giữ nguyên code, identifier, API, cú pháp, literal, lệnh, URL và cấu hình.
- Giữ cấu trúc Markdown, liên kết nội bộ, thứ tự mục và nội dung kỹ thuật.
- Viết tiếng Việt tự nhiên; thuật ngữ Java/backend chính xác, nhất quán, ưu tiên English khi đó là tên chuẩn hoặc cách dùng chuyên môn phổ biến.

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
10. Prompt tác vụ trong `prompts/`

## Bố trí bản dịch

- Nguồn: `docs/<category>/<file>.md`
- Bản tiếng Việt: `docs/vi/<category>/<file>.md`
- Tài liệu điều hướng/README tiếng Việt được quản lý riêng theo task; không ghi đè README nguồn.
- Giữ cấu trúc thư mục tương đối để có thể đối chiếu từng file. Chỉ cập nhật link điều hướng khi task yêu cầu rõ và đã kiểm tra target tồn tại.
