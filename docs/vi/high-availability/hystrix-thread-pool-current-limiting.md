# Tìm hiểu sâu về isolation thread pool và rate limit API của Hystrix

Phần trước đã trình bày request cache, fallback degradation mềm mại và circuit breaker ngắt mạch nhanh của Hystrix. Trong bài này, chúng ta sẽ tìm hiểu chi tiết về isolation thread pool và rate limit API của Hystrix.

![hystrix-process](./images/hystrix-process.png)

Hystrix kiểm tra thread pool hoặc semaphore có đầy hay không; request vượt quá dung lượng sẽ bị Reject và đi vào degradation trực tiếp, nhờ đó thực hiện được rate limit.

Rate limit là giới hạn lưu lượng truy cập vào service backend. Ví dụ, giới hạn việc truy cập tài nguyên của MySQL, Redis, ZooKeeper và nhiều middleware backend khác nhằm tránh để lưu lượng quá lớn đánh sập service backend.

## Thiết kế kỹ thuật isolation thread pool

Hystrix sử dụng kỹ thuật Bulkhead Partition (isolation khoang tàu) để cô lập tài nguyên của các dependency bên ngoài, qua đó ngăn sự cố ở bất kỳ dependency bên ngoài nào khiến service hiện tại sập.

**Isolation khoang tàu** là việc chia không gian bên trong thân tàu thành nhiều khoang. Nếu một vài khoang bị thủng và nước tràn vào, dòng nước sẽ không chảy qua lại giữa các khoang. Nhờ vậy, khi tàu bị hư hại, tàu vẫn có đủ lực nổi và độ ổn định để giảm nguy cơ chìm ngay lập tức.

![bulkhead-partition](./images/bulkhead-partition.jpg)

Hystrix dùng một thread pool riêng cho mỗi dependency bên ngoài. Vì vậy, nếu lời gọi đến dependency đó bị trễ nghiêm trọng thì nhiều nhất chỉ thread pool của dependency đó bị cạn; các lời gọi đến dependency khác không bị ảnh hưởng.

## Các tình huống áp dụng thread pool của Hystrix

-   Mỗi service gọi hàng chục dependency backend; những dependency backend này thường do nhiều team khác nhau phát triển.
-   Mỗi dependency backend đều cung cấp thư viện client riêng để gọi, chẳng hạn nếu dùng thrift thì sẽ có dependency thrift tương ứng.
-   Thư viện client có thể thay đổi bất cứ lúc nào.
-   Thư viện client có thể thêm logic request mạng mới bất cứ lúc nào.
-   Thư viện client có thể chứa logic như tự động retry, phân tích dữ liệu và cache trong bộ nhớ.
-   Thư viện client thường là hộp đen đối với bên gọi, bao gồm chi tiết triển khai, truy cập mạng, cấu hình mặc định, v.v.
-   Trong môi trường production thực tế, thường xảy ra tình huống bên gọi bất ngờ phát hiện một số thay đổi trong thư viện client.
-   Ngay cả khi thư viện client không thay đổi, bản thân dependency cũng có thể thay đổi logic.
-   Một số thư viện client của dependency có thể kéo theo các thư viện dependency khác; cấu hình của những thư viện đó có thể không chính xác.
-   Phần lớn request mạng đều được gọi đồng bộ.
-   Lỗi và độ trễ khi gọi cũng có thể xảy ra ngay trong code của thư viện client, không nhất thiết nằm ở request mạng.

Nói đơn giản, phải mặc định rằng thư viện client không đáng tin cậy và có thể thay đổi theo nhiều cách bất cứ lúc nào. Vì vậy cần isolation bắt buộc để đảm bảo sự cố của bất kỳ service nào không ảnh hưởng đến service hiện tại.

## Ưu điểm của cơ chế thread pool

