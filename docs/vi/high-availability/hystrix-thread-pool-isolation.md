# Thực hiện isolation tài nguyên bằng kỹ thuật thread pool của Hystrix

[Phần trước](./e-commerce-website-detail-page-architecture.md) đã đề cập rằng nếu bắt đầu từ Nginx mà toàn bộ cache đều hết hạn, Nginx sẽ gọi dịch vụ sản phẩm thông qua dịch vụ cache để lấy dữ liệu sản phẩm mới nhất (ta thảo luận dựa trên dự án thương mại điện tử). Khi đó, độ trễ của lời gọi có thể làm cạn tài nguyên dịch vụ cache. Ở đây, chúng ta sẽ tìm hiểu cách thực hiện isolation tài nguyên bằng kỹ thuật thread pool của Hystrix.

Isolation tài nguyên nghĩa là nếu muốn cô lập toàn bộ request gọi đến một dịch vụ phụ thuộc trong cùng một resource pool, không dùng tài nguyên khác, thì đó là isolation tài nguyên. Dù số lời gọi đồng thời đến dịch vụ phụ thuộc, chẳng hạn dịch vụ sản phẩm, đã lên tới 1000, nhưng nếu chỉ phân bổ 10 thread trong thread pool của dịch vụ sản phẩm thì nhiều nhất cũng chỉ dùng 10 thread này để thực thi. Độ trễ khi gọi dịch vụ sản phẩm sẽ không làm cạn toàn bộ thread bên trong Tomcat.

Hystrix cung cấp một abstraction cho việc isolation tài nguyên, gọi là Command. Đây cũng là kỹ thuật isolation tài nguyên cơ bản nhất của Hystrix.

## Dùng HystrixCommand để lấy một bản ghi

Ta đóng gói thao tác gọi dịch vụ sản phẩm bên trong HystrixCommand và giới hạn bằng một key, chẳng hạn `GetProductInfoCommandGroup` bên dưới. Ở đây có thể hiểu đơn giản đó là một thread pool; mỗi lần gọi dịch vụ sản phẩm chỉ dùng tài nguyên trong thread pool này, không dùng các thread khác.

```java
public class GetProductInfoCommand extends HystrixCommand<ProductInfo> {

    private Long productId;

    public GetProductInfoCommand(Long productId) {
        super(HystrixCommandGroupKey.Factory.asKey("GetProductInfoCommandGroup"));
        this.productId = productId;
    }

    @Override
    protected ProductInfo run() {
        String url = "http://localhost:8081/getProductInfo?productId=" + productId;
        // 调用商品服务接口
        String response = HttpClientUtils.sendGetRequest(url);
        return JSONObject.parseObject(response, ProductInfo.class);
    }
}
```

Trong API của dịch vụ cache, ta tạo và thực thi Command dựa trên productId để lấy dữ liệu sản phẩm.

```java
@RequestMapping("/getProductInfo")
@ResponseBody
public String getProductInfo(Long productId) {
    HystrixCommand<ProductInfo> getProductInfoCommand = new GetProductInfoCommand(productId);

    // 通过command执行，获取最新商品数据
    ProductInfo productInfo = getProductInfoCommand.execute();
    System.out.println(productInfo);
    return "success";
}
```

Ở trên, phương thức được thực thi là execute(), đây thực chất là phương thức đồng bộ. Cũng có thể gọi phương thức queue() của command; phương thức này chỉ đưa command vào queue chờ của thread pool rồi trả về ngay một đối tượng Future. Sau đó có thể tiếp tục làm việc khác, rồi gọi phương thức get() của Future sau một khoảng thời gian để lấy dữ liệu. Đây là cách bất đồng bộ.

## Dùng HystrixObservableCommand để lấy dữ liệu hàng loạt

Toàn bộ thao tác lấy dữ liệu sản phẩm đều được gắn vào cùng một thread pool. Ta dùng một thread của HystrixObservableCommand để thực thi và trong thread đó lấy hàng loạt ProductInfo ứng với nhiều productId.

```java
public class GetProductInfosCommand extends HystrixObservableCommand<ProductInfo> {

    private String[] productIds;

    public GetProductInfosCommand(String[] productIds) {
        // 还是绑定在同一个线程池
        super(HystrixCommandGroupKey.Factory.asKey("GetProductInfoGroup"));
        this.productIds = productIds;
    }

    @Override
    protected Observable<ProductInfo> construct() {
        return Observable.unsafeCreate((Observable.OnSubscribe<ProductInfo>) subscriber -> {

            for (String productId : productIds) {
                // 批量获取商品数据
                String url = "http://localhost:8081/getProductInfo?productId=" + productId;
                String response = HttpClientUtils.sendGetRequest(url);
                ProductInfo productInfo = JSONObject.parseObject(response, ProductInfo.class);
                subscriber.onNext(productInfo);
            }
            subscriber.onCompleted();

        }).subscribeOn(Schedulers.io());
    }
}
```

Trong API của dịch vụ cache, dựa trên danh sách id nhận được, chẳng hạn chuỗi id phân tách bằng `,`, ta dùng HystrixObservableCommand ở trên và gọi một số API của Hystrix để lấy dữ liệu của tất cả sản phẩm.

```java
public String getProductInfos(String productIds) {
    String[] productIdArray = productIds.split(",");
    HystrixObservableCommand<ProductInfo> getProductInfosCommand = new GetProductInfosCommand(productIdArray);
    Observable<ProductInfo> observable = getProductInfosCommand.observe();

    observable.subscribe(new Observer<ProductInfo>() {
        @Override
        public void onCompleted() {
            System.out.println("获取完了所有的商品数据");
        }

        @Override
        public void onError(Throwable e) {
            e.printStackTrace();
        }

        /**
         * 获取完一条数据，就回调一次这个方法
         * @param productInfo
         */
        @Override
        public void onNext(ProductInfo productInfo) {
            System.out.println(productInfo);
        }
    });
    return "success";
}
```

Bây giờ, hãy xem lại cách kỹ thuật thread pool của Hystrix thực hiện isolation tài nguyên.

![hystrix-thread-pool-isolation](../../high-availability/images/hystrix-thread-pool-isolation.png)

Nếu bắt đầu từ Nginx mà toàn bộ cache đã hết hạn thì Nginx sẽ gọi dịch vụ sản phẩm thông qua dịch vụ cache. Kích thước thread mặc định của dịch vụ cache là 10, vì thế nhiều nhất chỉ có 10 thread gọi API của dịch vụ sản phẩm. Dù API dịch vụ sản phẩm gặp sự cố thì nhiều nhất cũng chỉ có 10 thread bị treo khi gọi API này; các thread Tomcat khác của dịch vụ cache vẫn có thể dùng để gọi dịch vụ khác và xử lý công việc khác.
