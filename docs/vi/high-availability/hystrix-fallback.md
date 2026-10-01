# Cơ chế fallback dựa trên cache cục bộ

Hystrix sẽ gọi cơ chế fallback trong bốn trường hợp sau:

-   Circuit breaker đang ở trạng thái mở.
-   Resource pool đã đầy (thread pool + queue / semaphore).
-   Khi Hystrix gọi nhiều API khác nhau hoặc truy cập dependency bên ngoài như MySQL, Redis, ZooKeeper, Kafka, v.v., xảy ra bất kỳ exception nào.
-   Khi truy cập dependency bên ngoài mất quá nhiều thời gian và phát sinh exception TimeoutException.

## Hai cơ chế fallback phổ biến nhất

-   Dữ liệu thuần trong bộ nhớ<br>
    Trong logic fallback, có thể duy trì một ehcache trong bộ nhớ, dùng làm cache thuần bộ nhớ tự động dọn dẹp theo LRU để lưu dữ liệu. Nếu dependency bên ngoài gặp lỗi, fallback sẽ thử lấy dữ liệu trực tiếp từ ehcache.

-   Giá trị mặc định<br>
    Trong logic fallback, cũng có thể trả về trực tiếp một giá trị mặc định.

Trong `HystrixCommand`, logic fallback được viết bằng cách triển khai getFallback(); còn trong `HystrixObservableCommand`, cần triển khai phương thức resumeWithFallback().

Bây giờ, ta dùng một ví dụ đơn giản để minh họa cách thực hiện fallback.

Ví dụ, xét **tình huống** sau. Ta có dữ liệu sản phẩm bao gồm brandId. Giả sử logic bình thường là lấy dữ liệu sản phẩm, dựa vào brandId để gọi API của dịch vụ thương hiệu và lấy tên thương hiệu mới nhất, brandName.

Nếu API dịch vụ thương hiệu ngừng hoạt động, ta có thể thử lấy một bản dữ liệu hơi cũ từ bộ nhớ cục bộ để tạm sử dụng.

## Bước 1: Lấy dữ liệu từ cache cục bộ

Đoạn code lấy tên thương hiệu từ bộ nhớ cục bộ đại khái như sau.

```java
/**
 * Cache cục bộ cho tên thương hiệu
 *
 */
public class BrandCache {

    private static Map<Long, String> brandMap = new HashMap<>();

    static {
        brandMap.put(1L, "Nike");
    }

    /**
     * Lấy brandName từ brandId
     *
     * @param brandId ID thương hiệu
     * @return tên thương hiệu
     */
    public static String getBrandName(Long brandId) {
        return brandMap.get(brandId);
    }
```

## Bước 2: Triển khai GetBrandNameCommand

Trong GetBrandNameCommand, logic thông thường của phương thức run() là gọi API của dịch vụ thương hiệu để lấy tên thương hiệu. Nếu lời gọi thất bại và phát sinh lỗi, cơ chế fallback sẽ được gọi.

Ở đây, ta **mô phỏng việc gọi API bị lỗi** bằng cách ném một exception.

Còn phương thức getFallback() chính là **logic fallback**; ta lấy dữ liệu **tên thương hiệu** trực tiếp từ cache cục bộ.

```java
/**
 * Command để lấy tên thương hiệu
 *
 */
public class GetBrandNameCommand extends HystrixCommand<String> {

    private Long brandId;

    public GetBrandNameCommand(Long brandId) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("BrandService"))
                .andCommandKey(HystrixCommandKey.Factory.asKey("GetBrandNameCommand"))
                .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                        // Thiết lập số request đồng thời tối đa cho cơ chế fallback
                        .withFallbackIsolationSemaphoreMaxConcurrentRequests(15)));
        this.brandId = brandId;
    }

    @Override
    protected String run() throws Exception {
        // Logic thông thường ở đây là gọi một API của dịch vụ thương hiệu để lấy tên
        // Nếu lời gọi thất bại và phát sinh lỗi thì sẽ gọi cơ chế fallback

        // Ở đây ta mô phỏng việc gọi bị lỗi bằng cách ném một exception
        throw new Exception();
    }

    @Override
    protected String getFallback() {
        return BrandCache.getBrandName(brandId);
    }
}
```

`FallbackIsolationSemaphoreMaxConcurrentRequests` dùng để thiết lập số lượng request đồng thời tối đa mà fallback cho phép; giá trị mặc định là 10 và việc giới hạn được thực hiện bằng semaphore. Nếu vượt quá giá trị tối đa này, request sẽ bị reject ngay.

## Bước 3: CacheController gọi API

Trong CacheController, ta lấy brandId từ productInfo, sau đó tạo GetBrandNameCommand và thực thi để thử lấy brandName. Lời gọi này sẽ phát sinh lỗi vì trong phương thức run() ta ném exception trực tiếp; Hystrix sẽ gọi phương thức getFallback() để thực thi logic fallback.

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

        // Khi thực thi sẽ phát sinh exception, sau đó thực hiện fallback
        String brandName = getBrandNameCommand.execute();
        productInfo.setBrandName(brandName);

        System.out.println(productInfo);
        return "success";
    }
}
```

Phần minh họa về logic fallback đến đây là kết thúc.