-   Mỗi dependency có thể được cô lập trong thread pool riêng; kể cả khi thread pool đó đã hết tài nguyên cũng không ảnh hưởng đến lời gọi service nào khác.
-   Có thể thêm dependency mới vào service bất cứ lúc nào; ngay cả khi dependency mới này có vấn đề, nó cũng không ảnh hưởng đến lời gọi service nào khác.
-   Khi dependency gặp lỗi hoạt động bình thường trở lại, có thể khôi phục lời gọi service ngay lập tức bằng cách dọn thread pool. Nếu thread pool của tomcat đã bị chiếm hết thì việc khôi phục sẽ phức tạp hơn nhiều.
-   Nếu cấu hình thư viện client có vấn đề, tình trạng thread pool sẽ được báo cáo bất cứ lúc nào, chẳng hạn thống kê số lần thành công/thất bại/từ chối/timeout. Sau đó có thể thay đổi nóng cấu hình gọi dependency gần thời gian thực mà không cần dừng service.
-   Dựa trên bản chất bất đồng bộ của thread pool, có thể xây dựng một lớp gọi bất đồng bộ trên nền các lời gọi đồng bộ.

Nói đơn giản, ưu điểm lớn nhất là isolation tài nguyên, đảm bảo sự cố ở bất kỳ dependency nào cũng không kéo sập service hiện tại.

## Nhược điểm của cơ chế thread pool

-   Nhược điểm lớn nhất của thread pool là làm tăng chi phí CPU.<br>
    Ngoài các thread gọi vốn có của tomcat còn có thread pool do chính Hystrix quản lý.

-   Mỗi command được thực thi dựa trên một thread riêng, nên sẽ có xếp hàng, lập lịch và chuyển đổi context.
-   Chính Hystrix đã thống kê chi phí phát sinh do bất đồng bộ đa luồng; kết quả được suy ra bằng cách so sánh lời gọi bất đồng bộ đa luồng + lời gọi đồng bộ. Mỗi ngày Netflix API thực hiện 1 tỷ lời gọi thông qua Hystrix; mỗi service instance có hơn 40 thread pool, mỗi thread pool có khoảng 10 thread. Cuối cùng, người ta nhận thấy chi phí phát sinh khi dùng Hystrix là độ trễ khoảng 3ms cho mỗi request, tối đa không quá 10ms. So với mức cải thiện availability và stability, đây là chi phí có thể chấp nhận được.

Có thể dùng kỹ thuật semaphore của Hystrix để giới hạn số lời gọi đồng thời đến một dependency, thay vì giới hạn lưu lượng bằng kích thước thread pool/queue.

Kỹ thuật semaphore có thể dùng để rate limit và giảm đỉnh lưu lượng, nhưng không thể dùng để timeout và isolation các service có lời gọi bị trễ.

Nếu đặt `execution.isolation.strategy` thành `SEMAPHORE`, Hystrix sẽ dùng cơ chế semaphore thay cho thread pool để rate limit việc truy cập dependency. Nếu lời gọi mạng bên dưới bị trễ nghiêm trọng khi sử dụng semaphore thì không thể timeout; lời gọi chỉ có thể tiếp tục block. Ngay khi số request vượt số lượng semaphore giới hạn, rate limit sẽ được kích hoạt.

## Demo rate limit API

Giả sử kích thước thread pool là 8 và queue chờ có kích thước 10. Ta đặt thời lượng timeout dài hơn, là 20 giây.

Bên trong command, viết code cố định để sleep, chẳng hạn sleep 3 giây.

-   withCoreSize: đặt kích thước thread pool.
-   withMaxQueueSize: đặt kích thước queue chờ.
-   withQueueSizeRejectionThreshold: tham số này dùng cùng với withMaxQueueSize; kích thước queue chờ được lấy bằng giá trị nhỏ hơn trong hai tham số.

Nếu chỉ đặt kích thước thread pool mà không đặt hai tham số liên quan đến queue còn lại, queue chờ sẽ ở trạng thái tắt.

