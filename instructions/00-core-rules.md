# Quy tắc cốt lõi — Dịch Advanced Java

## 1. Source of truth

Tài liệu gốc được giao, tại branch/commit được chỉ định, là nguồn chuẩn về nội dung. Đọc trọn tài liệu trước khi dịch. Có thể đọc context được liên kết để hiểu nghĩa, nhưng không nhập nội dung không thuộc phạm vi vào bản dịch.

Không dịch từ trí nhớ, bản dịch Internet, fork khác hoặc kiến thức Java hiện tại thay cho source. Nếu source có vẻ sai/lỗi thời, dịch trung thành và báo riêng trong QA; không âm thầm sửa.

## 2. Cấu trúc đầu ra phải khớp source

Nếu có tài liệu tiếng Anh tương ứng, dùng nó làm mẫu cấu trúc cùng với tài liệu gốc. Bản dịch phải khớp cấu trúc của cặp tài liệu: đường dẫn/file tương ứng, thứ tự, heading hierarchy, đoạn, danh sách, bảng, ví dụ, code, diagram, component, metadata và cách trình bày. Nếu không có English counterpart, giữ đúng cấu trúc của tài liệu gốc.

Tài liệu gốc quyết định nội dung nào phải được giữ. English counterpart chỉ làm rõ cấu trúc/thuật ngữ đối chiếu; không được dùng để bỏ qua khác biệt trong source. Nếu hai bản không khớp, bảo toàn đủ nội dung source trong cấu trúc phù hợp và ghi lại chênh lệch.

Không áp đặt template hoặc quy ước Markdown được định nghĩa sẵn nếu chúng không xuất hiện trong tài liệu tham chiếu. Không tái cấu trúc, chuẩn hóa, di chuyển, gộp, tách hay bổ sung thành phần vì sở thích định dạng.

Bản dịch đặt dưới `docs/vi/` và mirror path/tên file của tài liệu gốc; `docs/vi/index.md` là bản dịch của `docs/index.md`. Không chỉnh sửa docs gốc để tạo bản dịch. Định nghĩa switch trong `docs/.vitepress/locales.ts`; `config.mts` chỉ cần import module và dùng property `locales`. Giữ nguyên route và nội dung nguồn.

## 3. Dịch đầy đủ

Dịch mọi nội dung có nghĩa trong scope: heading, paragraph, list, table, caption, note, warning, FAQ, câu hỏi phỏng vấn, prose quanh code và text hiển thị của component.

Không tóm tắt, bỏ câu/ví dụ, thêm giải thích riêng, thay reasoning/recommendation, đổi độ chắc chắn hoặc cập nhật theo version mới hơn.

## 4. Ngôn ngữ và ngữ cảnh Java

Viết tiếng Việt tự nhiên; giữ English cho tên API, thuật ngữ chuẩn, pattern và từ chuyên môn khi dịch làm sai hoặc khó nhận diện. Tuân thủ glossary.

Ngữ cảnh repo gồm Java/JVM, Spring/backend, concurrency, message queues, databases, distributed systems, high availability, microservices, system design và big data. Không biến ý tổng quát thành khẳng định riêng về Java nếu source không nói vậy.

## 5. Code bất biến

Code, shell command, SQL, JSON/YAML/XML, config, log, stack trace, identifier, package/class/method/field, annotation, literal, operator và URL giữ nguyên. Không format, sửa lỗi, tối ưu, thêm/bớt dòng hoặc đổi version.

## 6. Tính trung thành kỹ thuật

Giữ điều kiện, phủ định, quan hệ nhân quả, giả định, giới hạn, ngoại lệ, số liệu, version, độ phức tạp và phạm vi áp dụng. Không làm đổi semantics của concurrency, consistency, transaction, queue, cache, lock hay distributed systems.

## 7. Source mơ hồ

Không đoán nội dung thiếu hoặc thuật ngữ khó đọc. Dịch phần chắc chắn; ghi vị trí và lý do trong QA. Dùng `BLOCKED_SOURCE_UNCLEAR` nếu sự mơ hồ ảnh hưởng meaning.
