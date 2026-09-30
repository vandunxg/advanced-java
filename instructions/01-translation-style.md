# Quy tắc văn phong dịch

## 1. Tiếng Việt

- Dịch sát ý bằng câu tiếng Việt rõ ràng, tự nhiên.
- Có thể đổi trật tự câu khi không đổi meaning, sắc thái hoặc logic.
- Giữ mức độ khẳng định, câu hỏi, điều kiện, cảnh báo và giọng điệu của source.
- Không thêm lời giải thích/nhận xét của người dịch.
- Giữ nhất quán thuật ngữ trong cùng tài liệu và các tài liệu liên quan.

## 2. Thuật ngữ và English

Giữ nguyên tên riêng, API, chuẩn, protocol, product, framework, annotation, design pattern và thuật ngữ Java phổ biến. Dịch phần giải thích chung khi phù hợp. Không dịch tên code hoặc tên chính thức.

## 3. Heading và câu hỏi

Dịch text hiển thị của heading, câu hỏi và label nhưng giữ nguyên cấu trúc, cấp bậc, số thứ tự, vị trí, anchor/slug được tooling sử dụng và cách trình bày của tài liệu tham chiếu. Không thêm/bớt cấp heading hoặc rút gọn câu hỏi.

## 4. Dấu câu và cách trình bày

Cách trình bày bản dịch phải theo đúng tài liệu gốc và English counterpart nếu có. Không áp dụng punctuation/style template riêng làm thay đổi các ranh giới đoạn, cách đánh số, emphasis, list/table, component hoặc format. Dịch text tự nhiên nhưng không đổi markup, cú pháp, token hay layout của source.

Không đồng nhất hóa các khái niệm gần nhau: concurrency/parallelism, process/thread, timeout/deadline, retry/replay, queue/topic, partition/shard, replication/backup, consistency/durability, authentication/authorization, synchronous/asynchronous.

Nếu source dùng thuật ngữ có vẻ không chính xác, dịch đúng từ source đang dùng và ghi chú QA khi có nguy cơ gây hiểu sai.
