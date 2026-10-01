# Tình huống phỏng vấn về message queue

**Người phỏng vấn**: Xin chào.

**Ứng viên**: Xin chào.

(Người phỏng vấn nhìn thấy trên CV của bạn có một điểm nổi bật: bạn đã dùng `MQ` trong dự án, chẳng hạn đã dùng `ActiveMQ` )

**Người phỏng vấn**: Bạn đã dùng message queue trong hệ thống chưa? (Người phỏng vấn bắt đầu buổi phỏng vấn với giọng điệu thân thiện.)

**Ứng viên**: Rồi ạ. (Lúc này bạn cảm thấy chẳng có gì đặc biệt.)

**Người phỏng vấn**: Vậy hãy nói xem các bạn dùng message queue trong dự án như thế nào?

**Ứng viên**: Bla bla, “Hệ thống này của chúng tôi gửi message này vào queue, hệ thống khác tiêu thụ message đó. Ví dụ, chúng tôi có một hệ thống đơn hàng; mỗi khi hệ thống đơn hàng tạo đơn hàng mới thì sẽ gửi một message vào `ActiveMQ`, ở phía backend có một hệ thống tồn kho phụ trách lấy message rồi cập nhật tồn kho.”

(Một số bạn sẽ mắc sai lầm ở đây: bạn chỉ biết trả lời các bạn dùng message queue như thế nào và dùng message queue để làm gì.)

**Người phỏng vấn**: Vậy vì sao các bạn dùng message queue? Hệ thống đơn hàng của bạn không gửi message vào `MQ` mà gọi thẳng một API của hệ thống tồn kho, gọi một phát là thành công thì tồn kho cũng được cập nhật mà.

**Ứng viên**: Ờ... (Khựng lại một chút. Vì sao nhỉ? Mình chưa suy nghĩ kỹ, trưởng nhóm bảo dùng thì dùng thôi.) Bạn đành phải nói lung tung vài câu cho qua.

(Người phỏng vấn nghe bạn khựng lại rồi nói vài câu không đầu không đuôi, bắt đầu nghĩ rằng có gì đó không ổn; họ nghi ngờ trước đây bạn chưa từng suy nghĩ về vấn đề này.)

**Người phỏng vấn**: Vậy hãy nói xem ưu điểm và nhược điểm của message queue là gì?

(Trong đầu người phỏng vấn lúc này là: bạn chưa cân nhắc kỹ vì sao cần dùng `MQ` trong dự án; vậy tôi hỏi đơn giản hơn một chút: nếu dùng message queue thì trước đây bạn đã từng cân nhắc ưu điểm và nhược điểm của nó chưa?)

**Ứng viên**: Chuyện này... (Thật ra bình thường mình chưa nghĩ về vấn đề này... lại nói vài câu không đầu không đuôi.)

(Trong lòng người phỏng vấn lúc này càng thấy bạn này không ổn, bình thường chẳng chịu suy nghĩ gì.)

**Người phỏng vấn**: `Kafka`, `ActiveMQ`, `RabbitMQ`, `RocketMQ` khác nhau như thế nào?

(Người phỏng vấn hỏi câu này để bỏ qua chủ đề khá mơ hồ và xem bạn có hiểu các middleware `MQ` khác nhau, có tìm hiểu và nghiên cứu chưa.)

**Ứng viên**: Chúng tôi chỉ dùng `ActiveMQ`, chưa dùng các loại khác... Còn khác nhau thế nào thì cũng không rõ...

(Người phỏng vấn càng nghĩ bạn chỉ dùng công nghệ một cách máy móc, chẳng hề suy nghĩ và không ổn.)

**Người phỏng vấn**: Làm thế nào để đảm bảo message queue có high availability?

**Ứng viên**: Chuyện này... bình thường tôi chỉ gọi API đơn giản, không rõ message queue được triển khai thế nào...

**Người phỏng vấn**: Làm thế nào đảm bảo message không bị tiêu thụ lặp lại? Làm thế nào đảm bảo tính idempotent khi tiêu thụ?

**Ứng viên**: Gì cơ? ( `MQ` chẳng phải chỉ cần ghi và tiêu thụ là được sao, sao lại có nhiều vấn đề như vậy?)

**Người phỏng vấn**: Làm thế nào đảm bảo truyền message đáng tin cậy? Nếu message bị mất thì làm thế nào?

**Ứng viên**: Chúng tôi chưa mấy khi làm mất message...

**Người phỏng vấn**: Vậy làm thế nào đảm bảo thứ tự của message?

**Ứng viên**: Thứ tự à? Nghĩa là gì? Vì sao phải đảm bảo thứ tự message? Chẳng phải vốn dĩ nó đã có thứ tự sao?

**Người phỏng vấn**: Làm thế nào giải quyết vấn đề message bị delay, hết hạn và mất hiệu lực trong message queue? Khi queue đầy thì xử lý thế nào? Nếu vài triệu message liên tục tồn đọng hàng giờ thì giải quyết ra sao?

**Ứng viên**: Không phải, bình thường tôi chưa gặp các vấn đề này; chỉ dùng đơn giản và biết một số chức năng của `MQ`.

**Người phỏng vấn**: Nếu yêu cầu bạn viết một message queue, bạn sẽ thiết kế kiến trúc như thế nào? Hãy trình bày ý tưởng của bạn.

**Ứng viên**: ...... Tôi đi trước đây......

---

Đây thực ra là một kiểu phỏng vấn: câu hỏi của người phỏng vấn không lan man mà mở rộng dần từ một điểm nhỏ. Ví dụ, người phỏng vấn có thể trao đổi với bạn về high concurrency; trong chủ đề đó họ hỏi về cache, `MQ`, v.v., **đi từ nông đến sâu, đào sâu từng bước**.

Trên đây là một quy trình đánh giá kỹ thuật rất điển hình về message queue. Người phỏng vấn giỏi chắc chắn sẽ bắt đầu từ một điểm bạn từng làm, rồi mở rộng và đánh giá chuyên sâu từng lớp, hỏi lần lượt cho đến khi đào sâu tận gốc, hỏi đến tận cùng của điểm kỹ thuật đó.
