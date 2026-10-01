# Bảo vệ an toàn cho lời gọi API dịch vụ bị timeout bằng cơ chế timeout

Thông thường, một vấn đề khá phổ biến khi gọi API của dịch vụ phụ thuộc là **timeout**. Trong hệ thống phân tán phức tạp, timeout có thể khiến hệ thống mất ổn định hoặc chập chờn. Nếu xảy ra nhiều timeout, tài nguyên thread sẽ bị treo, làm throughput giảm mạnh và thậm chí khiến service sập.

Bạn gọi nhiều loại dịch vụ phụ thuộc khác nhau; đặc biệt ở các công ty lớn, thậm chí bạn không biết người phát triển một service là ai, cũng không biết trình độ kỹ thuật của người đó ra sao.

Peter Steiner từng nói: "[On the Internet, nobody knows you're a dog](https://en.wikipedia.org/wiki/On_the_Internet,_nobody_knows_you%27re_a_dog)", nghĩa là ở đầu bên kia Internet, bạn thậm chí không biết liệu đang có một con chó ngồi đó hay không.

![220px-Internet_dog.jpg](../../high-availability/images/220px-Internet_dog.jpg)

Trong các hệ thống phân tán đặc biệt phức tạp, nhất là ở công ty lớn có nhiều đội ngũ và sự phối hợp quy mô lớn, có thể bạn không biết service thuộc về ai; thậm chí người phát triển service có thể chỉ là một thực tập sinh. Hiệu năng API của dịch vụ phụ thuộc có thể rất thiếu ổn định: lúc thì 2ms, lúc thì 200ms, thậm chí 2s.

Nếu không kiểm soát timeout cho các lời gọi đến nhiều API của dịch vụ phụ thuộc để bảo vệ service của mình, service có thể bị kéo sập bởi hiệu năng kém của các dependency. Nhiều API chậm khiến nhiều thread bị kẹt. Nếu đã thực hiện isolation tài nguyên, các thread bị kẹt sẽ nằm trong thread pool; nhưng ta có thể kiểm soát timeout, không cần để tất cả các thread bị kẹt.

## TimeoutMilliseconds

Trong Hystrix, ta có thể tự đặt thời lượng timeout. Nếu command chạy lâu hơn thời lượng đã đặt, Hystrix xem đó là timeout, đánh dấu Hystrix command là timeout và đồng thời thực thi logic fallback/degradation.

Giá trị mặc định của `TimeoutMilliseconds` là 1000, tức 1000ms.

```java
HystrixCommandProperties.Setter()
    ..withExecutionTimeoutInMilliseconds(int)
```

## TimeoutEnabled

Tham số này điều khiển việc có bật cơ chế timeout hay không; giá trị mặc định là true.

```java
HystrixCommandProperties.Setter()
    .withExecutionTimeoutEnabled(boolean)
```

## Demo minh họa

Trong command, ta đặt timeout là 500ms, sau đó đặt thời gian sleep trong phương thức run() là 1 giây. Vì vậy, khi có request, phương thức sẽ sleep 1 giây và logic degradation sẽ được thực thi do timeout.

```java
public class GetProductInfoCommand extends HystrixCommand<ProductInfo> {

    private Long productId;

    private static final HystrixCommandKey KEY = HystrixCommandKey.Factory.asKey("GetProductInfoCommand");

    public GetProductInfoCommand(Long productId) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ProductInfoService"))
                .andCommandKey(KEY)
                .andThreadPoolPropertiesDefaults(HystrixThreadPoolProperties.Setter()
                        .withCoreSize(8)
                        .withMaxQueueSize(10)
                        .withQueueSizeRejectionThreshold(8))
                .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                        .withCircuitBreakerEnabled(true)
                        .withCircuitBreakerRequestVolumeThreshold(20)
                        .withCircuitBreakerErrorThresholdPercentage(40)
                        .withCircuitBreakerSleepWindowInMilliseconds(3000)
                        // Thiết lập có bật timeout hay không, mặc định là true
                        .withExecutionTimeoutEnabled(true)
                        // Thiết lập thời gian timeout, mặc định là 1000(ms)
                        .withExecutionTimeoutInMilliseconds(500)
                        .withFallbackIsolationSemaphoreMaxConcurrentRequests(30)));
        this.productId = productId;
    }

    @Override
    protected ProductInfo run() throws Exception {
        System.out.println("调用接口查询商品数据，productId=" + productId);

        // Tạm dừng 1s
        TimeUtils.sleep(1);

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

Trong lớp kiểm thử, ta gửi request trực tiếp.

```java
@SpringBootTest
@RunWith(SpringRunner.class)
public class TimeoutTest {

    @Test
    public void testTimeout() {
        HttpClientUtils.sendGetRequest("http://localhost:8080/getProductInfo?productId=1");
    }
}
```

Trong kết quả, có thể thấy thông tin liên quan đến sản phẩm fallback đã được in ra.

```c
ProductInfo(id=null, name=降级商品, price=null, pictureList=null, specification=null, service=null, color=null, size=null, shopId=null, modifiedTime=null, cityId=null, cityName=null, brandId=null, brandName=null)
{"id": 1, "name": "iphone7手机", "price": 5599, "pictureList":"a.jpg,b.jpg", "specification": "iphone7的规格", "service": "iphone7的售后服务", "color": "红色,白色,黑色", "size": "5.5", "shopId": 1, "modifiedTime": "2017-01-01 12:00:00", "cityId": 1, "brandId": 1}
```
