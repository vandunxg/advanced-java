# Cơ chế fallback degradation dựa trên cache cục bộ

Hystrix sẽ gọi cơ chế fallback degradation trong bốn trường hợp sau:

-   Circuit breaker đang ở trạng thái mở.
-   Resource pool đã đầy (thread pool + queue / semaphore).
-   Khi Hystrix gọi nhiều API khác nhau hoặc truy cập dependency bên ngoài như MySQL, Redis, ZooKeeper, Kafka, v.v., xảy ra bất kỳ exception nào.
-   Khi truy cập dependency bên ngoài mất quá nhiều thời gian và phát sinh exception TimeoutException.

## Hai cơ chế degradation phổ biến nhất

-   Dữ liệu thuần trong bộ nhớ<br>
    Trong logic degradation, có thể duy trì một ehcache trong bộ nhớ, làm cache thuần bộ nhớ tự động dọn dẹp theo LRU để lưu dữ liệu. Nếu dependency bên ngoài gặp lỗi, fallback sẽ thử lấy dữ liệu trực tiếp từ ehcache.

-   Giá trị mặc định<br>
    Trong logic fallback degradation, cũng có thể trả về trực tiếp một giá trị mặc định.

Trong `HystrixCommand`, logic degradation được viết bằng cách triển khai interface getFallback(); còn trong `HystrixObservableCommand`, cần triển khai phương thức resumeWithFallback().

Sau đây là một ví dụ đơn giản minh họa cách thực hiện fallback degradation.

Ví dụ, xét **tình huống** sau. Ta có dữ liệu sản phẩm bao gồm brandId. Giả sử logic bình thường là lấy dữ liệu sản phẩm, dựa vào brandId để gọi API của dịch vụ thương hiệu và lấy tên mới nhất của thương hiệu, brandName.

Nếu API dịch vụ thương hiệu ngừng hoạt động, ta có thể thử lấy một bản dữ liệu hơi cũ từ bộ nhớ cục bộ để tạm sử dụng.

## Bước 1: Lấy dữ liệu từ cache cục bộ

Code lấy tên thương hiệu từ cục bộ đại khái như sau.

```java
/**
 * 品牌名称本地缓存
 *
 */
public class BrandCache {

    private static Map<Long, String> brandMap = new HashMap<>();

    static {
        brandMap.put(1L, "Nike");
    }

    /**
     * brandId 获取 brandName
     *
     * @param brandId 品牌id
     * @return 品牌名
     */
    public static String getBrandName(Long brandId) {
        return brandMap.get(brandId);
    }
```

## Bước 2: Triển khai GetBrandNameCommand

Trong GetBrandNameCommand, logic thông thường của phương thức run() là gọi API của dịch vụ thương hiệu để lấy tên thương hiệu. Nếu lời gọi thất bại và phát sinh lỗi, cơ chế fallback degradation sẽ được gọi.

Ở đây, ta **mô phỏng API gọi bị lỗi** bằng cách ném một exception.

Còn trong phương thức getFallback() là **logic degradation**; ta lấy dữ liệu **tên thương hiệu** trực tiếp từ cache cục bộ.

```java
/**
 * 获取品牌名称的command
 *
 */
public class GetBrandNameCommand extends HystrixCommand<String> {

    private Long brandId;

    public GetBrandNameCommand(Long brandId) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("BrandService"))
                .andCommandKey(HystrixCommandKey.Factory.asKey("GetBrandNameCommand"))
                .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                        // 设置降级机制最大并发请求数
                        .withFallbackIsolationSemaphoreMaxConcurrentRequests(15)));
        this.brandId = brandId;
    }

    @Override
    protected String run() throws Exception {
        // 这里正常的逻辑应该是去调用一个品牌服务的接口获取名称
        // 如果调用失败，报错了，那么就会去调用fallback降级机制

        // 这里我们直接模拟调用报错，抛出异常
        throw new Exception();
    }

    @Override
    protected String getFallback() {
        return BrandCache.getBrandName(brandId);
    }
}
```

`FallbackIsolationSemaphoreMaxConcurrentRequests` dùng để đặt số lượng request đồng thời tối đa được phép cho fallback; giá trị mặc định là 10 và giới hạn bằng cơ chế semaphore. Nếu vượt quá giá trị tối đa này, request sẽ bị reject ngay.

## Bước 3: CacheController gọi API

Trong CacheController, ta lấy brandId từ productInfo, sau đó tạo và thực thi GetBrandNameCommand để thử lấy brandName. Lời gọi sẽ phát sinh lỗi vì trong phương thức run() ta ném exception trực tiếp; Hystrix sẽ gọi phương thức getFallback() để chạy logic degradation.

```java
@Controller
public class CacheController {

    @RequestMapping("/getProductInfo")
    @ResponseBody
    public String getProductInfo(Long productId) {
        HystrixCommand<ProductInfo> getProductInfoCommand = new GetProductInfoCommand(productId);

        ProductInfo productInfo = getProductInfoCommand.execute();
        Long brandId = productInfo.getBrandId();

        HystrixCommand<String> getBrandNameCommand = new GetBrandNameCommand(brandId);

        // 执行会抛异常报错，然后走降级
        String brandName = getBrandNameCommand.execute();
        productInfo.setBrandName(brandName);

        System.out.println(productInfo);
        return "success";
    }
}
```

Phần minh họa về logic degradation đến đây là kết thúc.
