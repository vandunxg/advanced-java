# Tình huống phỏng vấn về message queue

**Người phỏng vấn**: Xin chào.

**Ứng viên**: Xin chào.

(Người phỏng vấn nhìn thấy trên CV của bạn có một điểm sáng: bạn đã dùng `MQ` trong dự án, chẳng hạn đã dùng `ActiveMQ` )

**Người phỏng vấn**: Bạn đã dùng message queue trong hệ thống chưa? (Người phỏng vấn bắt đầu buổi phỏng vấn với giọng điệu thân thiện.)

**Ứng viên**: Rồi ạ. (Lúc này bạn cảm thấy không có gì khó.)

**Người phỏng vấn**: Vậy hãy nói xem các bạn dùng message queue trong dự án như thế nào?

**Ứng viên**: Bla bla, “Hệ thống này của chúng tôi gửi message này vào queue, hệ thống khác tiêu thụ message đó. Ví dụ, chúng tôi có order system; mỗi lần order system tạo đơn hàng mới thì gửi một message vào `ActiveMQ`, phía sau có inventory system phụ trách lấy message rồi cập nhật tồn kho.”

(Một số bạn sẽ mắc sai lầm ở đây: chỉ biết và trả lời các bạn dùng message queue như thế nào, dùng message queue để làm việc gì.)

**Người phỏng vấn**: Vậy vì sao các bạn dùng message queue? Order system của bạn không gửi message vào `MQ` mà gọi thẳng một API của inventory system, gọi trực tiếp thành công thì tồn kho cũng được cập nhật mà.

**Ứng viên**: Ờ... (Khựng lại một chút. Vì sao nhỉ? Mình chưa suy nghĩ kỹ, trưởng nhóm bảo dùng thì dùng thôi.) Bạn cố nói vài câu cho qua.

(Người phỏng vấn nghe bạn khựng lại rồi nói vài câu không đầu không đuôi, bắt đầu nghĩ rằng có gì đó không ổn; họ nghi ngờ trước đây bạn chưa từng suy nghĩ về vấn đề này.)

**Người phỏng vấn**: Vậy hãy nói xem ưu điểm và nhược điểm của message queue là gì?

(Trong đầu người phỏng vấn lúc này nghĩ rằng bạn chưa cân nhắc kỹ vì sao cần dùng `MQ` trong dự án; vậy hỏi đơn giản hơn: trước đây bạn có từng cân nhắc ưu nhược điểm khi dùng message queue không?)

**Ứng viên**: Chuyện này... (Thật ra bình thường mình chưa nghĩ về vấn đề này... lại nói vài câu không đầu không đuôi.)

(Trong lòng người phỏng vấn lúc này càng nghĩ bạn không ổn, bình thường chẳng chịu suy nghĩ gì.)

**Người phỏng vấn**: `Kafka` 、 `ActiveMQ` 、 `RabbitMQ` 、 `RocketMQ` khác nhau như thế nào?

(Người phỏng vấn hỏi câu này để bỏ qua chủ đề khá chung chung và xem bạn có hiểu các middleware `MQ` khác nhau, có tìm hiểu và nghiên cứu chưa.)

**Ứng viên**: Chúng tôi chỉ dùng `ActiveMQ`, chưa dùng các loại khác... Còn khác nhau thế nào thì cũng không rõ...

(Người phỏng vấn càng nghĩ bạn chỉ dùng công nghệ một cách máy móc, chẳng hề suy nghĩ và không ổn.)

**Người phỏng vấn**: Vậy các bạn đảm bảo high availability cho message queue như thế nào?

**Ứng viên**: Chuyện này... bình thường tôi chỉ gọi API đơn giản, không rõ message queue được triển khai thế nào...

**Người phỏng vấn**: Làm thế nào đảm bảo message không bị tiêu thụ lặp lại? Làm thế nào đảm bảo tính idempotent khi tiêu thụ?

**Ứng viên**: Gì cơ? ( `MQ` chẳng phải chỉ cần ghi và tiêu thụ là được sao, sao lại có nhiều vấn đề như vậy?)

**Người phỏng vấn**: Làm thế nào đảm bảo truyền message đáng tin cậy? Nếu message bị mất thì làm thế nào?

**Ứng viên**: Chúng tôi chưa gặp tình huống mất message...

**Người phỏng vấn**: Vậy làm thế nào đảm bảo thứ tự của message?

**Ứng viên**: Thứ tự à? Nghĩa là gì? Vì sao phải đảm bảo thứ tự message? Chẳng phải vốn dĩ nó đã có thứ tự sao?

**Người phỏng vấn**: Làm thế nào giải quyết vấn đề message queue bị trễ và hết hạn? Khi queue đầy thì xử lý thế nào? Nếu vài triệu message liên tục tồn đọng hàng giờ thì giải quyết ra sao?

**Ứng viên**: Không phải, bình thường tôi chưa gặp các vấn đề này; chỉ dùng đơn giản và biết một số chức năng của `MQ`.

**Người phỏng vấn**: Nếu yêu cầu bạn viết một message queue, bạn sẽ thiết kế kiến trúc như thế nào? Hãy trình bày ý tưởng của bạn.

**Ứng viên**: ...... Tôi xin phép về trước......

---

Đây thực ra là phong cách phỏng vấn của một số người: câu hỏi không lan man mà mở rộng dần từ một điểm nhỏ. Ví dụ, người phỏng vấn có thể trao đổi với bạn về high concurrency; trong chủ đề đó họ hỏi về cache, `MQ`, v.v., **đi từ nông đến sâu, đào sâu từng bước**.

Trên đây là một quy trình đánh giá kỹ thuật rất điển hình về message queue. Người phỏng vấn giỏi chắc chắn sẽ bắt đầu từ một điểm bạn từng làm, rồi mở rộng và đánh giá chuyên sâu từng lớp, hỏi lần lượt cho đến khi đào sâu tận gốc, hỏi đến tận cùng của điểm kỹ thuật đó.
