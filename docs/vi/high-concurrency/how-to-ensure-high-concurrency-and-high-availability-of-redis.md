# Làm thế nào để đảm bảo high concurrency và high availability của Redis?

## Câu hỏi phỏng vấn

Làm thế nào để đảm bảo high concurrency và high availability của Redis? Bạn có thể giới thiệu nguyên lý replication giữa primary và replica của Redis không? Bạn có thể giới thiệu nguyên lý Sentinel của Redis không?

## Phân tích suy nghĩ của người phỏng vấn

Thực ra câu hỏi này chủ yếu kiểm tra bạn: một máy Redis có thể chịu được concurrency cao đến mức nào? Nếu một máy không chịu nổi thì mở rộng thế nào để chịu được concurrency cao hơn? Redis có thể bị sập không? Nếu Redis có thể bị sập thì làm thế nào để đảm bảo high availability cho Redis?

Đây đều là những vấn đề chắc chắn cần cân nhắc trong dự án. Nếu bạn chưa từng nghĩ đến thì thực sự bạn đã suy nghĩ chưa đủ về các vấn đề trong hệ thống production.

## Phân tích câu hỏi phỏng vấn

Nếu dùng công nghệ cache Redis thì chắc chắn cần cân nhắc cách thêm nhiều máy Redis để đảm bảo high concurrency, cũng như cách để Redis không bị sập hoàn toàn khi gặp sự cố, tức là đảm bảo high availability cho Redis.

Vì nội dung mục này khá nhiều nên sẽ được trình bày thành hai tiểu mục.

-   [Kiến trúc primary-replica của Redis](./redis-master-slave.md)
-   [Dùng Sentinel để đảm bảo high availability cho Redis](./redis-sentinel.md)

Redis đạt được **high concurrency** chủ yếu nhờ **kiến trúc primary-replica**: một primary và nhiều replica. Thông thường như vậy đã đủ cho nhiều dự án; primary duy nhất dùng để ghi dữ liệu, một máy có thể đạt vài chục nghìn QPS; nhiều replica dùng để truy vấn dữ liệu, các replica có thể cung cấp tổng cộng 100 nghìn QPS.

Nếu muốn vừa chứa lượng dữ liệu lớn vừa đáp ứng high concurrency thì cần dùng Redis cluster. Sau khi dùng Redis cluster, có thể đáp ứng hàng trăm nghìn lượt đọc/ghi mỗi giây.

Với high availability của Redis, nếu triển khai kiến trúc primary-replica thì chỉ cần thêm Sentinel là được; như vậy khi bất kỳ instance nào bị sập, hệ thống đều có thể thực hiện chuyển đổi primary/standby.
