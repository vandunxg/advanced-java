# Giao thức tuần tự hóa của Dubbo

## Câu hỏi phỏng vấn

Dubbo hỗ trợ những giao thức giao tiếp và giao thức tuần tự hóa nào? Hãy nói về cấu trúc dữ liệu của Hessian. Bạn biết PB không? Vì sao PB có hiệu suất cao nhất?

## Phân tích góc nhìn của người phỏng vấn

Ở câu hỏi trước, cần trình bày nguyên lý hoạt động cơ bản của Dubbo; đây là điều bắt buộc phải biết. Ít nhất phải biết Dubbo được chia thành những tầng nào, cũng như cách thường gửi yêu cầu RPC — đăng ký, khám phá, gọi dịch vụ — đây là những kiến thức cơ bản.

Sau đó có thể hỏi sâu hơn về tầng bên dưới, chẳng hạn bắt đầu bằng giao thức tuần tự hóa: thông thường RPC hoạt động như thế nào?

## Phân tích câu hỏi phỏng vấn

**Tuần tự hóa** là quá trình chuyển cấu trúc dữ liệu hoặc đối tượng thành chuỗi nhị phân; **giải tuần tự hóa** là quá trình chuyển chuỗi nhị phân được tạo ra khi tuần tự hóa trở lại thành cấu trúc dữ liệu hoặc đối tượng.

![serialize-deserialize](../../distributed-system/images/serialize-deserialize.png)

### Dubbo hỗ trợ nhiều giao thức giao tiếp

-   Giao thức dubbo `dubbo://`

Theo **mặc định**, Dubbo dùng giao thức dubbo, một kết nối dài duy nhất và giao tiếp bất đồng bộ NIO, dựa trên Hessian làm giao thức tuần tự hóa. Giao thức này phù hợp với trường hợp lượng dữ liệu truyền tải nhỏ (mỗi yêu cầu dưới 100kb) nhưng mức đồng thời cao, đồng thời số lượng máy consumer lớn hơn nhiều số lượng máy provider.

Để hỗ trợ mức đồng thời cao, thông thường chỉ có vài máy cung cấp dịch vụ nhưng có hàng trăm máy consumer; lượng lời gọi mỗi ngày có thể lên đến hơn 100 triệu! Khi đó dùng kết nối dài là phù hợp nhất: chỉ cần duy trì một kết nối dài với mỗi consumer, tổng cộng có thể chỉ khoảng 100 kết nối. Sau đó, giao tiếp bất đồng bộ NIO dựa trên các kết nối dài có thể đáp ứng các yêu cầu có mức đồng thời cao.

Nói đơn giản, kết nối dài là kết nối được thiết lập một lần rồi có thể tiếp tục gửi yêu cầu mà không cần thiết lập lại kết nối.

![dubbo-keep-connection](../../distributed-system/images/dubbo-keep-connection.png)

Với kết nối ngắn, cần thiết lập lại kết nối trước mỗi lần gửi yêu cầu.

![dubbo-not-keep-connection](../../distributed-system/images/dubbo-not-keep-connection.png)

-   Giao thức rmi `rmi://`

Giao thức RMI dùng triển khai java.rmi.\* theo chuẩn JDK, sử dụng kết nối ngắn kiểu blocking và cơ chế tuần tự hóa tiêu chuẩn của JDK. Giao thức này dùng nhiều kết nối ngắn, phù hợp khi số lượng consumer và provider xấp xỉ nhau, có thể truyền tệp và thường ít được dùng.

-   Giao thức hessian `hessian://`

Giao thức Hessian 1 dùng để tích hợp dịch vụ Hessian. Tầng bên dưới Hessian giao tiếp qua HTTP, cung cấp dịch vụ bằng Servlet; theo mặc định, Dubbo nhúng Jetty làm máy chủ. Giao thức này dùng tuần tự hóa Hessian và nhiều kết nối ngắn, phù hợp khi số provider nhiều hơn số consumer, có thể truyền tệp và thường ít được dùng.

-   Giao thức http `http://`

Giao thức gọi từ xa dựa trên biểu mẫu HTTP, được triển khai bằng HttpInvoker của Spring. Dùng tuần tự hóa biểu mẫu.

-   Giao thức thrift `thrift://`

Giao thức thrift hiện được Dubbo hỗ trợ là phần mở rộng của giao thức thrift gốc; nó bổ sung một số thông tin tiêu đề vào giao thức gốc, chẳng hạn service name và magic number.

-   webservice `webservice://`

Giao thức gọi từ xa dựa trên WebService, được triển khai bằng frontend-simple và transports-http của Apache CXF. Dùng tuần tự hóa văn bản SOAP.

-   Giao thức memcached `memcached://`

Giao thức RPC được triển khai dựa trên memcached.

-   Giao thức redis `redis://`

Giao thức RPC được triển khai dựa trên Redis.

-   Giao thức rest `rest://`

Hỗ trợ lời gọi REST được triển khai dựa trên Java REST API tiêu chuẩn — JAX-RS 2.0 (viết tắt của Java API for RESTful Web Services).

-   Giao thức gPRC `grpc://`

Dubbo hỗ trợ giao thức gRPC từ phiên bản 2.7.5. Nhà phát triển có kế hoạch dùng giao tiếp HTTP/2 hoặc muốn tận dụng các khả năng của gRPC như Stream, backpressure và lập trình Reactive đều có thể cân nhắc bật giao thức gRPC.

### Các giao thức tuần tự hóa được Dubbo hỗ trợ

Dubbo hỗ trợ nhiều giao thức tuần tự hóa: hession, tuần tự hóa nhị phân Java, json và tuần tự hóa văn bản SOAP. Tuy nhiên, hessian là giao thức tuần tự hóa mặc định.

### Nói về cấu trúc dữ liệu của Hessian

Cơ chế tuần tự hóa đối tượng của Hessian có 8 kiểu nguyên thủy:

-   Dữ liệu nhị phân thô
-   boolean
-   date 64-bit (giá trị thời gian mili giây 64-bit)
-   double 64-bit
-   int 32-bit
-   long 64-bit
-   null
-   string mã hóa UTF-8

Ngoài ra còn có 3 kiểu đệ quy:

-   list cho danh sách và mảng
-   map cho các map và dictionary
-   object cho đối tượng

Còn có một kiểu đặc biệt:

-   ref: dùng để biểu thị tham chiếu đến đối tượng được chia sẻ.

### Vì sao PB có hiệu suất cao nhất?

PB có hiệu năng tốt như vậy chủ yếu nhờ hai điểm: **thứ nhất**, nó dùng trình biên dịch proto để tự động tuần tự hóa và giải tuần tự hóa, tốc độ rất nhanh, được cho là nhanh hơn `XML` và `JSON` từ `20~100` lần; **thứ hai**, khả năng nén dữ liệu tốt, tức là dữ liệu sau khi tuần tự hóa có kích thước nhỏ. Kích thước nhỏ giúp tối ưu băng thông và tốc độ truyền tải.
