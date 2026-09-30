# Tìm hiểu sâu nguyên lý hoạt động của circuit breaker trong Hystrix

### State machine

Circuit breaker của Hystrix có ba trạng thái: đóng (Closed), mở (Open) và nửa mở (Half-Open). Quan hệ chuyển đổi giữa ba trạng thái như sau:

![image-20191104211642271](./images/hystrix-circuit-breaker-state-machine.png)

1. `Closed` — circuit breaker đóng: request gọi xuống dịch vụ phía dưới được đi qua bình thường
1. `Open` — circuit breaker mở: chặn lời gọi đến dịch vụ phía dưới và chuyển thẳng sang logic Fallback
1. `Half-Open` — circuit breaker ở trạng thái nửa mở: [SleepWindowInMilliseconds](#circuitBreaker.sleepWindowInMilliseconds)

### [Enabled](https://github.com/Netflix/Hystrix/wiki/Configuration#circuitbreakerenabled)

```java
HystrixCommandProperties.Setter()
    .withCircuitBreakerEnabled(boolean)
```

Điều khiển việc circuit breaker có hoạt động hay không, bao gồm theo dõi tình trạng các lời gọi đến dịch vụ phụ thuộc và quyết định có cho phép ngắt mạch khi xảy ra quá nhiều tình huống bất thường hay không. Giá trị mặc định là `true`.

### [circuitBreaker.requestVolumeThreshold](https://github.com/Netflix/Hystrix/wiki/Configuration#circuitbreakerrequestvolumethreshold)

```java
HystrixCommandProperties.Setter()
    .withCircuitBreakerRequestVolumeThreshold(int)
```

Cho biết trong **cửa sổ thời gian trượt dùng cho một lần thống kê (tham số này cũng rất quan trọng, sẽ nói ở phần dưới)** phải có tối thiểu bao nhiêu request thì mới có khả năng kích hoạt ngắt mạch; mặc định là 20. **Lưu lượng đi qua circuit breaker chỉ có thể kích hoạt ngắt mạch sau khi vượt một ngưỡng nhất định.** Ví dụ, yêu cầu lưu lượng qua circuit breaker trong 10 giây phải đạt 20 request, nhưng thực tế chỉ có 19 request đi qua. Dù cả 19 request đều thất bại, hệ thống cũng sẽ không đánh giá có nên ngắt mạch hay không.

### [circuitBreaker.errorThresholdPercentage](https://github.com/Netflix/Hystrix/wiki/Configuration#circuitBreaker.errorThresholdPercentage)

```java
HystrixCommandProperties.Setter()
    .withCircuitBreakerErrorThresholdPercentage(int)
```

Cho biết tỷ lệ lỗi phải đạt bao nhiêu thì mới kích hoạt ngắt mạch; giá trị mặc định là 50(%).

#### [circuitBreaker.sleepWindowInMilliseconds](https://github.com/Netflix/Hystrix/wiki/Configuration#circuitbreakersleepwindowinmilliseconds)

```java
HystrixCommandProperties.Setter()
    .withCircuitBreakerSleepWindowInMilliseconds(int)
```

Khi trạng thái circuit breaker chuyển từ Close sang Open, trong khoảng thời gian `SleepWindowInMilliseconds` tiếp theo, mọi request đi qua circuit breaker đều bị ngắt; không gọi dịch vụ backend mà chuyển thẳng sang cơ chế fallback degradation. Giá trị mặc định là 5000(ms).

Sau khoảng thời gian của tham số này, circuit breaker chuyển sang trạng thái nửa mở `Half-Open` và thử cho một request đi qua để xem lời gọi có hoạt động bình thường không. Nếu lời gọi thành công, circuit breaker tự khôi phục và chuyển sang trạng thái Close.

### [ForceOpen](https://github.com/Netflix/Hystrix/wiki/Configuration#circuitbreakerforceopen)

```java
HystrixCommandProperties.Setter()
    .withCircuitBreakerForceOpen(boolean)
```

Nếu đặt thành true, circuit breaker sẽ bị buộc mở ngay lập tức, tương đương với việc ngắt mạch thủ công và degradation thủ công. Giá trị mặc định là `false`.

### [ForceClosed](https://github.com/Netflix/Hystrix/wiki/Configuration#circuitbreakerforceclosed)

```java
HystrixCommandProperties.Setter()
    .withCircuitBreakerForceClosed(boolean)
```

Nếu đặt thành true, circuit breaker sẽ bị buộc đóng ngay lập tức, tương đương với việc dừng ngắt mạch thủ công và nâng cấp thủ công. Giá trị mặc định là `false`.

### Bộ thống kê Metrics

Một thành phần quan trọng khác phối hợp chặt chẽ với circuit breaker của Hystrix là **bộ thống kê (Metrics)**. Các tham số quan trọng nhất của bộ thống kê là cửa sổ trượt ([metrics.rollingStats.timeInMilliseconds](https://github.com/Netflix/Hystrix/wiki/Configuration#metricsrollingstatstimeinmilliseconds)) và số bucket ([metrics.rollingStats.numBuckets](https://github.com/Netflix/Hystrix/wiki/Configuration#metricsrollingstatsnumbuckets)). Sau đây là một đoạn trích từ [bài viết](https://zhenbianshu.github.io/2018/09/hystrix_configuration_analysis.html) để giải thích cửa sổ trượt (giá trị mặc định là 10000 ms):

> Một hành khách ngồi cạnh cửa sổ trên đoàn tàu đang chạy. Dọc hai bên đường ray là hàng cây bạch dương cao vút; khi tàu tiến về phía trước, những hàng cây ven đường nhanh chóng lướt qua cửa sổ. Nếu mỗi cây tượng trưng cho một request, còn tàu chạy tượng trưng cho thời gian trôi qua, thì cửa sổ trên tàu chính là một cửa sổ trượt điển hình. Những hàng cây mà hành khách nhìn thấy qua cửa sổ là dữ liệu Hystrix cần thống kê.

Hystrix không thống kê ngay khi có một request đi qua. Thay vào đó, toàn bộ cửa sổ trượt được chia đều thành numBuckets phần; cứ mỗi khi thời gian trôi qua một phần, hệ thống lại thống kê một lần. **Chỉ sau khi một cửa sổ thời gian trôi qua, hệ thống mới đánh giá có nên mở circuit breaker hay không; xem ví dụ bên dưới.**

## Ví dụ Demo

### Tham số cấu hình HystrixCommand

Cấu hình các tham số circuit breaker trong Setter của GetProductInfoCommand.

-   Trong cửa sổ trượt, cần tối thiểu 20 request thì mới có thể kích hoạt ngắt mạch.
-   Chỉ kích hoạt ngắt mạch khi tỷ lệ lỗi đạt 40%.
-   Trong 3000ms sau khi ngắt mạch, mọi request đều bị reject và chuyển thẳng sang fallback degradation, không gọi phương thức run(). Sau 3000ms, circuit breaker chuyển sang trạng thái half-open.

Trong phương thức run(), ta kiểm tra productId có bằng -1 hay không; nếu có thì ném exception ngay. Viết như vậy để sau này khi kiểm thử, ta có thể truyền productId=-1 nhằm **mô phỏng lỗi trong lúc dịch vụ thực thi**.

Trong logic degradation, ta chỉ cần trả về sản phẩm dự phòng.

```java
public class GetProductInfoCommand extends HystrixCommand<ProductInfo> {

    private Long productId;

    private static final HystrixCommandKey KEY = HystrixCommandKey.Factory.asKey("GetProductInfoCommand");

    public GetProductInfoCommand(Long productId) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ProductInfoService"))
                .andCommandKey(KEY)
                .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                        // 是否允许断路器工作
                        .withCircuitBreakerEnabled(true)
                        // 滑动窗口中，最少有多少个请求，才可能触发断路
                        .withCircuitBreakerRequestVolumeThreshold(20)
                        // 异常比例达到多少，才触发断路，默认50%
                        .withCircuitBreakerErrorThresholdPercentage(40)
                        // 断路后多少时间内直接reject请求，之后进入half-open状态，默认5000ms
                        .withCircuitBreakerSleepWindowInMilliseconds(3000)));
        this.productId = productId;
    }

    @Override
    protected ProductInfo run() throws Exception {
        System.out.println("调用接口查询商品数据，productId=" + productId);

        if (productId == -1L) {
            throw new Exception();
        }

        String url = "http://localhost:8081/getProductInfo?productId=" + productId;
        String response = HttpClientUtils.sendGetRequest(url);
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

### Lớp kiểm thử circuit breaker

Trong lớp kiểm thử, 30 request đầu tiên truyền productId=-1, sau đó chờ 3 giây rồi gửi 70 request tiếp theo với productId=1.

```java
@SpringBootTest
@RunWith(SpringRunner.class)
public class CircuitBreakerTest {

    @Test
    public void testCircuitBreaker() {
        String baseURL = "http://localhost:8080/getProductInfo?productId=";

        for (int i = 0; i < 30; ++i) {
            // 传入-1，会抛出异常，然后走降级逻辑
            HttpClientUtils.sendGetRequest(baseURL + "-1");
        }

        TimeUtils.sleep(3);
        System.out.println("After sleeping...");

        for (int i = 31; i < 100; ++i) {
            // 传入1，走服务正常调用
            HttpClientUtils.sendGetRequest(baseURL + "1");
        }
    }
}
```

### Kết quả kiểm thử

Từ kết quả kiểm thử, ta có thể thấy rõ toàn bộ quá trình hệ thống ngắt mạch rồi khôi phục.

```java
调用接口查询商品数据，productId=-1
ProductInfo(id=null, name=降级商品, price=null, pictureList=null, specification=null, service=null, color=null, size=null, shopId=null, modifiedTime=null, cityId=null, cityName=null, brandId=null, brandName=null)
// ...
// 这里重复打印了 20 次上面的结果


ProductInfo(id=null, name=降级商品, price=null, pictureList=null, specification=null, service=null, color=null, size=null, shopId=null, modifiedTime=null, cityId=null, cityName=null, brandId=null, brandName=null)
// ...
// 这里重复打印了 8 次上面的结果


// 休眠 3s 后
调用接口查询商品数据，productId=1
ProductInfo(id=1, name=iphone7手机, price=5599.0, pictureList=a.jpg,b.jpg, specification=iphone7的规格, service=iphone7的售后服务, color=红色,白色,黑色, size=5.5, shopId=1, modifiedTime=2017-01-01 12:00:00, cityId=1, cityName=null, brandId=1, brandName=null)
// ...
// 这里重复打印了 69 次上面的结果
```

Trong 30 request đầu tiên, productId truyền vào là -1 nên quá trình thực thi dịch vụ sẽ ném exception. Ta đặt ngưỡng tối thiểu là 20 request đi qua circuit breaker và tỷ lệ lỗi vượt 40% thì kích hoạt ngắt mạch. Vì vậy, API được gọi 21 lần; mỗi lần đều ném exception và đi vào degradation. Sau 21 lần, circuit breaker mở.

9 request tiếp theo sẽ không thực thi phương thức `run()`, nên cũng không in ra thông tin sau:

```c
调用接口查询商品数据，productId=-1
```

Thay vào đó, hệ thống đi thẳng vào logic degradation và gọi getFallback() để thực thi.

Sau khi chờ 3 giây, trong 70 request tiếp theo ta truyền productId=1. Vì trước đó ta đã cấu hình circuit breaker chuyển sang trạng thái `half-open` sau 3000ms, Hystrix sẽ thử thực thi request. Khi nhận thấy request thành công, circuit breaker đóng lại và tất cả request sau đó cũng được gọi bình thường.

### Tài liệu tham khảo

1. [Hystrix issue 1459](https://github.com/Netflix/Hystrix/issues/1459)
1. [Hystrix Metrics](https://github.com/Netflix/Hystrix/wiki/Configuration#metrics)
