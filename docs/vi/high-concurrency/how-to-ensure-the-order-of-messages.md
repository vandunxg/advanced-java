# Làm thế nào để đảm bảo thứ tự message?

## Câu hỏi phỏng vấn

Làm thế nào để đảm bảo thứ tự message?

## Phân tích tâm lý người phỏng vấn

Đây cũng là chủ đề chắc chắn được hỏi khi sử dụng MQ. Thứ nhất, người phỏng vấn muốn xem bạn có hiểu vấn đề về thứ tự hay không; thứ hai, họ muốn biết bạn có cách nào để đảm bảo thứ tự message hay không. Đây là vấn đề phổ biến trong hệ thống production.

## Phân tích câu hỏi phỏng vấn

Lấy một ví dụ: trước đây chúng tôi từng làm hệ thống đồng bộ mysql `binlog`, tải khá lớn; mỗi ngày phải đồng bộ hơn một trăm triệu bản ghi. Nghĩa là đồng bộ nguyên trạng dữ liệu từ một database mysql sang một database mysql khác (mysql -> mysql). Một tình huống thường gặp là team big data cần đồng bộ một database mysql để thực hiện nhiều thao tác phức tạp trên dữ liệu của hệ thống nghiệp vụ công ty.

Khi bạn thêm, xóa hoặc sửa một bản ghi trong mysql, tương ứng sẽ phát sinh 3 log `binlog` cho các thao tác thêm, xóa và sửa; sau đó ba log này được gửi vào MQ rồi được lấy ra để xử lý lần lượt. Ít nhất phải đảm bảo chúng được thực thi theo đúng thứ tự chứ? Nếu không, vốn dĩ là: thêm, sửa, xóa; bạn lại đổi thứ tự thành xóa, sửa, thêm thì chẳng phải tất cả đều sai sao?

Vốn dĩ sau khi đồng bộ dữ liệu này, cuối cùng bản ghi này phải bị xóa; nhưng nếu bạn làm sai thứ tự thì cuối cùng bản ghi lại được giữ lại, khiến việc đồng bộ dữ liệu bị sai.

Trước tiên hãy xem hai tình huống có thể khiến thứ tự bị xáo trộn:

-   **RabbitMQ**: một queue, nhiều consumer. Ví dụ producer gửi ba message data1/data2/data3 theo thứ tự vào RabbitMQ; chúng được đưa vào một memory queue của RabbitMQ. Có ba consumer, mỗi consumer tiêu thụ một trong ba message đó. Kết quả là consumer 2 hoàn tất việc xử lý trước và lưu data2 vào database, rồi mới đến data1/data3. Rõ ràng thứ tự đã bị xáo trộn.

![rabbitmq-order-01](../../high-concurrency/images/rabbitmq-order-01.png)

-   **Kafka**: giả sử tạo một topic có ba partition. Khi ghi dữ liệu, producer có thể chỉ định một key; chẳng hạn chỉ định order id làm key thì dữ liệu liên quan đến cùng một đơn hàng chắc chắn được phân phối vào cùng một partition, và dữ liệu trong partition đó chắc chắn có thứ tự.<br>Khi consumer lấy dữ liệu từ partition thì dữ liệu cũng được lấy theo thứ tự. Đến đây thứ tự vẫn ổn, chưa bị xáo trộn. Tiếp đó, bên trong consumer, có thể dùng **nhiều thread để xử lý message đồng thời**. Vì nếu consumer chỉ tiêu thụ và xử lý bằng một thread, mà việc xử lý một message khá tốn thời gian, chẳng hạn mất vài chục ms cho một message, thì một giây chỉ xử lý được vài chục message, throughput quá thấp. Nhưng nếu chạy đồng thời bằng nhiều thread thì thứ tự có thể bị xáo trộn.

![kafka-order-01](../../high-concurrency/images/kafka-order-01.png)

### Phương án giải quyết

#### RabbitMQ

Tách thành nhiều queue, mỗi queue có một consumer; chỉ là có thêm một số queue, đúng là hơi phiền, đồng thời cũng làm giảm throughput. Có thể dùng nhiều thread bên trong consumer để tiêu thụ message.

![rabbitmq-order-02](../../high-concurrency/images/rabbitmq-order-02.png)

Hoặc chỉ dùng một queue tương ứng với một consumer; bên trong consumer dùng memory queue để xếp hàng rồi phân phối cho các worker khác nhau ở tầng dưới xử lý.

Lưu ý, consumer không trực tiếp tiêu thụ message mà hash message theo giá trị khóa (ví dụ: order id); các message có cùng giá trị hash được lưu vào cùng một memory queue. Nghĩa là phải đảm bảo các message cần giữ thứ tự được lưu vào cùng một memory queue, rồi do một worker duy nhất xử lý.

#### Kafka

-   Một topic, một partition, một consumer, bên trong consumer tiêu thụ bằng một thread; throughput khi dùng một thread quá thấp nên thông thường không dùng cách này.
-   Tạo N memory queue; dữ liệu có cùng key đều được đưa vào cùng một memory queue. Sau đó tạo N thread, mỗi thread tiêu thụ một memory queue là có thể đảm bảo thứ tự.

![kafka-order-02](../../high-concurrency/images/kafka-order-02.png)
