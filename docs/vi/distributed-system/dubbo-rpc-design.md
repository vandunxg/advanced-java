# Thiết kế một framework RPC tương tự Dubbo

## Câu hỏi phỏng vấn

Làm thế nào để tự thiết kế một framework RPC tương tự Dubbo?

## Phân tích tâm lý người phỏng vấn

Thành thật mà nói, câu hỏi này cũng giống như hỏi bạn cách tự thiết kế một MQ; nó chỉ kiểm tra hai điều:

-   Bạn có hiểu rất sâu về nguyên lý của một framework RPC nào đó không?
-   Bạn có thể suy nghĩ một cách tổng thể về cách thiết kế một framework RPC hay không, qua đó kiểm tra năng lực thiết kế hệ thống?

## Phân tích câu hỏi phỏng vấn

Thực ra khi được hỏi câu này, ít nhất bạn không nên hoảng. Đây là phần kiến thức nhập môn, nên tôi không thể giảng giải chuyên sâu về phân tích mã nguồn Kafka hay mã nguồn Dubbo. Hơn nữa, ngay cả khi tôi giảng thì bạn cũng cần ít nhất một hai tháng để thực sự tiêu hóa, hiểu và tiếp thu.

Vì vậy, tôi có một lời khuyên: gặp loại câu hỏi này, hãy bắt đầu từ nguyên lý của một framework tương tự mà bạn biết. Dựa trên nguyên lý của Dubbo, hãy thử tự trình bày cách bạn sẽ thiết kế. Ví dụ, Dubbo có nhiều tầng và bạn có biết đại khái mỗi tầng làm gì không? Hãy dựa theo hướng đó để trình bày sơ lược. Ít nhất đừng đứng hình; như vậy vẫn tốt hơn những người vừa được hỏi đã bối rối và không nói được gì.

Lấy một ví dụ, tôi sẽ đưa ra hướng trả lời đơn giản nhất:

-   Trước tiên, dịch vụ của bạn phải đăng ký với service registry, đúng không? Bạn cần một service registry để lưu thông tin của các dịch vụ; có thể dùng ZooKeeper để làm việc đó.
-   Sau đó, consumer cần lấy thông tin dịch vụ tương ứng từ service registry, đúng không? Mỗi dịch vụ có thể tồn tại trên nhiều máy.
-   Tiếp theo, bạn cần gửi một yêu cầu. Gửi như thế nào? Dĩ nhiên là dựa trên dynamic proxy. Bạn lấy một dynamic proxy cho interface; dynamic proxy này là proxy cục bộ cho interface, rồi nó tìm địa chỉ máy tương ứng với dịch vụ.
-   Gửi yêu cầu đến máy nào? Chắc chắn cần thuật toán cân bằng tải; ví dụ đơn giản nhất là chọn ngẫu nhiên theo vòng tròn.
-   Sau khi tìm được một máy, có thể gửi yêu cầu đến đó. Câu hỏi thứ nhất là gửi như thế nào? Bạn có thể nói dùng Netty với phương thức NIO. Câu hỏi thứ hai là dữ liệu được gửi theo định dạng nào? Bạn có thể nói dùng giao thức tuần tự hóa Hessian hoặc một giao thức khác, đúng không? Sau đó yêu cầu được gửi đi.
-   Phía máy chủ cũng cần tạo một dynamic proxy cho dịch vụ của mình, lắng nghe trên một cổng mạng và làm proxy cho mã dịch vụ cục bộ. Khi nhận được yêu cầu thì gọi mã dịch vụ tương ứng, đúng không?

Đây là hướng suy nghĩ cơ bản nhất cho một framework RPC. Chưa cần nói bạn có nền tảng kỹ thuật cao siêu đến đâu; ít nhất hãy thử trình bày được hướng đơn giản nhất này, được không?
