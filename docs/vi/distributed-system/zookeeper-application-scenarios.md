# Các tình huống sử dụng Zookeeper

## Câu hỏi phỏng vấn

Zookeeper có những tình huống sử dụng nào?

## Phân tích góc nhìn của người phỏng vấn

Chủ đề hiện tại là hệ thống phân tán. Sau khi hỏi xong một số câu liên quan đến Dubbo, người phỏng vấn đã xác nhận rằng bạn có hiểu biết cơ bản về khung dịch vụ phân tán/khung RPC. Vì vậy, tiếp theo họ có thể bắt đầu hỏi về những vấn đề khác liên quan đến hệ thống phân tán.

Khóa phân tán được dùng rất phổ biến. Khi phát triển hệ thống Java hoặc hệ thống phân tán, có thể gặp một số tình huống cần dùng đến nó. Khóa phân tán phổ biến nhất là khóa được triển khai dựa trên Zookeeper.

Thành thật mà nói, câu hỏi này thường nhằm kiểm tra bạn có hiểu Zookeeper hay không, vì Zookeeper là một hệ thống nền tảng rất phổ biến trong hệ thống phân tán. Câu hỏi thường gặp là Zookeeper có những tình huống sử dụng nào, để xem bạn có biết một số tình huống cơ bản hay không. Nhưng nếu hỏi sâu về Zookeeper thì có thể hỏi rất sâu.

## Phân tích câu hỏi phỏng vấn

Nói khái quát, các tình huống sử dụng Zookeeper như sau. Tôi chỉ nêu một vài ví dụ đơn giản; chỉ cần mọi người kể được một số trường hợp là đủ:

-   Điều phối phân tán
-   Khóa phân tán
-   Quản lý metadata/thông tin cấu hình
-   Tính sẵn sàng cao (HA)

### Điều phối phân tán

Đây là một cách dùng rất kinh điển của Zookeeper. Nói đơn giản, giả sử hệ thống A gửi một yêu cầu đến MQ, sau đó hệ thống B tiêu thụ và xử lý thông điệp. Vậy hệ thống A làm sao biết kết quả xử lý của B? Có thể dùng Zookeeper để điều phối công việc giữa các hệ thống phân tán. Sau khi A gửi yêu cầu, có thể **đăng ký listener cho giá trị của một nút nào đó** trong Zookeeper. Khi B xử lý xong và thay đổi giá trị của nút Zookeeper đó, hệ thống A sẽ lập tức nhận được thông báo, giải quyết vấn đề một cách hoàn hảo.

![zookeeper-distributed-coordination](./images/zookeeper-distributed-coordination.png)

### Khóa phân tán

Lấy một ví dụ. Hai thao tác sửa đổi liên tiếp được gửi cho cùng một dữ liệu; hai máy cùng nhận yêu cầu, nhưng phải để một máy thực thi xong trước rồi máy kia mới thực thi. Khi đó có thể dùng khóa phân tán Zookeeper: sau khi một máy nhận yêu cầu, trước tiên lấy khóa phân tán trên Zookeeper, tức tạo một znode, rồi thực hiện thao tác. Máy còn lại cũng **thử tạo** znode đó nhưng phát hiện không tạo được vì máy khác đã tạo; máy này chỉ có thể chờ đến khi máy thứ nhất thực thi xong rồi mới thực hiện.

![zookeeper-distributed-lock-demo](./images/zookeeper-distributed-lock-demo.png)

### Quản lý metadata/thông tin cấu hình

Zookeeper có thể quản lý thông tin cấu hình cho nhiều hệ thống. Chẳng hạn, Kafka, Storm và nhiều hệ thống phân tán khác chọn Zookeeper để quản lý metadata và thông tin cấu hình. Trung tâm đăng ký Dubbo cũng hỗ trợ Zookeeper, đúng không?

![zookeeper-meta-data-manage](./images/zookeeper-meta-data-manage.png)

### Tính sẵn sàng cao (HA)

Đây là tình huống rất thường gặp. Nhiều hệ thống dữ liệu lớn như Hadoop, HDFS và YARN chọn phát triển cơ chế HA dựa trên Zookeeper: một **tiến trình quan trọng thường có một bản chính và một bản dự phòng**; nếu tiến trình chính dừng, Zookeeper lập tức phát hiện và chuyển sang tiến trình dự phòng.

![zookeeper-active-standby](./images/zookeeper-active-standby.png)
