# Quản trị dịch vụ dựa trên Dubbo như thế nào?

## Câu hỏi phỏng vấn

Quản trị dịch vụ, hạ cấp dịch vụ, thử lại khi thất bại và thử lại khi timeout dựa trên Dubbo như thế nào?

## Phân tích góc nhìn của người phỏng vấn

Nếu được hỏi về quản trị dịch vụ thì thực ra người phỏng vấn muốn xem bạn có tư duy về **quản trị dịch vụ** hay không, vì đây là vấn đề chắc chắn gặp phải khi làm việc với microservice phức tạp.

**Hạ cấp dịch vụ** là chủ đề thiết yếu trong hệ thống phân tán phức tạp. Các hệ thống phân tán gọi lẫn nhau; nếu bất kỳ hệ thống nào gặp lỗi mà bạn không hạ cấp thì toàn bộ hệ thống sụp đổ sao? Như vậy thật tai hại.

**Thử lại khi thất bại**: yêu cầu mạng trong hệ thống phân tán diễn ra thường xuyên như vậy; nếu vô tình thất bại một lần do vấn đề mạng thì có nên thử lại không?

**Thử lại khi timeout**: cũng tương tự như trên, nếu mạng chậm một chút và bị timeout thì thử lại như thế nào?

## Phân tích câu hỏi phỏng vấn

### Quản trị dịch vụ

#### 1. Tự động tạo chuỗi gọi

Trong một hệ thống phân tán lớn, hay nói theo kiến trúc microservice phổ biến hiện nay, **hệ thống phân tán gồm rất nhiều dịch vụ**. Vậy các dịch vụ gọi lẫn nhau như thế nào? Chuỗi gọi ra sao? Thành thật mà nói, về sau hầu như không ai nắm rõ được nữa vì có quá nhiều dịch vụ, có thể lên đến hàng trăm hoặc thậm chí hàng nghìn.

Vì vậy, trong hệ thống phân tán dựa trên Dubbo cần tự động ghi lại các lời gọi giữa những dịch vụ, rồi tự động tạo ra **mối quan hệ phụ thuộc và chuỗi gọi giữa các dịch vụ**, thể hiện chúng thành sơ đồ để mọi người có thể theo dõi.

![dubbo-service-invoke-road](./images/dubbo-service-invoke-road.png)

#### 2. Thống kê áp lực truy cập và thời gian xử lý dịch vụ

Cần tự động thống kê **số lần gọi và độ trễ truy cập giữa từng giao diện và dịch vụ**, đồng thời chia thành hai cấp độ.

-   Cấp độ thứ nhất là chi tiết giao diện: mỗi giao diện của mỗi dịch vụ được gọi bao nhiêu lần mỗi ngày, độ trễ yêu cầu ở các mốc TP50/TP90/TP99 là bao nhiêu;
-   Cấp độ thứ hai bắt đầu từ điểm vào ban đầu: sau khi một chuỗi yêu cầu hoàn chỉnh đi qua hàng chục dịch vụ và xử lý xong yêu cầu, mỗi ngày toàn chuỗi chạy bao nhiêu lần, độ trễ yêu cầu toàn chuỗi ở các mốc TP50/TP90/TP99 lần lượt là bao nhiêu.

Sau khi giải quyết những việc này thì mới có thể xem áp lực chính của hệ thống hiện ở đâu, cần mở rộng và tối ưu như thế nào.

#### 3. Khác

-   Phân tầng dịch vụ (tránh phụ thuộc vòng)
-   Giám sát và cảnh báo khi chuỗi gọi dịch vụ thất bại
-   Xác thực dịch vụ
-   Giám sát tính sẵn sàng của từng dịch vụ (tỷ lệ gọi giao diện thành công? Bao nhiêu số 9? 99.99%, 99.9%, 99%)

### Hạ cấp dịch vụ

Ví dụ, dịch vụ A gọi dịch vụ B nhưng B bị dừng hoạt động. A thử gọi B vài lần vẫn thất bại; khi đó hạ cấp trực tiếp, chuyển sang logic dự phòng và trả về phản hồi cho người dùng.

Lấy một ví dụ, chúng ta có giao diện `HelloService` và `HelloServiceImpl` cung cấp phần triển khai cụ thể cho giao diện đó.

```java
public interface HelloService {
   void sayHello();
}

public class HelloServiceImpl implements HelloService {
    public void sayHello() {
        System.out.println("hello world......");
    }
}
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
    xsi:schemaLocation="http://www.springframework.org/schema/beans        http://www.springframework.org/schema/beans/spring-beans.xsd        http://code.alibabatech.com/schema/dubbo        http://code.alibabatech.com/schema/dubbo/dubbo.xsd">

    <dubbo:application name="dubbo-provider" />
    <dubbo:registry address="zookeeper://127.0.0.1:2181" />
    <dubbo:protocol name="dubbo" port="20880" />
    <dubbo:service interface="com.zhss.service.HelloService" ref="helloServiceImpl" timeout="10000" />
    <bean id="helloServiceImpl" class="com.zhss.service.HelloServiceImpl" />

</beans>

<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
    xsi:schemaLocation="http://www.springframework.org/schema/beans        http://www.springframework.org/schema/beans/spring-beans.xsd        http://code.alibabatech.com/schema/dubbo        http://code.alibabatech.com/schema/dubbo/dubbo.xsd">

    <dubbo:application name="dubbo-consumer"  />

    <dubbo:registry address="zookeeper://127.0.0.1:2181" />

    <dubbo:reference id="fooService" interface="com.test.service.FooService"  timeout="10000" check="false" mock="return null">
    </dubbo:reference>

</beans>

```

Khi gọi giao diện thất bại, có thể dùng `mock` để thống nhất trả về null.

Giá trị `mock` cũng có thể đổi thành true; sau đó triển khai một lớp Mock trong cùng đường dẫn với giao diện, đặt tên theo quy tắc “tên giao diện + hậu tố `Mock`”. Rồi triển khai logic hạ cấp riêng trong lớp Mock.

```java
public class HelloServiceMock implements HelloService {
    public void sayHello() {
        // 降级逻辑
    }
}
```

### Thử lại khi thất bại và thử lại khi timeout

Thử lại khi thất bại nghĩa là nếu consumer gọi provider thất bại, chẳng hạn phát sinh ngoại lệ, thì có thể thử lại; nếu lời gọi timeout thì cũng có thể thử lại. Cấu hình như sau:

```xml
<dubbo:reference id="xxxx" interface="xx" check="true" async="false" retries="3" timeout="2000"/>
```

Lấy một ví dụ.

Một giao diện của dịch vụ cần 5 giây để xử lý; bạn không thể cứ ngồi chờ. Sau khi cấu hình timeout, bạn chờ 2 giây; nếu chưa có kết quả thì dừng chờ, không thể đợi mãi.

Có thể trình bày cách đặt các tham số này theo tình huống cụ thể ở công ty bạn:

-   `timeout`: thường đặt là `200ms`; chúng tôi cho rằng không nên quá `200ms` mà vẫn chưa có phản hồi.
-   `retries`: đặt số retries; thường dùng với yêu cầu đọc, chẳng hạn khi cần truy vấn dữ liệu, có thể cấu hình retries. Nếu lần đọc đầu tiên không thành công và báo lỗi thì thử đọc lại theo số lần đã chỉ định.
