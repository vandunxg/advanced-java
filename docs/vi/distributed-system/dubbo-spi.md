# Cơ chế SPI của Dubbo

## Câu hỏi phỏng vấn

Tư tưởng SPI của Dubbo là gì?

## Phân tích góc nhìn của người phỏng vấn

Tiếp tục hỏi sâu hơn. Sau khi hỏi xong một số kiến thức nền tảng và xác định bạn nắm được những điều cơ bản về Dubbo, người phỏng vấn sẽ hỏi một câu khó hơn một chút về SPI: trước tiên hỏi SPI là gì, sau đó hỏi Dubbo triển khai SPI như thế nào.

Thực ra chỉ muốn xem bạn hiểu Dubbo đến đâu.

## Phân tích câu hỏi phỏng vấn

### SPI là gì?

Nói đơn giản, SPI là viết tắt của `service provider interface`. Ý nghĩa là thế này: giả sử bạn có một giao diện với 3 lớp triển khai, thì khi hệ thống chạy cần chọn lớp triển khai nào cho giao diện đó? Đây là lúc cần SPI: **dựa trên cấu hình được chỉ định** hoặc **cấu hình mặc định** để **tìm lớp triển khai tương ứng**, nạp lớp đó rồi dùng đối tượng được khởi tạo từ lớp triển khai ấy.

Lấy một ví dụ.

Bạn có giao diện A. A1/A2/A3 lần lượt là các lớp triển khai khác nhau của giao diện A. Bạn cấu hình `giao diện A = triển khai A2`; khi hệ thống thực sự chạy, nó sẽ nạp cấu hình của bạn, khởi tạo đối tượng bằng triển khai A2 và dùng đối tượng đó để cung cấp dịch vụ.

Cơ chế SPI thường được dùng ở đâu? **Trong tình huống mở rộng bằng plugin**. Ví dụ, bạn phát triển một framework mã nguồn mở cho người khác sử dụng và muốn họ có thể tự viết plugin để cắm vào framework, qua đó mở rộng một chức năng; lúc này có thể dùng tư tưởng SPI.

### Biểu hiện của tư tưởng SPI trong Java

Một biểu hiện kinh điển của tư tưởng SPI được mọi người sử dụng thường ngày, chẳng hạn JDBC.

Java định nghĩa một bộ giao diện JDBC nhưng không cung cấp lớp triển khai JDBC.

Vậy khi dự án chạy, cần dùng lớp triển khai nào cho giao diện JDBC? Thông thường cần dựa trên **cơ sở dữ liệu mình sử dụng**. Chẳng hạn dùng MySQL thì thêm `mysql-jdbc-connector.jar`; dùng Oracle thì thêm `oracle-jdbc-connector.jar`.

Khi hệ thống chạy và gặp giao diện JDBC mà bạn sử dụng, tầng bên dưới sẽ dùng lớp triển khai được cung cấp trong JAR mà bạn đã thêm.

### Tư tưởng SPI của Dubbo

Dubbo cũng dùng tư tưởng SPI, nhưng không dùng cơ chế SPI của JDK mà tự triển khai một cơ chế SPI riêng.

```java
Protocol protocol = ExtensionLoader.getExtensionLoader(Protocol.class).getAdaptiveExtension();
```

Khi hệ thống chạy, Dubbo sẽ xác định nên chọn lớp triển khai nào của giao diện Protocol để khởi tạo đối tượng sử dụng.

Dubbo sẽ tìm Protocol mà bạn đã cấu hình, nạp lớp triển khai Protocol đó vào JVM rồi khởi tạo đối tượng; sau đó chỉ cần dùng lớp triển khai Protocol của bạn.

Dòng mã trên được dùng rộng rãi trong Dubbo. Với nhiều thành phần, Dubbo giữ lại một giao diện cùng nhiều lớp triển khai, rồi khi hệ thống chạy sẽ tìm lớp triển khai tương ứng theo cấu hình. Nếu bạn không cấu hình thì dùng lớp triển khai mặc định là được.

