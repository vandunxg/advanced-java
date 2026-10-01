# Tối ưu API truy vấn hàng loạt dữ liệu sản phẩm bằng request cache

Bước thứ ba trong 8 bước thực thi Hystrix command là kiểm tra Request cache có dữ liệu cache hay không.

Trước hết, có một khái niệm gọi là Request Context (request context). Thông thường, trong một ứng dụng web có dùng Hystrix, ta áp dụng một request context cho mỗi request bên trong một filter. Nói cách khác, mỗi request tương ứng với một request context. Sau đó, trong request context này, ta thực thi nhiều đoạn code và gọi nhiều dịch vụ phụ thuộc; một số dịch vụ phụ thuộc có thể được gọi nhiều lần.

Trong cùng một request context, nếu có nhiều command với cùng tham số và gọi cùng một API, đồng thời có thể xem kết quả là giống nhau, ta có thể lưu kết quả trả về của command đầu tiên trong bộ nhớ. Các lời gọi tiếp theo trong request context đó đến cùng dependency có thể lấy kết quả cache từ bộ nhớ.

Ưu điểm là không phải thực thi lặp lại cùng một command nhiều lần trong một request context, **tránh gửi request mạng trùng lặp và cải thiện hiệu năng của toàn bộ request**.

Lấy một ví dụ. Trong một request context, ta yêu cầu lấy dữ liệu có productId bằng 1. Lần đầu cache chưa có dữ liệu nên hệ thống lấy dữ liệu từ dịch vụ sản phẩm, trả về kết quả mới nhất đồng thời lưu dữ liệu vào bộ nhớ. Nếu sau đó trong cùng request context vẫn có yêu cầu lấy dữ liệu có productId bằng 1, chỉ cần lấy trực tiếp từ cache.

![hystrix-request-cache](../../high-availability/images/hystrix-request-cache.png)

Cả HystrixCommand và HystrixObservableCommand đều có thể chỉ định một cache key; Hystrix sẽ tự động cache. Sau đó, nếu truy cập lại trong cùng request context, hệ thống sẽ lấy trực tiếp dữ liệu cache.

Sau đây, chúng ta sẽ xét một **tình huống nghiệp vụ** cụ thể để xem cách dùng request cache. Dĩ nhiên, code bên dưới chỉ là một Demo cơ bản.

Giả sử ta cần xây dựng API **truy vấn hàng loạt dữ liệu sản phẩm**. API này dùng HystrixCommand để truy vấn dữ liệu của nhiều product id cùng lúc. Tuy nhiên có một vấn đề: nếu cache cục bộ của Nginx hết hạn và cần lấy lại một lô cache, productIds được truyền đến không được loại bỏ trùng lặp, chẳng hạn `productIds=1,1,1,2,2`, thì id sản phẩm có thể bị lặp. Theo logic nghiệp vụ trước đây, có thể sẽ truy vấn sản phẩm có productId=1 ba lần và sản phẩm có productId=2 hai lần.

Có thể tối ưu API truy vấn hàng loạt dữ liệu sản phẩm bằng request cache: mỗi request tương ứng với một request context; mỗi sản phẩm trùng lặp chỉ được truy vấn một lần, còn các lần lặp lại sẽ dùng request cache.

## Triển khai và đăng ký filter cho Hystrix request context

Định nghĩa lớp HystrixRequestContextFilter để triển khai interface Filter.

```java
/**
 * Hystrix 请求上下文过滤器
 */
public class HystrixRequestContextFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) {
        HystrixRequestContext context = HystrixRequestContext.initializeContext();
        try {
            filterChain.doFilter(servletRequest, servletResponse);
        } catch (IOException | ServletException e) {
            e.printStackTrace();
        } finally {
            context.shutdown();
        }
    }

    @Override
    public void destroy() {

    }
}
```

Sau đó đăng ký đối tượng filter này vào SpringBoot Application.

```java
@SpringBootApplication
public class EshopApplication {

    public static void main(String[] args) {
        SpringApplication.run(EshopApplication.class, args);
    }

    @Bean
    public FilterRegistrationBean filterRegistrationBean() {
        FilterRegistrationBean filterRegistrationBean = new FilterRegistrationBean(new HystrixRequestContextFilter());
        filterRegistrationBean.addUrlPatterns("/*");
        return filterRegistrationBean;
    }
}
```

## Override phương thức getCacheKey() của command

