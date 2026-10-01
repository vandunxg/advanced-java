# Kiểm soát chi tiết các chiến lược isolation của Hystrix

Hystrix thực hiện isolation tài nguyên bằng hai chiến lược:

-   Isolation bằng thread pool
-   Isolation bằng semaphore

Với isolation tài nguyên, thực tế có thể thực hiện một số kiểm soát khá chi tiết.

## execution.isolation.strategy

Chỉ định chiến lược isolation tài nguyên cho HystrixCommand.run(): `THREAD` hoặc `SEMAPHORE`; một chiến lược dựa trên thread pool, chiến lược còn lại dựa trên semaphore.

```java
// to use thread isolation
HystrixCommandProperties.Setter().withExecutionIsolationStrategy(ExecutionIsolationStrategy.THREAD)

// to use semaphore isolation
HystrixCommandProperties.Setter().withExecutionIsolationStrategy(ExecutionIsolationStrategy.SEMAPHORE)
```

Với cơ chế thread pool, mỗi command chạy trên một thread và việc rate limit được kiểm soát bằng kích thước thread pool. Với cơ chế semaphore, command chạy trên thread gọi (tức thread pool của Tomcat) và được rate limit bằng dung lượng của semaphore.

Nên chọn thread pool hay semaphore?

**Chiến lược mặc định** là thread pool.

**Ưu điểm lớn nhất của thread pool** là với các request truy cập mạng, nếu xảy ra timeout thì có thể tránh để thread gọi bị block.

Semaphore thường được dùng trong các tình huống có concurrency cực lớn, chẳng hạn mỗi service instance có `QPS` vài trăm. Khi đó thread pool có thể không chịu nổi mức concurrency cao nếu số thread không nhiều; nếu tăng đủ để chịu tải thì có thể tốn rất nhiều tài nguyên thread. Vì vậy có thể dùng semaphore để rate limit nhằm bảo vệ. Semaphore thường được dùng cho các service xử lý nghiệp vụ thuần túy trong bộ nhớ, không liên quan đến request truy cập mạng.

## command key & command group

Khi dùng isolation bằng thread pool, cần phân chia **dịch vụ phụ thuộc**, **API của dịch vụ phụ thuộc** và **thread pool** như thế nào?

Mỗi command có thể được đặt một tên riêng là command key, đồng thời có thể được gán một nhóm riêng là command group.

```java
private static final Setter cachedSetter = Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ExampleGroup"))
                                                 .andCommandKey(HystrixCommandKey.Factory.asKey("HelloWorld"));

public CommandHelloWorld(String name) {
    super(cachedSetter);
    this.name = name;
}
```

command group là một khái niệm rất quan trọng. Theo mặc định, thread pool được xác định bằng command group; command group cũng được dùng để tổng hợp một số thông tin giám sát và cảnh báo. Các request trong cùng một command group đều đi vào cùng một thread pool.

## command thread pool

ThreadPoolKey đại diện cho một HystrixThreadPool, được dùng để giám sát, thống kê và cache tập trung. Theo mặc định, ThreadPoolKey chính là tên của command group. Mỗi command được gắn với ThreadPool tương ứng với ThreadPoolKey của nó.

Nếu không muốn dùng trực tiếp command group, có thể tự đặt tên cho ThreadPool.

```java
private static final Setter cachedSetter = Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ExampleGroup"))
                                                 .andCommandKey(HystrixCommandKey.Factory.asKey("HelloWorld"))
                                                 .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("HelloWorldPool"));

public CommandHelloWorld(String name) {
    super(cachedSetter);
    this.name = name;
}
```

## command key & command group & command thread pool

**command key** đại diện cho một loại command; thông thường nó đại diện cho một API của dịch vụ phụ thuộc phía dưới.

**command group** đại diện cho một dịch vụ phụ thuộc phía dưới. Cách phân chia này hợp lý vì một dịch vụ phụ thuộc có thể cung cấp nhiều API, mỗi API tương ứng với một command key. Về mặt logic, command group thống kê số lần gọi, số lần thành công, timeout, thất bại, v.v. của một nhóm command key, nhờ đó có thể xem tình hình truy cập tổng thể của một dịch vụ. **Thông thường, nên chia thread pool theo từng service; các command key mặc định đều thuộc cùng một thread pool.**

Ví dụ, giả sử tổng `QPS` của tất cả API trong service A vào khoảng 100 mỗi giây, và service B gọi service A. Service B được triển khai thành 10 instance; trên mỗi instance, dùng command group để đại diện cho service A ở phía dưới. Chỉ cần một thread pool có kích thước khoảng 10 là đủ; như vậy tổng QPS mà service B gửi đến service A sẽ vào khoảng 100 mỗi giây.

Tuy nhiên, nếu command group đại diện cho một service có vài API với lưu lượng truy cập chênh lệch rất lớn, có thể cần isolation tài nguyên chi tiết hơn bên trong command group đó cho các command key tương ứng với từng API. **Nói cách khác, muốn dùng thread pool khác nhau cho các API khác nhau của cùng một service.**

```
command key -> command group

command key -> 自己的 thread pool key
```

Về mặt logic, nhiều command key thuộc cùng một command group và được thống kê chung. Mỗi command key có thread pool riêng; mỗi API có thread pool riêng để thực hiện isolation tài nguyên và rate limit.

Nói đơn giản, nếu command key cần dùng thread pool riêng thì chỉ cần định nghĩa thread pool key riêng cho nó.

## coreSize

Đặt kích thước thread pool; mặc định là 10. Thông thường, 10 thread mặc định là đủ.

```java
HystrixThreadPoolProperties.Setter().withCoreSize(int value);
```

## queueSizeRejectionThreshold

Nếu cả 10 thread trong thread pool đều đang làm việc và không còn thread rảnh để xử lý việc khác, request mới sẽ được đưa vào queue chờ. Nếu queue đã đầy mà vẫn có request đến, request đó sẽ bị reject; logic fallback degradation được thực thi để trả về nhanh.

![hystrix-thread-pool-queue](../../high-availability/images/hystrix-thread-pool-queue.png)

Tham số này kiểm soát ngưỡng reject khi queue đầy. Vì không thể thay đổi nóng maxQueueSize nên tham số này được cung cấp để có thể thay đổi nóng và kiểm soát kích thước tối đa của queue.

```java
HystrixThreadPoolProperties.Setter().withQueueSizeRejectionThreshold(int value);
```

## execution.isolation.semaphore.maxConcurrentRequests

Đặt mức concurrency tối đa được phép khi truy cập bằng chiến lược isolation SEMAPHORE. Khi vượt mức concurrency này, request sẽ bị reject ngay.

Giá trị concurrency này nên được đặt tương tự như kích thước thread pool. Tuy nhiên, dùng semaphore sẽ có hiệu năng tốt hơn và overhead của chính framework Hystrix cũng thấp hơn nhiều.

Giá trị mặc định là 10. Nên đặt nhỏ, vì nếu đặt quá lớn và xảy ra độ trễ, tài nguyên thread của chính Tomcat có thể bị chiếm hết trong chốc lát.

```java
HystrixCommandProperties.Setter().withExecutionIsolationSemaphoreMaxConcurrentRequests(int value);
```
