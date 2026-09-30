# Quy tắc cốt lõi — Dịch Advanced Java

## 1. Source of truth

File Markdown nguồn trong repository, tại branch/commit được giao, là nguồn chuẩn. Đọc toàn bộ file nguồn trước khi dịch. Có thể đọc file liền trước/liền sau và trang được liên kết để hiểu ngữ cảnh, nhưng chỉ ghi nội dung thuộc file được giao.

Không dịch từ trí nhớ, bản dịch Internet, bản fork khác hoặc kiến thức Java hiện tại thay cho source. Nếu source có vẻ sai hoặc lỗi thời, dịch trung thành và ghi chú riêng trong QA; không âm thầm sửa.

## 2. Dịch đầy đủ

Dịch mọi nội dung có nghĩa: heading, paragraph, list, table, caption, note, warning, FAQ, câu hỏi phỏng vấn, giải thích quanh code và comment ngoài code block.

Không được tóm tắt, bỏ câu/ví dụ, thêm ví dụ hoặc giải thích riêng, thay reasoning/recommendation, đổi mức độ chắc chắn, hay cập nhật thông tin theo phiên bản Java/framework mới hơn.

## 3. Ngôn ngữ và ngữ cảnh Java

Bản dịch là tiếng Việt tự nhiên, rõ ràng, giữ English cho tên API, thuật ngữ chuẩn, pattern và từ chuyên môn khi dịch sang tiếng Việt làm sai hoặc khó nhận diện. Tuân thủ glossary.

Ngữ cảnh repo bao gồm Java/JVM, Spring và backend, concurrency, message queues, databases, distributed systems, high availability, microservices, system design và xử lý dữ liệu lớn. Không biến hướng dẫn tổng quát thành khẳng định riêng cho Java nếu source không nói vậy.

Phân biệt chính xác khái niệm Java như class/object, interface, thread, lock, memory visibility, exception, collection, JVM/JDK/JRE, API và framework. Không dịch tên công nghệ hoặc tên sản phẩm thành danh từ chung.

## 4. Code bất biến

Code, shell command, SQL, JSON/YAML/XML, cấu hình, log, stack trace, identifier, package/class/method/field name, annotation, literal, operator và URL phải giữ nguyên source. Không format lại, sửa lỗi, tối ưu, thêm/bớt dòng, đổi version, hoặc làm ví dụ compile được hơn.

Nếu không rõ vùng nào là code, đối chiếu Markdown gốc và ngữ cảnh; không tự suy diễn hoặc dịch phần có thể là cú pháp.

## 5. Tính trung thành kỹ thuật

Giữ nguyên điều kiện, phủ định, thứ tự nhân quả, giả định, giới hạn, ngoại lệ, con số, đơn vị, version, độ phức tạp và phạm vi áp dụng. Bảo toàn khác biệt giữa may/can/should/must và các phủ định như không, chưa, chỉ khi, trừ khi.

Không đổi semantics các khái niệm như consistency, availability, partition tolerance, idempotency, transaction, retry, timeout, replication, sharding, cache, lock, thread safety và message ordering.

## 6. Xử lý source mơ hồ

Không đoán nội dung bị thiếu hoặc thuật ngữ khó đọc. Dịch phần chắc chắn; ghi vị trí và lý do vào QA, dùng trạng thái `BLOCKED_SOURCE_UNCLEAR` nếu ảnh hưởng meaning. Không chèn chú giải vào bản dịch như thể đó là lời tác giả.
