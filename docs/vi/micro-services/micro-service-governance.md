# Chiến lược quản trị microservice

## Đăng ký và khám phá dịch vụ

Vấn đề cần giải quyết: quản lý tập trung các dịch vụ

Giải pháp:

-   Eureka
-   Zookeeper

## Cân bằng tải

Vấn đề cần giải quyết: giảm áp lực lên phần cứng máy chủ

Giải pháp:

-   Nginx
-   Ribbon

## Giao tiếp

Vấn đề cần giải quyết: cầu nối giao tiếp giữa các dịch vụ

Giải pháp:

-   REST (đồng bộ)
-   RPC (đồng bộ)
-   MQ (bất đồng bộ)

## Quản lý cấu hình

Vấn đề cần giải quyết: cấu hình tăng lên theo số lượng dịch vụ; làm thế nào để quản lý cấu hình của từng dịch vụ?

Giải pháp:

-   Nacos
-   Spring Cloud Config
-   Apollo

## Chịu lỗi và hạ cấp dịch vụ

Vấn đề cần giải quyết: trong microservice, một yêu cầu thường gọi đến nhiều dịch vụ. Nếu một dịch vụ không khả dụng và không có cơ chế chịu lỗi thì có thể khiến hàng loạt dịch vụ không khả dụng — đây là hiệu ứng tuyết lở.

Giải pháp:

-   Hystrix

## Quan hệ phụ thuộc dịch vụ

Vấn đề cần giải quyết: nhiều dịch vụ phụ thuộc lẫn nhau, thứ tự khởi động không rõ ràng.

Giải pháp: phân tầng ứng dụng.

## Tài liệu dịch vụ

Vấn đề cần giải quyết: giảm chi phí giao tiếp

Giải pháp:

-   Swagger
-   Java doc

## Bảo mật dịch vụ

Vấn đề cần giải quyết: bảo mật dữ liệu nhạy cảm

Giải pháp:

-   Oauth
-   Shiro
-   Spring Security

## Kiểm soát lưu lượng

Vấn đề cần giải quyết: tránh để lưu lượng quá lớn trên một dịch vụ làm sập toàn bộ hệ thống dịch vụ

Giải pháp:

-   Hystrix

## Kiểm thử tự động

Vấn đề cần giải quyết: phát hiện sớm các bất thường, xác định dịch vụ có khả dụng hay không

Giải pháp:

-   junit

## Quy trình đưa dịch vụ vào vận hành và ngừng vận hành

Vấn đề cần giải quyết: tránh tùy tiện đưa dịch vụ vào vận hành hoặc ngừng vận hành

Giải pháp: Dịch vụ mới cần được người quản lý xét duyệt trước khi đưa vào vận hành. Khi ngừng dịch vụ, phải thông báo cho từng bên gọi để họ sửa đổi; chỉ được ngừng dịch vụ khi không còn bên nào gọi đến dịch vụ đó.

## Tương thích

Vấn đề cần giải quyết: làm thế nào duy trì khả năng tương thích khi phát triển dịch vụ liên tục.

Giải pháp: quản lý bằng số phiên bản và kiểm thử hồi quy sau khi hoàn tất chỉnh sửa.

## Điều phối dịch vụ

Vấn đề cần giải quyết: giải quyết vấn đề phụ thuộc dịch vụ

Giải pháp:

-   Docker
-   K8s

## Lập lịch tài nguyên

Vấn đề cần giải quyết: mức sử dụng tài nguyên của mỗi dịch vụ khác nhau; làm thế nào để phân bổ?

Giải pháp:

-   Cô lập JVM
-   Cô lập Classload
-   Cô lập phần cứng

## Lập kế hoạch dung lượng

Vấn đề cần giải quyết: theo thời gian, số lần gọi tăng dần; khi nào cần bổ sung máy?

Giải pháp: thống kê số lần gọi và thời gian phản hồi mỗi ngày, đặt ngưỡng dựa trên tình trạng máy; khi vượt ngưỡng thì có thể bổ sung máy.
