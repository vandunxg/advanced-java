# Làm thế nào để đảm bảo message không bị tiêu thụ lặp lại?

## Câu hỏi phỏng vấn

Làm thế nào để đảm bảo message không bị tiêu thụ lặp lại? Hay nói cách khác, làm sao đảm bảo tính idempotent của việc tiêu thụ message?

## Phân tích suy nghĩ của người phỏng vấn

Đây là câu hỏi rất phổ biến; về cơ bản có thể hỏi liền hai câu này. Một khi đã tiêu thụ message thì chắc chắn phải cân nhắc có tiêu thụ lặp lại hay không, có thể tránh tiêu thụ lặp lại không, hoặc nếu đã tiêu thụ lặp lại thì có thể không gây ra bất thường cho hệ thống hay không. Đây là vấn đề cơ bản trong lĩnh vực MQ; thực chất người phỏng vấn vẫn hỏi **dùng message queue để đảm bảo tính idempotent như thế nào**, một vấn đề cần cân nhắc trong kiến trúc của bạn.

## Phân tích câu hỏi phỏng vấn

Khi trả lời câu hỏi này, đừng nghe đến chuyện message trùng lặp mà hoàn toàn không biết gì; **trước tiên hãy nói khái quát những tình huống có thể gây ra việc tiêu thụ lặp lại**.

RabbitMQ, RocketMQ và Kafka đều có thể xảy ra việc tiêu thụ message lặp lại; chuyện đó bình thường. Vì vấn đề này thường không được MQ tự đảm bảo mà do chúng ta phát triển để xử lý. Hãy lấy Kafka làm ví dụ và trình bày việc tiêu thụ lặp lại xảy ra như thế nào.

Thực tế Kafka có khái niệm offset: mỗi message được ghi vào đều có một offset đại diện cho số thứ tự của message. Sau khi consumer tiêu thụ dữ liệu, **cứ mỗi khoảng thời gian nhất định** (định kỳ), consumer sẽ commit offset của các message đã tiêu thụ để biểu thị: “Tôi đã tiêu thụ đến đây; lần sau nếu khởi động lại thì hãy cho tôi tiếp tục tiêu thụ từ offset mà lần trước tôi đã tiêu thụ”.

Nhưng chuyện gì cũng có ngoại lệ. Trong production, chúng tôi thường gặp tình huống này khi khởi động lại hệ thống: tùy cách khởi động lại, nếu đang vội có thể kill process trực tiếp rồi khởi động lại. Việc này khiến consumer đã xử lý một số message nhưng chưa kịp commit offset; thật khó xử. Sau khi khởi động lại, một số ít message sẽ được tiêu thụ thêm một lần nữa.

Lấy một ví dụ.

Xét tình huống sau: dữ liệu 1/2/3 lần lượt đi vào Kafka. Kafka gán cho mỗi dữ liệu một offset đại diện cho số thứ tự; giả sử các offset lần lượt là 152/153/154. Khi consumer lấy dữ liệu từ Kafka thì cũng tiêu thụ theo thứ tự này. Giả sử consumer đã tiêu thụ dữ liệu có `offset=153` và vừa chuẩn bị commit offset lên Zookeeper thì process consumer bị khởi động lại. Khi đó offset của dữ liệu 1/2 đã tiêu thụ chưa được commit, Kafka cũng không biết bạn đã tiêu thụ dữ liệu có `offset=153`. Sau khi khởi động lại, consumer nói với Kafka: “Này, gửi tiếp cho tôi dữ liệu nằm sau vị trí lần trước tôi tiêu thụ.” Vì offset trước đó chưa commit thành công nên dữ liệu 1/2 được gửi lại. Nếu consumer không loại bỏ trùng lặp thì sẽ tiêu thụ lặp lại.

Lưu ý: các phiên bản Kafka mới đã chuyển nơi lưu offset từ Zookeeper sang các Kafka broker và dùng topic offset nội bộ `__consumer_offsets` để lưu trữ.

![mq-10](../../high-concurrency/images/mq-10.png)

Nếu consumer lấy mỗi bản ghi rồi ghi một bản ghi vào database thì dữ liệu 1/2 có thể bị chèn hai lần vào database, khiến dữ liệu sai.

Thực ra tiêu thụ lặp lại không đáng sợ; điều đáng sợ là không nghĩ đến **cách đảm bảo tính idempotent** sau khi tiêu thụ lặp lại.

Lấy ví dụ: giả sử hệ thống tiêu thụ một message thì chèn một bản ghi vào database. Nếu một message bị tiêu thụ hai lần thì chẳng phải sẽ chèn hai bản ghi và làm sai dữ liệu sao? Nhưng nếu khi tiêu thụ lần thứ hai, hệ thống tự kiểm tra xem message đã được tiêu thụ chưa và bỏ qua nếu rồi, thì chỉ giữ lại một bản ghi và đảm bảo dữ liệu chính xác.

Một bản ghi xuất hiện hai lần nhưng trong database chỉ có một bản ghi; như vậy hệ thống đảm bảo được tính idempotent.

Nói thông thường, tính idempotent có nghĩa là khi cùng một dữ liệu hoặc request được gửi nhiều lần thì phải đảm bảo dữ liệu tương ứng không thay đổi, **không được xảy ra lỗi**.

Vậy câu hỏi thứ hai là: làm thế nào đảm bảo tính idempotent của việc tiêu thụ message trong message queue?

Thực ra vẫn cần suy nghĩ dựa trên nghiệp vụ; dưới đây là một số hướng:

-   Ví dụ, nếu lấy dữ liệu để ghi vào database thì trước tiên truy vấn theo khóa chính; nếu dữ liệu đã tồn tại thì đừng insert nữa, hãy update.
-   Ví dụ, nếu ghi vào Redis thì không vấn đề gì; mỗi lần đều là set nên vốn có tính idempotent.
-   Ví dụ, nếu không thuộc hai tình huống trên thì xử lý phức tạp hơn một chút: khi producer gửi mỗi bản ghi, cần thêm vào đó một id duy nhất toàn cục, tương tự order id. Khi consumer nhận được message, trước tiên dùng id này tra trong Redis xem đã tiêu thụ chưa. Nếu chưa thì xử lý rồi ghi id này vào Redis; nếu đã tiêu thụ thì không xử lý nữa. Chỉ cần đảm bảo không xử lý lặp lại cùng một message.
-   Ví dụ, dùng unique key của database để đảm bảo dữ liệu trùng không bị chèn nhiều lần. Do có ràng buộc unique key nên insert dữ liệu trùng chỉ phát sinh lỗi, không khiến database xuất hiện dữ liệu bẩn.

![mq-11](../../high-concurrency/images/mq-11.png)

Dĩ nhiên, cách đảm bảo việc tiêu thụ MQ có tính idempotent trong ứng dụng thực tế cần được cân nhắc theo nghiệp vụ cụ thể.
