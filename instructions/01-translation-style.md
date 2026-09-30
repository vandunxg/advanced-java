# Quy tắc văn phong dịch

## 1. Tiếng Việt

- Dịch sát ý nhưng dùng câu tiếng Việt gọn, tự nhiên, đúng quan hệ logic.
- Không bám cấu trúc tiếng Trung khiến câu khó hiểu; được đổi trật tự câu khi meaning và sắc thái không đổi.
- Giữ nguyên mức độ khẳng định, câu hỏi tu từ, điều kiện, cảnh báo và giọng điệu của source.
- Không thêm lời dẫn kiểu “tác giả muốn nói”, “có thể hiểu là” hoặc nhận xét của người dịch.
- Dùng thuật ngữ nhất quán trong cùng tài liệu và giữa các tài liệu.

## 2. English và thuật ngữ kỹ thuật

Giữ nguyên tiếng Anh cho tên riêng/chuẩn và thuật ngữ thường được dùng trực tiếp trong cộng đồng Java. Có thể dịch phần giải thích chung sang tiếng Việt. Không dịch tên class, API, protocol, product, framework, annotation, design pattern hoặc cấu hình.

Lần đầu gặp thuật ngữ ít phổ biến, có thể giữ English kèm diễn giải tiếng Việt ngắn nếu chính source đã giải thích; không tự thêm định nghĩa mới.

## 3. Câu hỏi và tiêu đề

Dịch câu hỏi phỏng vấn thành tiếng Việt tự nhiên, giữ đầy đủ các vế hỏi và dấu hỏi. Không rút gọn câu hỏi dài thành tiêu đề tóm tắt.

Giữ số thứ tự, hierarchy heading, tên mục, thứ tự section và anchor semantics của source. Không thêm cấp heading.

## 4. Punctuation và format

Dùng dấu câu tiếng Việt nhất quán. Giữ nguyên token ASCII có ý nghĩa cú pháp; không thay dấu trong code, command, URL hoặc identifier. Bảo toàn bảng, list, emphasis và blockquote theo quy tắc Markdown.

## 5. Không đồng nhất hóa thuật ngữ khác nghĩa

Không gộp các khái niệm gần nhau: concurrency/parallelism, process/thread, timeout/deadline, retry/replay, queue/topic, partition/shard, replication/backup, consistency/durability, authentication/authorization, synchronous/asynchronous.

Nếu source dùng một từ không chính xác về kỹ thuật, dịch đúng từ source đang dùng, không tự thay bằng từ mà translator cho là đúng hơn; báo trong QA nếu có rủi ro hiểu sai.
