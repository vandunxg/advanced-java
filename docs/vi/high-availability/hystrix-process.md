# Tìm hiểu sâu quy trình thực thi bên trong Hystrix

Trước đó, chúng ta đã tìm hiểu kỹ thuật cơ bản nhất mà Hystrix hỗ trợ để đảm bảo high availability: **isolation tài nguyên** + **rate limit**.

-   Tạo command;
-   Thực thi command này;
-   Cấu hình group và thread pool tương ứng với command.

Ở đây, chúng ta sẽ tìm hiểu quy trình, các bước và nguyên lý thực thi bên dưới của Hystrix sau khi bắt đầu chạy command và gọi phương thức execute() của command đó.

Trong khi giải thích quy trình này, tôi cũng sẽ giới thiệu một số chức năng cốt lõi và quan trọng khác của Hystrix.

Đây là sơ đồ quy trình gồm 8 bước; tôi sẽ giải thích chi tiết từng bước. Trong lúc học, hãy đối chiếu với sơ đồ quy trình này để theo dõi sẽ dễ hình dung hơn.

![hystrix-process](./images/new-hystrix-process.jpg)

## Bước 1: Tạo command

Một đối tượng HystrixCommand hoặc HystrixObservableCommand đại diện cho một request hoặc lời gọi đến một dịch vụ phụ thuộc. Khi tạo đối tượng, có thể truyền mọi tham số cần thiết vào constructor.

-   HystrixCommand chủ yếu dùng cho lời gọi chỉ trả về một kết quả.
-   HystrixObservableCommand chủ yếu dùng cho lời gọi có thể trả về nhiều kết quả.

```java
// 创建 HystrixCommand
HystrixCommand hystrixCommand = new HystrixCommand(arg1, arg2);

// 创建 HystrixObservableCommand
HystrixObservableCommand hystrixObservableCommand = new HystrixObservableCommand(arg1, arg2);
```

## Bước 2: Gọi phương thức thực thi command

Thực thi command sẽ bắt đầu một lời gọi đến dịch vụ phụ thuộc.

Để thực thi command, có thể chọn một trong 4 phương thức: execute(), queue(), observe(), toObservable().

Trong đó, các phương thức execute() và queue() chỉ áp dụng cho HystrixCommand.

-   execute(): Sau khi gọi, phương thức block trực tiếp; đây là lời gọi đồng bộ, chờ cho đến khi dịch vụ phụ thuộc trả về một kết quả hoặc ném exception.
-   queue(): Trả về một Future; đây là lời gọi bất đồng bộ và sau đó có thể lấy một kết quả thông qua Future.
-   observe(): Đăng ký một đối tượng Observable. Observable đại diện cho kết quả do dịch vụ phụ thuộc trả về; phương thức lấy một bản sao của đối tượng Observable đại diện cho kết quả đó.
-   toObservable(): Trả về một đối tượng Observable. Nếu đăng ký đối tượng này, command sẽ được thực thi và kết quả trả về sẽ được lấy.

```java
K             value    = hystrixCommand.execute();
Future<K>     fValue   = hystrixCommand.queue();
Observable<K> oValue   = hystrixObservableCommand.observe();
Observable<K> toOValue = hystrixObservableCommand.toObservable();
```

Thực tế, execute() gọi phương thức queue().get(); có thể xem source code của Hystrix.

```java
public R execute() {
    try {
        return queue().get();
    } catch (Exception e) {
        throw Exceptions.sneakyThrow(decomposeException(e));
    }
}
```

Còn trong phương thức queue(), lời gọi sẽ gọi toObservable().toBlocking().toFuture().

```java
final Future<R> delegate = toObservable().toBlocking().toFuture();
```

Nói cách khác, trước tiên ta lấy đối tượng Future thông qua toObservable(), rồi gọi phương thức get() của Future. Như vậy, dù thực thi command theo cách nào thì cuối cùng cũng dựa vào toObservable() để thực thi.

## Bước 3: Kiểm tra cache có được bật hay không (ít dùng)

Từ bước này trở đi, chúng ta bắt đầu đi sâu vào nguyên lý hoạt động bên dưới của Hystrix và tìm hiểu một số chức năng, đặc tính nâng cao hơn.

Nếu command này bật Request Cache và kết quả của lời gọi đã có trong cache thì trả về kết quả trực tiếp từ cache. Nếu không, tiếp tục các bước sau.

## Bước 4: Kiểm tra circuit breaker có được bật hay không

Kiểm tra dịch vụ phụ thuộc tương ứng với command này có bật circuit breaker hay không. Nếu circuit breaker đã mở, Hystrix sẽ không thực thi command mà gọi thẳng cơ chế fallback degradation để trả về kết quả degradation.

## Bước 5: Kiểm tra thread pool/queue/semaphore có đầy hay không

