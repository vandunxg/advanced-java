# Nguyên lý hoạt động của Dubbo

## Câu hỏi phỏng vấn

Hãy trình bày nguyên lý hoạt động của Dubbo. Nếu registry bị sập thì các dịch vụ có thể tiếp tục giao tiếp không? Hãy kể quy trình của một yêu cầu RPC.

## Phân tích góc nhìn của người phỏng vấn

MQ, ES, Redis, Dubbo: trước tiên thường hỏi một số **câu hỏi cần suy nghĩ** và **nguyên lý**, chẳng hạn nguyên lý kiến trúc khả dụng cao của Kafka, nguyên lý kiến trúc phân tán của ES, nguyên lý mô hình luồng của Redis, nguyên lý hoạt động của Dubbo. Sau đó là một số vấn đề có thể gặp trong môi trường production, vì khi đưa từng công nghệ vào sử dụng đều có thể gặp vấn đề. Tiếp theo là câu hỏi tổng hợp về thiết kế hệ thống, chẳng hạn thiết kế MQ, công cụ tìm kiếm, cache hay một khung RPC.

Đã bắt đầu nói về hệ thống phân tán thì đương nhiên trước tiên sẽ tập trung vào Dubbo. Trên thực tế, Dubbo là tiêu chuẩn khung RPC của hệ thống phân tán tại phần lớn công ty hiện nay; dựa trên Dubbo cũng có thể xây dựng cả một kiến trúc microservice, nhưng cần tự phát triển khá nhiều.

Tất nhiên, từ năm ngoái Spring Cloud rất phổ biến và nhiều công ty bắt đầu chuyển sang Spring Cloud. Dù sao Spring Cloud cũng là một bộ công cụ đầy đủ cho kiến trúc microservice. Tuy nhiên, nhiều công ty vẫn dùng Dubbo nên Dubbo chắc chắn vẫn là trọng tâm phỏng vấn hiện nay. Hơn nữa, Dubbo đã khởi động lại hoạt động duy trì cộng đồng mã nguồn mở và được chuyển giao cho Apache; trong tương lai Dubbo vẫn có thể có thị trường và vị thế nhất định.

Đã nói về Dubbo thì chắc chắn bắt đầu từ nguyên lý hoạt động của Dubbo. Trước tiên hãy nói về kiến trúc mà Dubbo dùng để hỗ trợ lời gọi RPC phân tán, rồi trình bày cách Dubbo thực hiện một yêu cầu RPC, đúng không?

## Phân tích câu hỏi phỏng vấn

### Nguyên lý hoạt động của Dubbo

-   Tầng thứ nhất: tầng service, tầng interface do provider và consumer triển khai.
-   Tầng thứ hai: tầng config, tầng cấu hình, chủ yếu dùng để thực hiện các cấu hình khác nhau cho Dubbo.
-   Tầng thứ ba: tầng proxy, tầng proxy dịch vụ. Dù là consumer hay provider, Dubbo đều tạo proxy; các proxy giao tiếp mạng với nhau.
-   Tầng thứ tư: tầng registry, tầng đăng ký dịch vụ, chịu trách nhiệm đăng ký dịch vụ và service discovery.
-   Tầng thứ năm: tầng cluster, tầng cụm, đóng gói định tuyến và cân bằng tải cho nhiều provider, kết hợp nhiều instance thành một dịch vụ.
-   Tầng thứ sáu: tầng monitor, tầng giám sát, theo dõi số lần gọi và thời gian gọi các interface RPC.
-   Tầng thứ bảy: tầng protocal, tầng gọi từ xa, đóng gói lời gọi RPC.
-   Tầng thứ tám: tầng exchange, tầng trao đổi thông tin, đóng gói mô hình request-response và chuyển từ đồng bộ sang bất đồng bộ.
-   Tầng thứ chín: tầng transport, tầng truyền tải mạng, trừu tượng hóa Mina và Netty thành một giao diện thống nhất.
-   Tầng thứ mười: tầng serialize, tầng tuần tự hóa dữ liệu.

### Quy trình hoạt động

-   Bước thứ nhất: provider đăng ký với registry.
-   Bước thứ hai: consumer đăng ký nhận dịch vụ từ registry; registry sẽ thông báo cho consumer về các dịch vụ đã đăng ký.
-   Bước thứ ba: consumer gọi provider.
-   Bước thứ tư: consumer và provider đều thông báo bất đồng bộ cho trung tâm giám sát.

![dubbo-operating-principle](../../distributed-system/images/dubbo-operating-principle.png)

### Nếu registry bị sập thì các dịch vụ có thể tiếp tục giao tiếp không?

Được, vì trong quá trình khởi tạo ban đầu, consumer sẽ **tải địa chỉ của provider và các thông tin khác vào cache cục bộ**; do đó, khi registry bị sập, các dịch vụ vẫn có thể tiếp tục giao tiếp.
