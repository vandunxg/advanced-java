# Làm thế nào đảm bảo high concurrency và high availability của redis?

## Câu hỏi phỏng vấn

Làm thế nào đảm bảo high concurrency và high availability của redis? Bạn có thể giới thiệu nguyên lý replication primary-replica của redis không? Bạn có thể giới thiệu nguyên lý Sentinel của redis không?

## Phân tích suy nghĩ của người phỏng vấn

Thực ra câu hỏi này chủ yếu kiểm tra bạn: một máy redis có thể chịu concurrency cao đến mức nào? Nếu một máy không chịu nổi thì mở rộng thế nào để chịu được concurrency cao hơn? redis có thể bị sập không? Nếu redis có thể bị sập thì làm thế nào đảm bảo high availability của redis?

Đây đều là những vấn đề chắc chắn cần cân nhắc trong dự án. Nếu bạn chưa từng nghĩ đến thì thực sự bạn đã suy nghĩ quá ít về các vấn đề trong hệ thống production.

## Phân tích câu hỏi phỏng vấn

Nếu dùng công nghệ cache redis thì chắc chắn cần cân nhắc cách thêm nhiều máy redis để đảm bảo high concurrency, cũng như cách để redis không bị ngừng hoạt động hoàn toàn khi gặp sự cố, tức high availability của redis.

Vì nội dung mục này khá nhiều nên sẽ được trình bày thành hai tiểu mục.

-   [Kiến trúc primary-replica của redis](./redis-master-slave.md)
-   [Dùng Sentinel để đảm bảo high availability cho redis](./redis-sentinel.md)

redis thực hiện **high concurrency** chủ yếu dựa trên **kiến trúc primary-replica**: một primary, nhiều replica. Thông thường như vậy đã đủ cho nhiều dự án; primary đơn lẻ dùng để ghi dữ liệu, một máy có thể đạt vài chục nghìn QPS; nhiều replica dùng để truy vấn dữ liệu, các replica có thể cung cấp tổng cộng 100 nghìn QPS mỗi giây.

Nếu muốn chứa lượng dữ liệu lớn đồng thời thực hiện high concurrency thì cần dùng redis cluster. Sau khi dùng redis cluster, có thể cung cấp concurrency đọc ghi lên đến vài trăm nghìn mỗi giây.

Với high availability của redis, nếu triển khai kiến trúc primary-replica thì chỉ cần thêm Sentinel là được; như vậy khi bất kỳ instance nào bị sập đều có thể chuyển đổi primary/standby.
