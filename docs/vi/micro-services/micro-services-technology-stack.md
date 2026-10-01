# Stack công nghệ microservice

## Stack công nghệ

### Phát triển microservice

Tác dụng: phát triển dịch vụ nhanh chóng.

-   Spring
-   Spring MVC
-   Spring Boot

[Spring](https://spring.io/) hiện là framework không thể thiếu đối với nhà phát triển Java Web; Spring Boot đơn giản hóa cấu hình phát triển Spring và hiện cũng là framework phổ biến trong ngành.

### Đăng ký và khám phá microservice

Tác dụng: khám phá, đăng ký và quản lý tập trung dịch vụ.

#### Eureka

-   Eureka Server: cung cấp dịch vụ đăng ký; sau khi khởi động, mỗi nút sẽ đăng ký với Eureka Server.
-   Eureka Client: đơn giản hóa thao tác tương tác với Eureka Server.
-   Spring Cloud Netflix: [GitHub](https://github.com/spring-cloud/spring-cloud-netflix), [tài liệu](https://cloud.spring.io/spring-cloud-netflix/reference/html/)

#### ZooKeeper

> ZooKeeper là dịch vụ tập trung để duy trì thông tin cấu hình, đặt tên, cung cấp đồng bộ hóa phân tán và cung cấp dịch vụ nhóm.

[ZooKeeper](https://github.com/apache/zookeeper) là dịch vụ tập trung dùng để duy trì thông tin cấu hình, đặt tên, cung cấp đồng bộ hóa phân tán và dịch vụ nhóm.

#### Khác biệt giữa ZooKeeper và Eureka

ZooKeeper bảo đảm CP, Eureka bảo đảm AP:

-   C: tính nhất quán dữ liệu;
-   A: tính sẵn sàng của dịch vụ;
-   P: khả năng chịu lỗi phân vùng mạng của dịch vụ. Trong hệ thống phân tán, không thể đồng thời thỏa mãn cả ba thuộc tính; tối đa chỉ thỏa mãn hai.

### Quản lý cấu hình microservice

Tác dụng: quản lý tập trung thông tin cấu hình của một hoặc nhiều dịch vụ.

#### [Disconf](https://github.com/knightliao/disconf)

Distributed Configuration Management Platform (nền tảng quản lý cấu hình phân tán) là một thành phần/nền tảng dùng chung, tập trung vào quản lý cấu hình cho nhiều hệ thống phân tán, cung cấp dịch vụ quản lý cấu hình thống nhất và là giải pháp thống nhất hoàn chỉnh dựa trên ZooKeeper.

#### [Spring Cloud Config](https://github.com/spring-cloud/spring-cloud-config)

#### [Apollo](https://github.com/ctripcorp/apollo)

Apollo (阿波罗) là trung tâm cấu hình phân tán do bộ phận framework của Ctrip phát triển. Công cụ này có thể quản lý tập trung cấu hình cho ứng dụng ở các môi trường và cụm khác nhau; sau khi sửa đổi cấu hình, nó có thể đẩy cấu hình đến ứng dụng theo thời gian thực, đồng thời có các tính năng về quyền hạn chuẩn hóa và quản trị quy trình, phù hợp cho quản lý cấu hình microservice.

### Xác thực và phân quyền

Tác dụng: dựa trên quy tắc hoặc chính sách bảo mật được hệ thống thiết lập, người dùng chỉ có thể truy cập những tài nguyên họ được cấp quyền, không nhiều hơn cũng không ít hơn.

#### [Spring Security](https://spring.io/projects/spring-security)

#### [Apache Shiro](http://shiro.apache.org/)

> Apache Shiro™ là framework bảo mật Java mạnh mẽ, dễ sử dụng, cung cấp xác thực, phân quyền, mật mã học và quản lý session. Với API dễ hiểu của Shiro, bạn có thể bảo vệ mọi ứng dụng một cách nhanh chóng, dễ dàng, từ ứng dụng di động nhỏ nhất đến ứng dụng web và doanh nghiệp lớn nhất.

### Xử lý hàng loạt

Tác dụng: xử lý hàng loạt dữ liệu hoặc các đối tượng cùng loại.

#### [Spring Batch](https://spring.io/projects/spring-batch)

### Tác vụ theo lịch

> Tác dụng: lên lịch công việc cần thực hiện.

#### [Quartz](http://www.quartz-scheduler.org/)

### Lời gọi microservice (giao thức)

> Giao thức truyền thông

#### REST

-   Gửi yêu cầu REST qua HTTP/HTTPS để trao đổi dữ liệu.

#### RPC

-   Lời gọi thủ tục từ xa (Remote Procedure Call)
-   Đây là giao thức yêu cầu dịch vụ từ chương trình trên máy tính từ xa qua mạng mà không cần biết công nghệ mạng bên dưới. RPC không phụ thuộc vào giao thức truyền tải mạng cụ thể; có thể dùng TCP, UDP, v.v.

#### [gRPC](https://www.grpc.io/)

> Một framework RPC đa năng, mã nguồn mở, hiệu năng cao.

Framework RPC (remote procedure call, lời gọi thủ tục từ xa) thực chất cung cấp một cơ chế để các ứng dụng giao tiếp với nhau, đồng thời tuân theo mô hình server/client. Khi sử dụng, client gọi giao diện do server cung cấp giống như gọi hàm cục bộ.

#### RMI

-   Gọi phương thức từ xa (Remote Method Invocation)
-   Gọi thuần Java

### Gọi giao diện dịch vụ

> Tác dụng: giao tiếp giữa nhiều dịch vụ

#### [Feign (HTTP)](https://github.com/OpenFeign/feign)

Các microservice của Spring Cloud Netflix cung cấp giao diện dưới dạng HTTP nên có thể dùng HttpClient của Apache hoặc RestTemplate của Spring để gọi. Feign là HTTP client tiện dụng hơn; khi sử dụng, nó giống như gọi phương thức trong dự án của mình và không tạo cảm giác đang gọi phương thức từ xa.

### Ngắt mạch dịch vụ

> Tác dụng: ngăn yêu cầu tiếp tục khi số lượng yêu cầu đạt đến ngưỡng nhất định.

#### [Hystrix](https://github.com/Netflix/Hystrix)

> Hystrix là thư viện về độ trễ và khả năng chịu lỗi, được thiết kế để cô lập điểm truy cập đến hệ thống từ xa, dịch vụ và thư viện bên thứ ba; ngăn lỗi dây chuyền và tăng khả năng phục hồi trong hệ thống phân tán phức tạp, nơi lỗi là điều không thể tránh khỏi.

#### [Sentinel](https://github.com/alibaba/Sentinel)

> Thành phần kiểm soát lưu lượng nhẹ nhưng mạnh mẽ, cung cấp độ tin cậy và giám sát cho microservice. (Thư viện Java nhẹ để kiểm soát lưu lượng, ngắt mạch và hạ cấp.)

### Cân bằng tải dịch vụ

> Tác dụng: giảm áp lực dịch vụ và tăng thông lượng.

#### [Ribbon](https://github.com/Netflix/ribbon)

> Spring Cloud Ribbon là công cụ cân bằng tải phía client dựa trên HTTP và TCP, được triển khai dựa trên Netflix Ribbon.

#### [Nginx](https://github.com/nginx/nginx)

Nginx (engine x) là máy chủ web HTTP và proxy ngược hiệu năng cao, đồng thời cũng cung cấp dịch vụ IMAP/POP3/SMTP.

#### Khác biệt giữa Nginx và Ribbon

Nginx cân bằng tải phía server, còn Ribbon cân bằng tải phía client. Nginx làm việc với Tomcat, còn Ribbon làm việc với lời gọi giữa các dịch vụ (RPC).

### Hàng đợi thông điệp

> Tác dụng: tách rời nghiệp vụ và xử lý dữ liệu bất đồng bộ.

#### [Kafka](http://kafka.apache.org/)

#### [RabbitMQ](https://www.rabbitmq.com/)

#### [RocketMQ](http://rocketmq.apache.org/)

#### [ActiveMQ](http://activemq.apache.org/)

### Thu thập nhật ký (ELK)

> Tác dụng: thu thập nhật ký từ các dịch vụ để phân tích log, xây dựng chân dung người dùng, v.v.

#### [Elasticsearch](https://github.com/elastic/elasticsearch)

#### [Logstash](https://github.com/elastic/logstash)

#### [Kibana](https://github.com/elastic/kibana)

### API Gateway

> Tác dụng: chặn và xử lý yêu cầu bên ngoài qua API Gateway, rồi chuyển tiếp đến dịch vụ thực tế.

#### [Zuul](https://github.com/Netflix/zuul)

> Zuul là dịch vụ gateway cung cấp định tuyến động, giám sát, khả năng phục hồi, bảo mật và nhiều chức năng khác.

### Giám sát dịch vụ

> Tác dụng: hiển thị tình trạng hoạt động của từng dịch vụ dưới dạng trực quan hoặc không trực quan (CPU, bộ nhớ, lượng truy cập, v.v.).

#### [Zabbix](https://github.com/jjmartres/Zabbix)

#### [Nagios](https://www.nagios.org/)

#### [Metrics](https://metrics.dropwizard.io)

### Truy vết chuỗi gọi dịch vụ

> Tác dụng: làm rõ quan hệ gọi giữa các dịch vụ.

#### [Zipkin](https://github.com/openzipkin/zipkin)

#### [Brave](https://github.com/openzipkin/brave)

### Lưu trữ dữ liệu

> Tác dụng: lưu trữ dữ liệu.

#### Cơ sở dữ liệu quan hệ

##### [MySQL](https://www.mysql.com/)

##### [Oracle](https://www.oracle.com/index.html)

##### [MS SQL](https://docs.microsoft.com/zh-cn/sql/?view=sql-server-ver15)

##### [PostgreSQL](https://www.postgresql.org/)

#### Cơ sở dữ liệu phi quan hệ

##### [MongoDB](https://www.mongodb.com/)

##### [Elasticsearch](https://github.com/elastic/elasticsearch)

### Cache

> Tác dụng: lưu trữ dữ liệu.

#### [Redis](https://redis.io/)

### Chia database và bảng

> Tác dụng: giải pháp tách database và bảng.

#### [ShardingSphere](http://shardingsphere.apache.org/)

#### [Mycat](http://www.mycat.io/)

### Triển khai dịch vụ

> Tác dụng: triển khai dự án nhanh chóng, đưa vào vận hành và tích hợp liên tục.

#### [Docker](http://www.docker.com/)

#### [Jenkins](https://jenkins.io/zh/)

#### [Kubernetes (K8s)](https://kubernetes.io/)

#### [Mesos](http://mesos.apache.org/)