Trong GetProductInfoCommand, override phương thức getCacheKey(); như vậy kết quả của mỗi request sẽ được lưu trong Hystrix request context. Lần tiếp theo có request lấy dữ liệu cùng productId, hệ thống lấy cache trực tiếp mà không cần gọi phương thức run() nữa.

```java
public class GetProductInfoCommand extends HystrixCommand<ProductInfo> {

    private Long productId;

    private static final HystrixCommandKey KEY = HystrixCommandKey.Factory.asKey("GetProductInfoCommand");

    public GetProductInfoCommand(Long productId) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ProductInfoService"))
                .andCommandKey(KEY));
        this.productId = productId;
    }

    @Override
    protected ProductInfo run() {
        String url = "http://localhost:8081/getProductInfo?productId=" + productId;
        String response = HttpClientUtils.sendGetRequest(url);
        System.out.println("调用接口查询商品数据，productId=" + productId);
        return JSONObject.parseObject(response, ProductInfo.class);
    }

    /**
     * 每次请求的结果，都会放在Hystrix绑定的请求上下文上
     *
     * @return cacheKey 缓存key
     */
    @Override
    public String getCacheKey() {
        return "product_info_" + productId;
    }

    /**
     * 将某个商品id的缓存清空
     *
     * @param productId 商品id
     */
    public static void flushCache(Long productId) {
        HystrixRequestCache.getInstance(KEY,
                HystrixConcurrencyStrategyDefault.getInstance()).clear("product_info_" + productId);
    }
}
```

Ở đây có phương thức flushCache() để chúng ta chủ động xóa cache trong quá trình phát triển.

## controller gọi command để truy vấn thông tin sản phẩm

Trong một web request context, truyền vào danh sách product id để truy vấn dữ liệu của nhiều sản phẩm. Với mỗi productId, tạo một command.

Nếu danh sách id chưa được loại bỏ trùng lặp, các id lặp lại sẽ dùng cache ngay từ lần truy vấn thứ hai.

```java
@Controller
public class CacheController {

    /**
     * 一次性批量查询多条商品数据的请求
     *
     * @param productIds 以,分隔的商品id列表
     * @return 响应状态
     */
    @RequestMapping("/getProductInfos")
    @ResponseBody
    public String getProductInfos(String productIds) {
        for (String productId : productIds.split(",")) {
            // 对每个productId，都创建一个command
            GetProductInfoCommand getProductInfoCommand = new GetProductInfoCommand(Long.valueOf(productId));
            ProductInfo productInfo = getProductInfoCommand.execute();
            System.out.println("是否是从缓存中取的结果：" + getProductInfoCommand.isResponseFromCache());
        }

        return "success";
    }
}
```

## Gửi request

Gọi API để truy vấn thông tin của nhiều sản phẩm.

```
http://localhost:8080/getProductInfos?productIds=1,1,1,2,2,5
```

Trong console, ta có thể thấy kết quả sau.

```
调用接口查询商品数据，productId=1
是否是从缓存中取的结果：false
是否是从缓存中取的结果：true
是否是从缓存中取的结果：true
调用接口查询商品数据，productId=2
是否是从缓存中取的结果：false
是否是从缓存中取的结果：true
调用接口查询商品数据，productId=5
是否是从缓存中取的结果：false
```

Lần đầu truy vấn dữ liệu có productId=1, hệ thống gọi API để lấy dữ liệu chứ không lấy từ cache. Những request tiếp theo truy vấn dữ liệu có productId=1 sẽ lấy trực tiếp từ cache, nhờ đó hiệu năng được cải thiện rõ rệt.

## Xóa cache

Ta viết một UpdateProductInfoCommand; sau khi cập nhật thông tin sản phẩm, gọi thủ công phương thức flushCache() đã viết trước đó để xóa cache.

```java
public class UpdateProductInfoCommand extends HystrixCommand<Boolean> {

    private Long productId;

    public UpdateProductInfoCommand(Long productId) {
        super(HystrixCommandGroupKey.Factory.asKey("UpdateProductInfoGroup"));
        this.productId = productId;
    }

    @Override
    protected Boolean run() throws Exception {
        // 这里执行一次商品信息的更新
        // ...

        // 然后清空缓存
        GetProductInfoCommand.flushCache(productId);
        return true;
    }
}
```

Như vậy, lần đầu truy vấn sản phẩm này sau đó sẽ gọi API để lấy thông tin sản phẩm mới nhất.
