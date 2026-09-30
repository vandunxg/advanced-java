# Làm thế nào đảm bảo thứ tự của message?

## Câu hỏi phỏng vấn

Làm thế nào đảm bảo thứ tự của message?

## Phân tích suy nghĩ của người phỏng vấn

Đây cũng là chủ đề chắc chắn được hỏi khi dùng MQ. Thứ nhất, người phỏng vấn muốn xem bạn có hiểu vấn đề thứ tự hay không; thứ hai, họ muốn biết bạn có cách nào đảm bảo thứ tự message không. Đây là vấn đề phổ biến trong hệ thống production.

## Phân tích câu hỏi phỏng vấn

Lấy một ví dụ: trước đây chúng tôi từng làm hệ thống đồng bộ mysql `binlog`, tải khá lớn; mỗi ngày phải đồng bộ đến hàng trăm triệu bản ghi. Nghĩa là đồng bộ nguyên trạng dữ liệu từ một database mysql sang một database mysql khác (mysql -> mysql). Ví dụ thường gặp là team big data cần đồng bộ một database mysql để thực hiện nhiều thao tác phức tạp trên dữ liệu của hệ thống nghiệp vụ công ty.

Khi thêm, xóa hoặc sửa một bản ghi trong mysql, tương ứng sẽ có 3 log `binlog` thêm/xóa/sửa; sau đó ba log này được gửi vào MQ rồi lấy ra tiêu thụ theo thứ tự. Ít nhất phải đảm bảo chúng được thực thi theo đúng thứ tự chứ? Nếu không, vốn là thêm, sửa, xóa nhưng bạn lại đổi thứ tự thành xóa, sửa, thêm thì chẳng phải tất cả đều sai sao?

Ban đầu, dữ liệu được đồng bộ sang thì bản ghi cuối cùng đáng lẽ phải bị xóa; nhưng nếu bạn làm sai thứ tự thì cuối cùng bản ghi lại được giữ lại, khiến việc đồng bộ dữ liệu sai.

Trước tiên hãy xem hai tình huống có thể làm sai thứ tự:

-   **RabbitMQ**: một queue, nhiều consumer. Ví dụ producer gửi ba bản ghi data1/data2/data3 theo thứ tự vào RabbitMQ; chúng được đưa vào một memory queue của RabbitMQ. Có ba consumer lần lượt tiêu thụ một bản ghi trong số đó. Kết quả, consumer 2 hoàn tất trước và lưu data2 vào database, sau đó mới đến data1/data3. Rõ ràng thứ tự đã bị đảo lộn.

![rabbitmq-order-01](./images/rabbitmq-order-01.png)

-   **Kafka**: giả sử tạo một topic có ba partition. Khi ghi dữ liệu, producer có thể chỉ định một key; chẳng hạn chỉ định order id làm key thì dữ liệu liên quan đến cùng một đơn hàng chắc chắn được phân phối vào cùng một partition, và dữ liệu trong partition đó chắc chắn có thứ tự.<br>Khi consumer lấy dữ liệu từ partition thì cũng có thứ tự. Đến đây thứ tự vẫn ổn, chưa bị đảo. Tiếp đó trong consumer, có thể dùng **nhiều thread để xử lý message đồng thời**. Vì nếu consumer chỉ dùng một thread để tiêu thụ và xử lý mà mỗi lần xử lý mất nhiều thời gian, chẳng hạn hàng chục mili giây cho một message, thì một giây chỉ xử lý được vài chục message, throughput quá thấp. Nhưng nếu nhiều thread chạy đồng thời thì thứ tự có thể bị đảo lộn.

![kafka-order-01](./images/kafka-order-01.png)

### Phương án giải quyết

#### RabbitMQ

Tách thành nhiều queue, mỗi queue có một consumer; chỉ là có thêm một số queue nên đúng là hơi phiền, đồng thời làm giảm throughput. Có thể dùng nhiều thread bên trong consumer để tiêu thụ.

![rabbitmq-order-02](./images/rabbitmq-order-02.png)

Hoặc chỉ dùng một queue và gắn với một consumer; bên trong consumer dùng memory queue để xếp hàng rồi phân phối cho các worker khác nhau ở tầng dưới xử lý.

Lưu ý, consumer không trực tiếp tiêu thụ message mà hash message theo khóa (ví dụ: order id); các message có cùng giá trị hash được lưu vào cùng một memory queue. Nghĩa là phải đảm bảo các message cần giữ thứ tự được lưu vào cùng một memory queue, rồi một worker duy nhất xử lý chúng.

#### Kafka

-   Một topic, một partition, một consumer và một thread tiêu thụ bên trong. Throughput của một thread quá thấp nên thông thường không dùng cách này.
-   Tạo N memory queue; dữ liệu có cùng key đều vào cùng một memory queue. Sau đó tạo N thread, mỗi thread tiêu thụ một memory queue là có thể đảm bảo thứ tự.

![kafka-order-02](./images/kafka-order-02.png)