Nếu thread pool và queue của command đã đầy, hoặc semaphore đã hết dung lượng, command cũng sẽ không được thực thi. Thay vào đó, hệ thống gọi thẳng cơ chế fallback degradation và gửi thông tin reject cho circuit breaker để thống kê.

## Bước 6: Thực thi command

Gọi phương thức construct() của đối tượng HystrixObservableCommand hoặc phương thức run() của HystrixCommand để thực thi command thực sự.

-   HystrixCommand.run() trả về một kết quả hoặc ném exception.

```java
// 通过command执行，获取最新一条商品数据
ProductInfo productInfo = getProductInfoCommand.execute();
```

-   HystrixObservableCommand.construct() trả về một đối tượng Observable, từ đó có thể lấy nhiều kết quả.

```java
Observable<ProductInfo> observable = getProductInfosCommand.observe();

// 订阅获取多条结果
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
     *
     * @param productInfo 商品信息
     */
    @Override
    public void onNext(ProductInfo productInfo) {
        System.out.println(productInfo);
    }
});
```

Nếu dùng thread pool và thời gian thực thi HystrixCommand.run() hoặc HystrixObservableCommand.construct() vượt quá timeout, thread chứa command sẽ ném TimeoutException. Khi đó, cơ chế fallback degradation được thực thi; giá trị trả về của run() hoặc construct() sẽ không được sử dụng. Một trường hợp khác là command thực thi lỗi và ném exception khác; lúc đó cũng chuyển sang fallback degradation. Trong cả hai trường hợp, Hystrix đều gửi sự kiện exception cho circuit breaker để thống kê.

**Lưu ý**, chúng ta không thể chấm dứt thread đang gọi một dịch vụ phụ thuộc bị trễ nghiêm trọng; chỉ có thể để nó ném ra TimeoutException.

Nếu không xảy ra timeout và command thực thi bình thường, thread gọi sẽ nhận kết quả lấy được từ lời gọi dịch vụ phụ thuộc; Hystrix cũng sẽ ghi log và thống kê metric.

## Bước 7: Kiểm tra sức khỏe circuit breaker

Hystrix gửi mọi sự kiện gọi dịch vụ phụ thuộc thành công, thất bại, Reject, Timeout, v.v. đến circuit breaker. Circuit breaker thống kê số lần xảy ra các sự kiện này và dựa trên tỷ lệ sự kiện exception để quyết định có ngắt mạch (circuit break) hay không. Nếu circuit breaker mở, trong một khoảng thời gian tiếp theo, hệ thống sẽ ngắt mạch trực tiếp và trả về kết quả degradation.

Sau đó, nếu circuit breaker thử thực thi command, lời gọi không gặp lỗi và trả về kết quả bình thường, Hystrix sẽ đóng circuit breaker.

## Bước 8: Gọi cơ chế fallback degradation

Hystrix sẽ gọi cơ chế fallback degradation trong các trường hợp sau:

-   Circuit breaker đang mở;
-   Thread pool/queue/semaphore đã đầy;
-   Command thực thi quá thời gian;
-   run() hoặc construct() ném exception.

Thông thường, trong cơ chế degradation, nên trả về một số giá trị mặc định, chẳng hạn kết quả từ một đoạn logic tĩnh hoặc dữ liệu lấy từ cache trong bộ nhớ; cố gắng không thực hiện thêm request mạng tại đây.

Nếu nhất thiết phải gọi mạng trong quá trình degradation, lời gọi đó cũng nên được cô lập bên trong một HystrixCommand.

-   Trong HystrixCommand, triển khai phương thức getFallback() để cung cấp cơ chế degradation.
-   Trong HystrixObservableCommand, triển khai phương thức resumeWithFallback() trả về một đối tượng Observable để cung cấp kết quả degradation.

Nếu không triển khai fallback hoặc fallback ném exception, Hystrix sẽ trả về một Observable nhưng không trả về dữ liệu nào.

Cách thực thi command khác nhau sẽ cho kết quả khác nhau khi fallback rỗng hoặc ném exception.

-   Với execute(), exception được ném trực tiếp.
-   Với queue(), trả về một Future; khi gọi get(), exception sẽ được ném.
-   Với observe(), trả về một đối tượng Observable; nhưng khi gọi subscribe() để đăng ký, phương thức onError() của phía gọi sẽ được gọi ngay.
-   Với toObservable(), trả về một đối tượng Observable; nhưng khi gọi subscribe() để đăng ký, phương thức onError() của phía gọi sẽ được gọi ngay.

## Các cách thực thi khác nhau

-   execute(): lấy một Future.get() rồi nhận một kết quả đơn lẻ.
-   queue(): trả về một Future.
-   observe(): đăng ký Observable ngay lập tức, sau đó khởi chạy 8 bước thực thi và trả về một Observable bản sao; khi đăng ký, kết quả được gọi lại ngay cho bạn.
-   toObservable(): trả về một Observable gốc; phải đăng ký thủ công thì 8 bước mới được thực thi.
