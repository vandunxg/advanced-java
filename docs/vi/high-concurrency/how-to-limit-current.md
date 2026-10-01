# Làm thế nào giới hạn lưu lượng? Bạn làm thế nào trong công việc? Hãy trình bày cách triển khai cụ thể.

## Rate limiting là gì?

> Có thể xem rate limiting là một dạng service degradation; rate limiting nghĩa là giới hạn lưu lượng đầu vào và đầu ra của hệ thống để bảo vệ hệ thống. Thông thường có thể đo được throughput của hệ thống. Để đảm bảo hệ thống hoạt động ổn định, khi đạt đến ngưỡng cần giới hạn thì phải giới hạn lưu lượng và áp dụng một số biện pháp để đạt mục đích đó, chẳng hạn xử lý trễ, từ chối xử lý hoặc chỉ từ chối một phần, v.v.

## Phương pháp rate limiting

### Counter

#### Cách triển khai

Kiểm soát số lượng request trong một đơn vị thời gian.

```java

import java.util.concurrent.atomic.AtomicInteger;

public class Counter {
    /**
     * Số lượt truy cập tối đa
     */
    private final int limit = 10;
    /**
     * Độ chênh lệch thời gian truy cập
     */
    private final long timeout = 1000;
    /**
     * Thời gian request
     */
    private long time;
    /**
     * Bộ đếm hiện tại
     */
    private AtomicInteger reqCount = new AtomicInteger(0);

    public boolean limit() {
        long now = System.currentTimeMillis();
        if (now < time + timeout) {
            // Trong một đơn vị thời gian
            reqCount.addAndGet(1);
            return reqCount.get() <= limit;
        } else {
            // Vượt quá một đơn vị thời gian
            time = now;
            reqCount = new AtomicInteger(0);
            return true;
        }
    }
}

```

Nhược điểm:

Giả sử có một request lúc 00:01, sau đó không có request nào từ 00:01 đến 00:58, rồi lúc 00:59 gửi tất cả các request còn lại `n-1` (n là số lượng request bị giới hạn). Đến 00:01 của phút kế tiếp lại gửi n request. Như vậy trong vòng 2 giây có tổng cộng `2n - 1` request.

Giả sử số request mỗi phút là 60, mỗi giây có thể xử lý 1 request. Người dùng gửi 60 request lúc 00:59 và 60 request lúc 01:00; khi đó trong 2 giây có 120 request (60 request mỗi giây), cao hơn rất nhiều so với ngưỡng xử lý 1 request mỗi giây.

### Sliding window

#### Cách triển khai

Sliding window cải tiến phương pháp counter bằng cách thêm một đơn vị đo lường về độ phân giải thời gian; chia một phút thành một số phần bằng nhau (6 phần, mỗi phần 10 giây) và đặt counter riêng cho mỗi phần. Nếu request xảy ra trong khoảng 00:00–00:09 thì counter tăng 1. Số phần bằng nhau càng lớn thì thống kê rate limiting càng chi tiết.

```java
package com.example.demo1.service;

import java.util.Iterator;
import java.util.Random;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.stream.IntStream;

public class TimeWindow {
    private ConcurrentLinkedQueue<Long> queue = new ConcurrentLinkedQueue<Long>();

    /**
     * Số giây của khoảng thời gian
     */
    private int seconds;

    /**
     * Mức rate limiting tối đa
     */
    private int max;

    public TimeWindow(int max， int seconds) {
        this.seconds = seconds;
        this.max = max;

        /**
         * Thread chạy liên tục để thực hiện tác vụ dọn dẹp queue
         */
        new Thread(() -> {
            while (true) {
                try {
                    // Chờ (số giây của khoảng thời gian - 1) rồi thực hiện thao tác dọn dẹp
                    Thread.sleep((seconds - 1) * 1000L);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                clean();
            }
        }).start();

    }

    public static void main(String[] args) throws Exception {

        final TimeWindow timeWindow = new TimeWindow(10， 1);

        // Kiểm thử 3 thread
        IntStream.range(0， 3).forEach((i) -> {
            new Thread(() -> {

                while (true) {

                    try {
                        Thread.sleep(new Random().nextInt(20) * 100);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    timeWindow.take();
                }

            }).start();

        });

    }

    /**
     * Lấy token và thêm thời gian
     */
    public void take() {

        long start = System.currentTimeMillis();
        try {

            int size = sizeOfValid();
            if (size > max) {
                System.err.println("超限");

            }
            synchronized (queue) {
                if (sizeOfValid() > max) {
                    System.err.println("超限");
                    System.err.println("queue中有 " + queue.size() + " 最大数量 " + max);
                }
                this.queue.offer(System.currentTimeMillis());
            }
            System.out.println("queue中有 " + queue.size() + " 最大数量 " + max);

        }

    }

    public int sizeOfValid() {
        Iterator<Long> it = queue.iterator();
        Long ms = System.currentTimeMillis() - seconds * 1000;
        int count = 0;
        while (it.hasNext()) {
            long t = it.next();
            if (t > ms) {
                // Trong phạm vi thời gian thống kê hiện tại
                count++;
            }
        }

        return count;
    }

    /**
     * Dọn dẹp các mốc thời gian đã hết hạn
     */
    public void clean() {
        Long c = System.currentTimeMillis() - seconds * 1000;

        Long tl = null;
        while ((tl = queue.peek()) != null && tl < c) {
            System.out.println("清理数据");
            queue.poll();
        }
    }

}

```

