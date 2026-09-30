# Glossary — Java, Backend và Distributed Systems

Glossary này là mặc định cho bộ tài liệu. Nếu một thuật ngữ có nhiều cách dịch hợp lý, chọn một cách và giữ nhất quán; tên chuẩn/API luôn giữ nguyên.

| English / token | Cách dùng tiếng Việt |
| --- | --- |
| class, object | class, object; có thể diễn giải là lớp/đối tượng trong prose |
| interface, abstract class | interface, abstract class |
| inheritance, composition | inheritance, composition |
| encapsulation, polymorphism | encapsulation, polymorphism |
| JVM, JDK, JRE | Giữ nguyên |
| bytecode, garbage collection (GC) | bytecode, garbage collection (GC) |
| heap, stack, metaspace | heap, stack, metaspace |
| thread, process | thread, process |
| concurrency, parallelism | concurrency, parallelism |
| thread safety | thread safety / an toàn luồng, chọn theo câu |
| synchronization, lock | synchronization, lock |
| memory visibility, happens-before | memory visibility, happens-before |
| deadlock, livelock, starvation | deadlock, livelock, starvation |
| race condition | race condition |
| exception, checked/unchecked exception | exception; checked/unchecked exception |
| collection, generic, type erasure | collection, generic, type erasure |
| API, SPI, reflection | API, SPI, reflection |
| dependency injection (DI) | dependency injection (DI) |
| transaction, isolation level | transaction, isolation level |
| consistency, availability, partition tolerance | consistency, availability, partition tolerance |
| distributed system | hệ thống phân tán |
| distributed lock | distributed lock / khóa phân tán |
| idempotency | tính idempotent / idempotency |
| message queue (MQ) | message queue (MQ) |
| producer, consumer, broker | producer, consumer, broker |
| offset, acknowledgment (ack) | offset, acknowledgment (ack) |
| message ordering | thứ tự message |
| at-least-once, at-most-once, exactly-once | at-least-once, at-most-once, exactly-once |
| retry, timeout, circuit breaker | retry, timeout, circuit breaker |
| rate limiting, throttling | rate limiting, throttling |
| load balancing | load balancing / cân bằng tải |
| failover, fallback, degradation | failover, fallback, degradation |
| cache, cache penetration | cache; cache penetration |
| cache breakdown, cache avalanche | cache breakdown, cache avalanche |
| sharding, partitioning, replication | sharding, partitioning, replication |
| read/write separation | read/write separation |
| microservice, monolith | microservice, monolith |
| service discovery, service registry | service discovery, service registry |
| high availability (HA) | high availability (HA) |
| high concurrency | high concurrency |
| big data | big data / dữ liệu lớn |
| time complexity, space complexity | độ phức tạp thời gian, độ phức tạp bộ nhớ |

## Quy tắc mở rộng

- Tên class/package/method/annotation/constant giữ chính xác chữ hoa thường, ví dụ `ConcurrentHashMap`, `@Transactional`, `ThreadLocal`.
- Tên công nghệ giữ nguyên: Java, Spring, Spring Boot, Spring Cloud, Dubbo, Kafka, RabbitMQ, RocketMQ, ActiveMQ, Redis, MySQL, Elasticsearch, ZooKeeper, Hystrix, Sentinel.
- Thuật ngữ trong glossary không buộc thay đổi nguyên văn token trong code hoặc tên mục chính thức.
- Khi gặp thuật ngữ mới, ghi nhận vào QA hoặc glossary của dự án sau khi đối chiếu source và cách dùng trong Java/backend; không tự mở rộng nghĩa.
