# Chuỗi câu hỏi phỏng vấn liên hoàn về hệ thống phân tán

Có một số bạn trước đây chủ yếu làm trong ngành truyền thống hoặc các dự án outsource, làm việc lâu năm ở những công ty nhỏ nên công nghệ khá đơn giản. Họ có một vấn đề chung là ít làm việc với hệ thống phân tán. Hiện nay, các công ty Internet thường xây dựng hệ thống phân tán; tuy nhiên, phần lớn mọi người không làm các hệ thống phân tán tầng thấp như hệ thống lưu trữ phân tán Hadoop HDFS, hệ thống tính toán phân tán Hadoop MapReduce / Spark hay hệ thống tính toán luồng phân tán Storm.

Hệ thống nghiệp vụ phân tán là việc chia một hệ thống lớn ban đầu được phát triển bằng Java thành **nhiều hệ thống con**; các hệ thống con gọi lẫn nhau để tạo thành một hệ thống tổng thể. Giả sử trước đây bạn làm một hệ thống OA gồm mô-đun phân quyền, mô-đun nhân viên, mô-đun nghỉ phép và mô-đun tài chính; toàn bộ nằm trong một dự án chứa một loạt mô-đun, các mô-đun gọi lẫn nhau và được triển khai trên một máy. Bây giờ, nếu tách hệ thống đó thành bốn hệ thống riêng: hệ thống phân quyền, hệ thống nhân viên, hệ thống nghỉ phép và hệ thống tài chính, tức bốn dự án được triển khai trên bốn máy. Khi một yêu cầu đến, để hoàn thành yêu cầu đó, hệ thống nhân viên gọi hệ thống phân quyền, hệ thống nghỉ phép và hệ thống tài chính; mỗi hệ thống hoàn thành một phần công việc. Chỉ sau khi cả bốn hệ thống hoàn tất mới coi yêu cầu đã hoàn thành.

![simple-distributed-system-oa](../../distributed-system/images/simple-distributed-system-oa.png)

> Vài năm gần đây, Spring Cloud bắt đầu nổi lên và phổ biến; công nghệ này mới phổ biến, chưa được áp dụng rộng rãi. Hiện nay, Dubbo là công nghệ được dùng phổ biến, vì vậy ở đây chủ yếu nói về Dubbo.

Người phỏng vấn có thể hỏi bạn những câu sau.

## Vì sao cần tách hệ thống?

-   Vì sao cần tách hệ thống? Tách hệ thống như thế nào? Sau khi tách có thể không dùng Dubbo không? Dubbo khác thrift ở điểm nào?

## Khung dịch vụ phân tán

-   Hãy trình bày nguyên lý hoạt động của Dubbo. Nếu trung tâm đăng ký bị lỗi thì các dịch vụ có thể tiếp tục giao tiếp không?
-   Dubbo hỗ trợ những giao thức tuần tự hóa nào? Hãy nói về cấu trúc dữ liệu Hessian. Bạn biết PB không? Vì sao PB có hiệu suất cao nhất?
-   Dubbo có những chiến lược nào về cân bằng tải và tính sẵn sàng cao? Còn chiến lược proxy động thì sao?
-   Tư tưởng SPI của Dubbo là gì?
-   Làm thế nào để quản trị dịch vụ, hạ cấp dịch vụ, thử lại khi thất bại và thử lại khi timeout dựa trên Dubbo?
-   Thiết kế tính idempotency cho giao diện dịch vụ phân tán như thế nào (ví dụ không được trừ tiền nhiều lần)?
-   Làm thế nào để bảo đảm thứ tự các yêu cầu trên giao diện dịch vụ phân tán?
-   Làm thế nào để tự thiết kế một khung RPC tương tự Dubbo?

## Khóa phân tán

-   Thiết kế khóa phân tán bằng Redis như thế nào? Có thể dùng zk để thiết kế khóa phân tán không? Trong hai cách triển khai khóa phân tán này, cách nào có hiệu suất cao hơn?

## Giao dịch phân tán

-   Bạn hiểu gì về giao dịch phân tán? Các bạn giải quyết vấn đề giao dịch phân tán như thế nào? Nếu xảy ra tình trạng không thể kết nối mạng trong TCC thì phải làm gì? Tính nhất quán của XA được bảo đảm như thế nào?

## Session phân tán

-   Khi triển khai theo cụm, làm thế nào để triển khai Session phân tán?