### Leaky Bucket (bucket rò rỉ)

#### Cách triển khai

Quy định một bucket có dung lượng cố định; nước chảy vào và chảy ra. Ta không thể dự đoán lượng nước chảy vào hay tốc độ chảy vào, nhưng có thể kiểm soát tốc độ nước chảy ra.

```java
public class LeakBucket {
    /**
     * Thời gian
     */
    private long time;
    /**
     * Tổng lượng
     */
    private Double total;
    /**
     * Tốc độ nước chảy ra
     */
    private Double rate;
    /**
     * Tổng lượng hiện tại
     */
    private Double nowSize;

    public boolean limit() {
        long now = System.currentTimeMillis();
        nowSize = Math.max(0， (nowSize - (now - time) * rate));
        time = now;
        if ((nowSize + 1) < total) {
            nowSize++;
            return true;
        } else {
            return false;
        }

    }
}
```

### Token Bucket (bucket token)

#### Cách triển khai

Quy định một bucket có dung lượng cố định; token được nạp vào bucket với tốc độ cố định. Khi bucket đầy thì không nạp thêm token. Mỗi khi có request thì lấy một token khỏi bucket; nếu trong bucket không có token thì request không được phép.

```java
public class TokenBucket {
    /**
     * Thời gian
     */
    private long time;
    /**
     * Tổng lượng
     */
    private Double total;
    /**
     * Tốc độ nạp token
     */
    private Double rate;
    /**
     * Tổng lượng hiện tại
     */
    private Double nowSize;

    public boolean limit() {
        long now = System.currentTimeMillis();
        nowSize = Math.min(total， nowSize + (now - time) * rate);
        time = now;
        if (nowSize < 1) {
            // Bucket không có token
            return false;
        } else {
            // Có token
            nowSize -= 1;
            return true;
        }
    }

}
```

## Cách sử dụng trong công việc

### Spring Cloud Gateway

-   Spring Cloud Gateway mặc định dùng Redis để rate limiting. Thông thường tôi chỉ sửa một số tham số để dùng ngay, chứ không tự triển khai lại từ đầu các thuật toán trên.

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
</dependency>
```

```yaml
spring:
    cloud:
        gateway:
            routes:
                - id: requestratelimiter_route

                  uri: lb://pigx-upms
                  order: 10000
                  predicates:
                      - Path=/admin/**

                  filters:
                      - name: RequestRateLimiter

                        args:
                            redis-rate-limiter.replenishRate: 1 # Dung lượng token bucket
                            redis-rate-limiter.burstCapacity: 3 # Tốc độ dòng chảy mỗi giây
                            key-resolver: '#{@remoteAddrKeyResolver}' # Biểu thức SpEL để lấy bean tương ứng

                      - StripPrefix=1
```

```java
@Bean
KeyResolver remoteAddrKeyResolver() {
    return exchange -> Mono.just(exchange.getRequest().getRemoteAddress().getHostName());
}
```

### Sentinel

-   Dùng cấu hình để kiểm soát lưu lượng của từng URL

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

```yaml
spring:
    cloud:
        nacos:
            discovery:
                server-addr: localhost:8848
        sentinel:
            transport:
                dashboard: localhost:8080
                port: 8720
            datasource:
                ds:
                    nacos:
                        server-addr: localhost:8848
                        dataId: spring-cloud-sentinel-nacos
                        groupId: DEFAULT_GROUP
                        rule-type: flow
                        namespace: xxxxxxxx
```

-   Chỉnh sửa nội dung cấu hình trên Nacos

```json
[
    {
        "resource": "/hello",
        "limitApp": "default",
        "grade": 1,
        "count": 1,
        "strategy": 0,
        "controlBehavior": 0,
        "clusterMode": false
    }
]
```

-   resource: tên resource, tức đối tượng áp dụng rule rate limiting.
-   limitApp: nguồn gọi bị áp dụng flow control; nếu là default thì không phân biệt nguồn gọi.
-   grade: loại ngưỡng rate limiting, chế độ QPS hoặc số thread; 0 là rate limiting theo số lượng đồng thời, 1 là flow control theo QPS.
-   count: ngưỡng rate limiting
-   strategy: căn cứ đánh giá là chính resource, resource liên quan khác (refResource), hay entry point của call chain
-   controlBehavior: hành vi flow control (từ chối trực tiếp / chờ xếp hàng / chế độ khởi động chậm)
-   clusterMode: có phải chế độ cluster hay không

### Tổng kết

> Sentinel và Spring Cloud Gateway đều là các framework rate limiting tốt. Tuy nhiên, trong quá trình sử dụng tôi vẫn chưa tích hợp [spring-cloud-alibaba](https://github.com/alibaba/spring-cloud-alibaba) vào dự án, nên tôi sẽ chọn **Spring Cloud Gateway**. Khi tích hợp đầy đủ hoặc khi tích hợp vào dự án Nacos thì dùng setinel sẽ có trải nghiệm tốt hơn.
