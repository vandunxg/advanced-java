# Nguyên lý hoạt động của Dubbo

## Câu hỏi phỏng vấn

Hãy trình bày nguyên lý hoạt động của Dubbo. Nếu trung tâm đăng ký bị lỗi thì các dịch vụ có thể tiếp tục giao tiếp không? Hãy kể quy trình của một yêu cầu RPC.

## Phân tích góc nhìn của người phỏng vấn

MQ, ES, Redis, Dubbo: trước tiên thường hỏi một số **câu hỏi cần suy nghĩ** và **nguyên lý**, chẳng hạn nguyên lý kiến trúc khả dụng cao của Kafka, nguyên lý kiến trúc phân tán của Elasticsearch, nguyên lý mô hình luồng của Redis, nguyên lý hoạt động của Dubbo. Sau đó là một số vấn đề có thể gặp trong môi trường production, vì khi đưa từng công nghệ vào sử dụng đều có thể gặp vấn đề. Tiếp theo là câu hỏi tổng hợp về thiết kế hệ thống, chẳng hạn thiết kế MQ, công cụ tìm kiếm, cache hay một khung RPC.

Đã bắt đầu nói về hệ thống phân tán thì đương nhiên trước tiên sẽ tập trung vào Dubbo. Xét trên thực tế, Dubbo là tiêu chuẩn khung RPC của hệ thống phân tán tại phần lớn công ty hiện nay; dựa trên Dubbo cũng có thể xây dựng toàn bộ kiến trúc microservice, nhưng cần tự phát triển khá nhiều.

Tất nhiên, từ năm ngoái Spring Cloud rất nổi bật và nhiều công ty bắt đầu chuyển sang Spring Cloud. Dù sao Spring Cloud cũng là bộ công cụ đầy đủ cho kiến trúc microservice. Tuy nhiên, nhiều công ty vẫn dùng Dubbo nên Dubbo chắc chắn vẫn là trọng tâm phỏng vấn hiện nay. Hơn nữa, cộng đồng mã nguồn mở Dubbo đã hoạt động trở lại và được trao tặng cho Apache; trong tương lai Dubbo vẫn có thể có thị trường và vị thế nhất định.

Đã nói về Dubbo thì chắc chắn bắt đầu từ nguyên lý hoạt động của Dubbo. Trước tiên hãy nói về kiến trúc mà Dubbo dùng để hỗ trợ lời gọi RPC phân tán, rồi trình bày cách Dubbo thực hiện một yêu cầu RPC, đúng không?

## Phân tích câu hỏi phỏng vấn

### Nguyên lý hoạt động của Dubbo

-   Tầng thứ nhất: tầng service, tầng giao diện để nhà cung cấp dịch vụ và consumer triển khai.
-   Tầng thứ hai: tầng config, tầng cấu hình, chủ yếu dùng để cấu hình nhiều thành phần của Dubbo.
-   Tầng thứ ba: tầng proxy, tầng proxy dịch vụ. Dù là consumer hay provider, Dubbo đều tạo proxy; các proxy giao tiếp mạng với nhau.
-   Tầng thứ tư: tầng registry, tầng đăng ký dịch vụ, chịu trách nhiệm đăng ký và khám phá dịch vụ.
-   Tầng thứ năm: tầng cluster, tầng cụm, đóng gói định tuyến và cân bằng tải cho nhiều nhà cung cấp dịch vụ, kết hợp nhiều instance thành một dịch vụ.
-   Tầng thứ sáu: tầng monitor, tầng giám sát, theo dõi số lần gọi và thời gian gọi các giao diện RPC.
-   Tầng thứ bảy: tầng protocal, tầng gọi từ xa, đóng gói lời gọi RPC.
-   Tầng thứ tám: tầng exchange, tầng trao đổi thông tin, đóng gói mô hình yêu cầu phản hồi và chuyển đồng bộ thành bất đồng bộ.
-   Tầng thứ chín: tầng transport, tầng truyền tải mạng, trừu tượng hóa Mina và Netty thành một giao diện thống nhất.
-   Tầng thứ mười: tầng serialize, tầng tuần tự hóa dữ liệu.

### Quy trình hoạt động

-   Bước thứ nhất: provider đăng ký với trung tâm đăng ký.
-   Bước thứ hai: consumer đăng ký nhận dịch vụ từ trung tâm đăng ký; trung tâm đăng ký sẽ thông báo cho consumer về các dịch vụ đã đăng ký.
-   Bước thứ ba: consumer gọi provider.
-   Bước thứ tư: consumer và provider đều thông báo bất đồng bộ cho trung tâm giám sát.

![dubbo-operating-principle](../../distributed-system/images/dubbo-operating-principle.png)

### Nếu trung tâm đăng ký bị lỗi thì các dịch vụ có thể tiếp tục giao tiếp không?

Được, vì trong quá trình khởi tạo ban đầu, consumer sẽ **tải địa chỉ của provider và các thông tin khác vào cache cục bộ**; do đó, khi trung tâm đăng ký bị lỗi, các dịch vụ vẫn có thể tiếp tục giao tiếp.
