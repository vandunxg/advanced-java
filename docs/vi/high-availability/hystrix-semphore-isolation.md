# Thực hiện isolation tài nguyên bằng cơ chế semaphore của Hystrix

Một trong những chức năng cốt lõi của Hystrix chính là **isolation tài nguyên**. Vấn đề cốt lõi cần giải quyết là cô lập riêng lời gọi đến từng dịch vụ phụ thuộc trong resource pool riêng tương ứng. Nhờ đó, độ trễ hoặc thất bại khi gọi API của một dịch vụ phụ thuộc không khiến toàn bộ thread của service bị tiêu hao cho việc gọi API đó. Nếu toàn bộ tài nguyên thread của một service bị dùng hết, service có thể sập và sự cố thậm chí có thể tiếp tục lan rộng.

Hystrix chủ yếu dùng hai kỹ thuật để thực hiện isolation tài nguyên:

-   Thread pool
-   Semaphore

Theo mặc định, Hystrix dùng chế độ thread pool.

Phần trước đã nói về kỹ thuật thread pool; mục này sẽ trình bày cách semaphore thực hiện isolation tài nguyên, sự khác nhau giữa hai kỹ thuật và các tình huống áp dụng cụ thể.

## Cơ chế semaphore

Isolation tài nguyên bằng semaphore chỉ đóng vai trò như một công tắc. Ví dụ, nếu semaphore của service A có dung lượng 10 thì chỉ cho phép tối đa 10 thread Tomcat truy cập service A cùng lúc; các request khác sẽ bị từ chối. Nhờ đó, hệ thống thực hiện isolation tài nguyên và bảo vệ bằng rate limiting.

![hystrix-semphore](../../high-availability/images/hystrix-semphore.png)

## Khác biệt giữa thread pool và semaphore

Kỹ thuật isolation bằng thread pool không phải là kiểm soát các thread của web container như Tomcat. Nói chính xác hơn, kỹ thuật isolation bằng thread pool của Hystrix kiểm soát việc thực thi của các thread Tomcat. Khi thread pool của Hystrix đầy, nó đảm bảo thread Tomcat không bị treo do độ trễ hoặc sự cố khi gọi API của dịch vụ phụ thuộc; các thread Tomcat khác không bị kẹt, có thể trả về nhanh và tiếp tục xử lý việc khác.

Isolation bằng thread pool dùng thread riêng của Hystrix để thực hiện lời gọi; isolation bằng semaphore cho phép thread Tomcat trực tiếp gọi dịch vụ phụ thuộc. Semaphore chỉ là một chốt kiểm soát: semaphore có dung lượng bao nhiêu thì cho phép bấy nhiêu thread Tomcat đi qua để thực thi.

![hystrix-semphore-thread-pool](../../high-availability/images/hystrix-semphore-thread-pool.png)

**Tình huống áp dụng**:

-   **Kỹ thuật thread pool** phù hợp với phần lớn tình huống, chẳng hạn gọi và truy cập dịch vụ phụ thuộc qua mạng, hoặc khi cần kiểm soát timeout của lời gọi (bắt exception timeout).
-   **Kỹ thuật semaphore** phù hợp khi việc truy cập không phải là truy cập đến dependency bên ngoài mà là truy cập một số logic nghiệp vụ phức tạp bên trong; đồng thời code bên trong hệ thống thực tế không liên quan đến bất kỳ request mạng nào. Khi đó chỉ cần rate limiting thông thường bằng semaphore vì không cần bắt các vấn đề như timeout.

## Demo đơn giản về semaphore

Trong bối cảnh nghiệp vụ, tình huống nào phù hợp với semaphore?

Ví dụ, dịch vụ cache thường lưu một lượng dữ liệu rất nhỏ nhưng được truy cập rất thường xuyên trong bộ nhớ thuần túy của chính nó.

Ví dụ, sau khi lấy được dữ liệu sản phẩm, thông thường ta cần biết sản phẩm thuộc khu vực địa lý, tỉnh, thành phố hay người bán nào. Có thể lấy thông tin này từ bộ nhớ thuần túy của mình, chẳng hạn từ một Map. Với logic truy cập trực tiếp bộ nhớ cục bộ như vậy, semaphore phù hợp để thực hiện isolation đơn giản.

Ưu điểm là không phải tự quản lý thread pool, không cần quan tâm đến timeout và cũng không cần chuyển đổi context giữa các thread. Isolation bằng semaphore thường có hiệu năng cao hơn.

Giả sử đây là cache cục bộ; ta có thể lấy cityName bằng cityId.

```java
public class LocationCache {
    private static Map<Long, String> cityMap = new HashMap<>();

    static {
        cityMap.put(1L, "北京");
    }

    /**
     * Lấy cityName từ cityId
     *
     * @param cityId id thành phố
     * @return tên thành phố
     */
    public static String getCityName(Long cityId) {
        return cityMap.get(cityId);
    }
}
```

Viết một GetCityNameCommand và đặt chiến lược là **semaphore**. Trong phương thức run(), lấy dữ liệu từ cache cục bộ. Mục đích của chúng ta là isolation tài nguyên cho đoạn code truy xuất cache cục bộ.

```java
public class GetCityNameCommand extends HystrixCommand<String> {

    private Long cityId;

    public GetCityNameCommand(Long cityId) {
        // Đặt chiến lược isolation bằng semaphore
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("GetCityNameGroup"))
                .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                        .withExecutionIsolationStrategy(HystrixCommandProperties.ExecutionIsolationStrategy.SEMAPHORE)));

        this.cityId = cityId;
    }

    @Override
    protected String run() {
        // Đoạn code cần được isolation bằng semaphore
        return LocationCache.getCityName(cityId);
    }
}
```

Ở tầng API, tạo GetCityNameCommand, truyền cityId vào và thực thi phương thức execute(); khi đó đoạn code truy xuất cache cityName cục bộ sẽ được isolation tài nguyên bằng semaphore.

```java
@RequestMapping("/getProductInfo")
@ResponseBody
public String getProductInfo(Long productId) {
    HystrixCommand<ProductInfo> getProductInfoCommand = new GetProductInfoCommand(productId);

    // Thực thi thông qua command, lấy dữ liệu sản phẩm mới nhất
    ProductInfo productInfo = getProductInfoCommand.execute();

    Long cityId = productInfo.getCityId();

    GetCityNameCommand getCityNameCommand = new GetCityNameCommand(cityId);
    // Semaphore sẽ thực hiện isolation tài nguyên cho đoạn code lấy cityName từ bộ nhớ cục bộ
    String cityName = getCityNameCommand.execute();

    productInfo.setCityName(cityName);

    System.out.println(productInfo);
    return "success";
}
```
