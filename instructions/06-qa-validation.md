# Quy tắc QA và validation

QA phải đối chiếu trực tiếp file nguồn và bản dịch tương ứng; không đánh PASS chỉ vì bản dịch đọc tự nhiên.

## 1. Độ đầy đủ

Kiểm tra mọi heading, paragraph, câu hỏi, list item, table cell/row, caption, note, warning, link label và prose quanh code đều có nội dung tương ứng. Không có phần tự thêm.

## 2. Fidelity kỹ thuật Java

Kiểm tra:
- tên class/API/method/package/annotation/parameter chính xác;
- Java và framework version, con số, đơn vị, độ phức tạp, thứ tự bước;
- semantics của concurrency, exception, transaction, cache, queue và distributed system;
- phủ định, điều kiện, giới hạn, ngoại lệ, mức độ khuyến nghị;
- thuật ngữ nhất quán với glossary.

## 3. Code và cấu trúc

So sánh source và target:
- code/command/query/config/log không đổi;
- code fence và inline code cân bằng;
- heading hierarchy, table, list, blockquote, HTML/diagram còn nguyên;
- link/anchor/image path không bị hỏng hoặc thay đổi ngoài scope.

## 4. Trạng thái QA

Dùng một trạng thái:
- `PASS`
- `PASS_WITH_NOTES`
- `NEEDS_FIX`
- `BLOCKED_SOURCE_UNCLEAR`

Không dùng PASS nếu còn lỗi meaning, thiếu nội dung, sai thuật ngữ hoặc link/boundary cần xử lý. Ghi report tại `docs/vi/qa/<same-relative-path>.qa.md`:

```markdown
# QA: <source path>

- Status: PASS
- Source ref: <branch or commit>
- Translation: <target path>
- Completeness: checked
- Java/code fidelity: checked
- Markdown/links: checked

## Findings
None.
```

Khi có issue, ghi vị trí, source observation, impact và cách cần xử lý. Không viết nhận xét chung chung như “cần cải thiện”.

## 5. Source unclear

Nếu source mơ hồ ảnh hưởng meaning, dùng `BLOCKED_SOURCE_UNCLEAR`; trích ngắn đúng đoạn cần xử lý, mô tả vấn đề và tiếp tục các phần độc lập nếu có thể. Không giải quyết bằng cách đoán.
