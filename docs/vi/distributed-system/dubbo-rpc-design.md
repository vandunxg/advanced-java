# Thiết kế một khung RPC tương tự Dubbo

## Câu hỏi phỏng vấn

Làm thế nào để tự thiết kế một khung RPC tương tự Dubbo?

## Phân tích góc nhìn của người phỏng vấn

Thành thật mà nói, câu hỏi này cũng giống như hỏi bạn cách tự thiết kế một MQ; nó kiểm tra hai điều:

-   Bạn có hiểu rất sâu nguyên lý của một khung RPC nào đó không?
-   Bạn có thể suy nghĩ tổng thể về cách thiết kế một khung RPC hay không, qua đó kiểm tra năng lực thiết kế hệ thống?

## Phân tích câu hỏi phỏng vấn

Thực ra khi được hỏi câu này, ít nhất bạn không nên hoảng. Đây là phần kiến thức giúp bạn mở rộng hiểu biết; tôi không thể giảng giải chuyên sâu về phân tích mã nguồn Kafka hay mã nguồn Dubbo. Hơn nữa, ngay cả khi tôi giảng thì bạn cũng cần ít nhất một hai tháng để thực sự tiêu hóa, hiểu và tiếp thu.

Vì vậy, tôi có một lời khuyên: gặp loại câu hỏi này, hãy bắt đầu từ nguyên lý của một khung tương tự mà bạn biết. Dựa trên nguyên lý của Dubbo, hãy trình bày cách bạn sẽ thiết kế. Ví dụ, Dubbo có nhiều tầng và bạn có biết đại khái mỗi tầng làm gì không? Hãy dựa theo hướng đó để trình bày sơ lược. Ít nhất đừng đứng hình; như vậy vẫn tốt hơn những người vừa được hỏi đã bối rối và không nói được gì.

Lấy một ví dụ, tôi sẽ đưa ra hướng trả lời đơn giản nhất:

-   Trước tiên, dịch vụ của bạn phải đăng ký với trung tâm đăng ký, đúng không? Bạn cần một trung tâm đăng ký để lưu thông tin của các dịch vụ; có thể dùng ZooKeeper để làm việc đó.
-   Sau đó, consumer cần lấy thông tin dịch vụ tương ứng từ trung tâm đăng ký, đúng không? Mỗi dịch vụ có thể tồn tại trên nhiều máy.
-   Tiếp theo, bạn cần khởi tạo một yêu cầu. Khởi tạo như thế nào? Dĩ nhiên là dựa trên proxy động. Bạn lấy một proxy động hướng đến giao diện; proxy động này là proxy cục bộ cho giao diện, rồi nó tìm địa chỉ máy ứng với dịch vụ.
-   Gửi yêu cầu đến máy nào? Chắc chắn cần thuật toán cân bằng tải; ví dụ đơn giản nhất là chọn ngẫu nhiên theo vòng tròn.
-   Sau khi tìm được một máy, có thể gửi yêu cầu đến đó. Câu hỏi thứ nhất là gửi như thế nào? Bạn có thể nói dùng Netty với phương thức NIO. Câu hỏi thứ hai là gửi dữ liệu theo định dạng nào? Bạn có thể nói dùng giao thức tuần tự hóa Hessian hoặc giao thức khác. Sau đó yêu cầu được gửi đi.
-   Phía máy chủ cũng cần tạo proxy động cho dịch vụ của mình, lắng nghe trên một cổng mạng và proxy mã dịch vụ cục bộ. Khi nhận yêu cầu thì gọi mã dịch vụ tương ứng, đúng không?

Đây là hướng suy nghĩ cơ bản nhất cho một khung RPC. Chưa cần nói bạn có nền tảng kỹ thuật cao siêu đến đâu; ít nhất hãy thử trình bày được hướng đơn giản nhất này, được không?
