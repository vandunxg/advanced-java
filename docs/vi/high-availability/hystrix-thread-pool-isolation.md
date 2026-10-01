# Thực hiện cô lập tài nguyên bằng kỹ thuật thread pool của Hystrix

[Phần trước](./e-commerce-website-detail-page-architecture.md) đã đề cập rằng khi toàn bộ cache đều mất hiệu lực, Nginx sẽ gọi trực tiếp dịch vụ sản phẩm thông qua dịch vụ cache để lấy dữ liệu sản phẩm mới nhất (chúng ta thảo luận dựa trên một dự án thương mại điện tử). Khi đó, độ trễ của lời gọi có thể làm cạn kiệt tài nguyên của dịch vụ cache. Ở đây, chúng ta sẽ tìm hiểu cách thực hiện cô lập tài nguyên bằng kỹ thuật thread pool của Hystrix.

Cô lập tài nguyên nghĩa là cô lập mọi request gọi đến một dịch vụ phụ thuộc trong cùng một resource pool, không sử dụng các tài nguyên khác. Cho dù số lời gọi đồng thời đến dịch vụ phụ thuộc, chẳng hạn dịch vụ sản phẩm, đã lên tới 1000, nếu thread pool dành cho dịch vụ sản phẩm chỉ được phân bổ 10 thread thì nhiều nhất cũng chỉ 10 thread này được dùng để thực thi. Độ trễ khi gọi dịch vụ sản phẩm sẽ không làm cạn kiệt toàn bộ thread bên trong Tomcat.

Hystrix cung cấp một abstraction để thực hiện cô lập tài nguyên, gọi là Command. Đây cũng là kỹ thuật cô lập tài nguyên cơ bản nhất của Hystrix.

## Dùng HystrixCommand để lấy một bản ghi

Ta đóng gói thao tác gọi dịch vụ sản phẩm trong HystrixCommand và gắn với một key, chẳng hạn `GetProductInfoCommandGroup` như bên dưới. Ở đây có thể hiểu đơn giản đó là một thread pool; mỗi lần gọi dịch vụ sản phẩm chỉ sử dụng tài nguyên trong thread pool này, không sử dụng các thread khác.

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
        // Gọi API của dịch vụ sản phẩm
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

    // Thực thi thông qua command để lấy dữ liệu sản phẩm mới nhất
    ProductInfo productInfo = getProductInfoCommand.execute();
    System.out.println(productInfo);
    return "success";
}
```

Ở trên, phương thức được thực thi là execute(), thực chất đây là một phương thức đồng bộ. Cũng có thể gọi phương thức queue() của command; phương thức này chỉ đưa command vào hàng đợi chờ của thread pool rồi trả về ngay một đối tượng Future. Sau đó có thể tiếp tục làm việc khác, rồi gọi phương thức get() của Future sau một khoảng thời gian để lấy dữ liệu. Đây là cách bất đồng bộ.

## Dùng HystrixObservableCommand để lấy dữ liệu hàng loạt

Toàn bộ thao tác lấy dữ liệu sản phẩm đều được gắn vào cùng một thread pool. Ta dùng một thread của HystrixObservableCommand để thực thi và trong thread đó lấy hàng loạt ProductInfo tương ứng với nhiều productId.

```java
public class GetProductInfosCommand extends HystrixObservableCommand<ProductInfo> {

    private String[] productIds;

    public GetProductInfosCommand(String[] productIds) {
        // Vẫn gắn vào cùng một thread pool
        super(HystrixCommandGroupKey.Factory.asKey("GetProductInfoGroup"));
        this.productIds = productIds;
    }

    @Override
    protected Observable<ProductInfo> construct() {
        return Observable.unsafeCreate((Observable.OnSubscribe<ProductInfo>) subscriber -> {

            for (String productId : productIds) {
                // Lấy hàng loạt dữ liệu sản phẩm
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

Trong API của dịch vụ cache, dựa trên danh sách id nhận được, chẳng hạn một chuỗi id được phân tách bằng `,`, ta sử dụng HystrixObservableCommand ở trên và gọi một số API của Hystrix để lấy dữ liệu của tất cả sản phẩm.

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
         * Mỗi khi lấy xong một phần dữ liệu, phương thức này sẽ được gọi lại một lần
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

Bây giờ, hãy xem kỹ thuật thread pool của Hystrix thực hiện cô lập tài nguyên như thế nào.

![hystrix-thread-pool-isolation](../../high-availability/images/hystrix-thread-pool-isolation.png)

Khi toàn bộ cache đều mất hiệu lực, Nginx sẽ gọi dịch vụ sản phẩm thông qua dịch vụ cache. Dịch vụ cache mặc định có 10 thread, vì thế nhiều nhất chỉ có 10 thread gọi API của dịch vụ sản phẩm. Dù API của dịch vụ sản phẩm gặp sự cố thì nhiều nhất cũng chỉ có 10 thread bị treo khi gọi API này; các thread Tomcat khác của dịch vụ cache vẫn có thể được dùng để gọi các dịch vụ khác và xử lý công việc khác.