```java
public class GetProductInfoCommand extends HystrixCommand<ProductInfo> {

    private Long productId;

    private static final HystrixCommandKey KEY = HystrixCommandKey.Factory.asKey("GetProductInfoCommand");

    public GetProductInfoCommand(Long productId) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ProductInfoService"))
                .andCommandKey(KEY)
                // 线程池相关配置信息
                .andThreadPoolPropertiesDefaults(HystrixThreadPoolProperties.Setter()
                        // 设置线程池大小为8
                        .withCoreSize(8)
                        // 设置等待队列大小为10
                        .withMaxQueueSize(10)
                        .withQueueSizeRejectionThreshold(12))
                .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                        .withCircuitBreakerEnabled(true)
                        .withCircuitBreakerRequestVolumeThreshold(20)
                        .withCircuitBreakerErrorThresholdPercentage(40)
                        .withCircuitBreakerSleepWindowInMilliseconds(3000)
                        // 设置超时时间
                        .withExecutionTimeoutInMilliseconds(20000)
                        // 设置fallback最大请求并发数
                        .withFallbackIsolationSemaphoreMaxConcurrentRequests(30)));
        this.productId = productId;
    }

    @Override
    protected ProductInfo run() throws Exception {
        System.out.println("调用接口查询商品数据，productId=" + productId);

        if (productId == -1L) {
            throw new Exception();
        }

        // 请求过来，会在这里hang住3秒钟
        if (productId == -2L) {
            TimeUtils.sleep(3);
        }

        String url = "http://localhost:8081/getProductInfo?productId=" + productId;
        String response = HttpClientUtils.sendGetRequest(url);
        System.out.println(response);
        return JSONObject.parseObject(response, ProductInfo.class);
    }

    @Override
    protected ProductInfo getFallback() {
        ProductInfo productInfo = new ProductInfo();
        productInfo.setName("降级商品");
        return productInfo;
    }
}
```

Ta mô phỏng 25 request. 8 request đầu tiên sẽ bị treo trong 3 giây khi gọi API; 10 request tiếp theo sẽ vào queue chờ các request trước thực thi xong. 7 request cuối cùng đến sẽ bị reject trực tiếp và gọi logic fallback degradation.

```java
@SpringBootTest
@RunWith(SpringRunner.class)
public class RejectTest {

    @Test
    public void testReject() {
        for (int i = 0; i < 25; ++i) {
            new Thread(() -> HttpClientUtils.sendGetRequest("http://localhost:8080/getProductInfo?productId=-2")).start();
        }
        // 防止主线程提前结束执行
        TimeUtils.sleep(50);
    }
}
```

Từ kết quả thực thi, có thể thấy rõ tổng cộng 7 sản phẩm degradation được in ra. Đó là kết quả của việc số request vượt quá dung lượng thread pool + queue nên bị reject trực tiếp.

```c
ProductInfo(id=null, name=降级商品, price=null, pictureList=null, specification=null, service=null, color=null, size=null, shopId=null, modifiedTime=null, cityId=null, cityName=null, brandId=null, brandName=null)
ProductInfo(id=null, name=降级商品, price=null, pictureList=null, specification=null, service=null, color=null, size=null, shopId=null, modifiedTime=null, cityId=null, cityName=null, brandId=null, brandName=null)
ProductInfo(id=null, name=降级商品, price=null, pictureList=null, specification=null, service=null, color=null, size=null, shopId=null, modifiedTime=null, cityId=null, cityName=null, brandId=null, brandName=null)
ProductInfo(id=null, name=降级商品, price=null, pictureList=null, specification=null, service=null, color=null, size=null, shopId=null, modifiedTime=null, cityId=null, cityName=null, brandId=null, brandName=null)
ProductInfo(id=null, name=降级商品, price=null, pictureList=null, specification=null, service=null, color=null, size=null, shopId=null, modifiedTime=null, cityId=null, cityName=null, brandId=null, brandName=null)
ProductInfo(id=null, name=降级商品, price=null, pictureList=null, specification=null, service=null, color=null, size=null, shopId=null, modifiedTime=null, cityId=null, cityName=null, brandId=null, brandName=null)
调用接口查询商品数据，productId=-2
调用接口查询商品数据，productId=-2
调用接口查询商品数据，productId=-2
调用接口查询商品数据，productId=-2
调用接口查询商品数据，productId=-2
调用接口查询商品数据，productId=-2
调用接口查询商品数据，productId=-2
调用接口查询商品数据，productId=-2
ProductInfo(id=null, name=降级商品, price=null, pictureList=null, specification=null, service=null, color=null, size=null, shopId=null, modifiedTime=null, cityId=null, cityName=null, brandId=null, brandName=null)
{"id": -2, "name": "iphone7手机", "price": 5599, "pictureList":"a.jpg,b.jpg", "specification": "iphone7的规格", "service": "iphone7的售后服务", "color": "红色,白色,黑色", "size": "5.5", "shopId": 1, "modifiedTime": "2017-01-01 12:00:00", "cityId": 1, "brandId": 1}
// 后面都是一些正常的商品信息，就不贴出来了
// ...
```