```java
@SPI("dubbo")
public interface Protocol {

    int getDefaultPort();

    @Adaptive
    <T> Exporter<T> export(Invoker<T> invoker) throws RpcException;

    @Adaptive
    <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException;

    void destroy();

}
```

Trong JAR của chính Dubbo, tệp `/META_INF/dubbo/internal/com.alibaba.dubbo.rpc.Protocol` có nội dung:

```xml
dubbo=com.alibaba.dubbo.rpc.protocol.dubbo.DubboProtocol
http=com.alibaba.dubbo.rpc.protocol.http.HttpProtocol
hessian=com.alibaba.dubbo.rpc.protocol.hessian.HessianProtocol
```

Như vậy có thể thấy cách cơ chế SPI mặc định của Dubbo hoạt động: với giao diện Protocol, `@SPI("dubbo")` cho biết lớp triển khai được cung cấp thông qua cơ chế SPI; lớp triển khai được tìm trong tệp cấu hình theo khóa mặc định là dubbo. Tên tệp cấu hình giống tên đầy đủ của giao diện; dùng khóa dubbo sẽ tìm được lớp triển khai mặc định là `com.alibaba.dubbo.rpc.protocol.dubbo.DubboProtocol`.

Nếu muốn thay thế linh hoạt lớp triển khai mặc định thì cần dùng giao diện `@Adaptive`. Trong giao diện Protocol, có hai phương thức được gắn chú thích `@Adaptive`, nghĩa là hai giao diện đó sẽ được triển khai bằng proxy.

Ý nghĩa là gì?

Ví dụ, hai phương thức của giao diện Protocol được gắn chú thích `@Adaptive`. Khi chạy, một lớp proxy được tạo cho Protocol; hai phương thức của lớp proxy này có mã proxy. Khi thực thi, mã proxy sẽ dựa trên protocol trong URL để lấy khóa tương ứng một cách linh hoạt. Mặc định là dubbo, nhưng bạn cũng có thể tự chỉ định; nếu chỉ định khóa khác thì sẽ lấy đối tượng của lớp triển khai khác.

### Tự mở rộng thành phần trong Dubbo như thế nào?

Dưới đây là cách tự mở rộng thành phần trong Dubbo.

Tự viết một dự án có thể đóng gói thành JAR; bên trong thư mục `src/main/resources`, tạo thư mục `META-INF/services` và đặt một tệp có tên `com.alibaba.dubbo.rpc.Protocol`; trong tệp ghi `my=com.bingo.MyProtocol`. Sau đó đưa JAR của bạn lên kho Nexus riêng.

Tiếp đó, tạo dự án `dubbo provider` và thêm dependency JAR bạn vừa tạo. Trong tệp cấu hình Spring, thêm cấu hình:

```xml
<dubbo:protocol name=”my” port=”20000” />
```

Khi provider khởi động, cấu hình `my=com.bingo.MyProtocol` trong JAR của chúng ta sẽ được nạp; sau đó cấu hình của bạn sẽ khiến Dubbo dùng MyProtocol mà bạn đã định nghĩa. Đây chỉ là giải thích đơn giản: theo cách trên, có thể thay thế nhiều thành phần bên trong Dubbo — chỉ cần thêm JAR của bạn rồi cấu hình.

![dubbo-spi](../../distributed-system/images/dubbo-spi.png)

Dubbo cung cấp nhiều điểm mở rộng tương tự như trên. Muốn mở rộng một chức năng, chỉ cần tự viết một JAR, thêm JAR đó làm dependency cho dự án consumer hoặc provider, rồi đặt tệp có tên tương ứng với giao diện vào đúng thư mục trong JAR và khai báo `key=class triển khai`.

Sau đó, với thành phần tương ứng, chẳng hạn `<dubbo:protocol>`, hãy dùng lớp triển khai ứng với key của bạn để triển khai một giao diện. Bạn có thể tự mở rộng nhiều chức năng của Dubbo và cung cấp phần triển khai riêng.
