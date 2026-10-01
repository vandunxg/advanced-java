# Các quy trình gọi chính của thành phần khám phá dịch vụ Eureka

## Lời nói đầu

Kiến trúc microservice phổ biến hiện nay đang thay đổi cách chúng ta xây dựng ứng dụng: chuyển từ một dịch vụ đơn khối duy nhất sang các dịch vụ ngày càng nhỏ hơn, có thể triển khai độc lập (gọi là `microservice`), cùng nhau tạo thành ứng dụng. Khi xử lý một nghiệp vụ, việc nhiều dịch vụ gọi lẫn nhau là khó tránh khỏi. Giả sử dịch vụ A cần truy cập dịch vụ B được triển khai trên máy chủ khác; trước hết A phải biết địa chỉ IP của máy chạy B và cổng tương ứng với dịch vụ đó. Cách đơn giản nhất là để A tự duy trì cấu hình của B (bao gồm địa chỉ IP, cổng, v.v.), nhưng cách này có một số nhược điểm rõ ràng: khi số lượng dịch vụ được gọi tăng lên thì phải duy trì tệp cấu hình như thế nào; thiếu linh hoạt — nếu địa chỉ IP hoặc cổng của B thay đổi thì A cũng phải sửa cấu hình tương ứng; và việc tự động mở rộng hoặc thu hẹp dịch vụ cũng bất tiện.
Một giải pháp tốt hơn là `khám phá dịch vụ (Service Discovery)`. Giải pháp này tạo ra một trung tâm đăng ký. Khi dịch vụ mới khởi chạy, nó đăng ký IP và cổng của mình với trung tâm đăng ký, đồng thời trung tâm định kỳ kiểm tra heartbeat của các dịch vụ đã đăng ký và gỡ dịch vụ khỏi trung tâm nếu phát hiện trạng thái bất thường. Dịch vụ A chỉ cần lấy thông tin của B từ trung tâm đăng ký; ngay cả khi IP hoặc cổng của B thay đổi, A cũng không cần sửa đổi, nhờ đó giảm sự phụ thuộc giữa hai dịch vụ. Hiện nay có nhiều triển khai mã nguồn mở về khám phá dịch vụ trong ngành, chẳng hạn [zookeeper](https://github.com/apache/zookeeper) của `apache`, [eureka](https://github.com/Netflix/eureka) của `Netflix`, [consul](https://github.com/hashicorp/consul) của `hashicorp`, và [etcd](https://github.com/etcd-io/etcd) của `CoreOS`.

## Eureka là gì?

Định nghĩa về `Eureka` trên [GitHub](https://github.com/Netflix/eureka):

> Eureka is a REST (Representational State Transfer) based service that is primarily used in the AWS cloud for locating services for the purpose of load balancing and failover of middle-tier servers.

At Netflix, Eureka is used for the following purposes apart from playing a critical part in mid-tier load balancing.

`Eureka` là thành phần đăng ký và khám phá dịch vụ do [Netflix](https://www.netflix.com) phát hành mã nguồn mở, được thiết kế theo mô hình Client / Server, phát triển dựa trên giao thức HTTP và Restful API. Thành phần này cung cấp đầy đủ chức năng đăng ký và khám phá dịch vụ, đồng thời tích hợp liền mạch với `Spring Cloud`. Server đóng vai trò trung tâm đăng ký dịch vụ, chủ yếu cung cấp cho Client các chức năng đăng ký và khám phá, duy trì thông tin đăng ký dịch vụ của Client, định kỳ kiểm tra heartbeat của các dịch vụ đã đăng ký và gỡ các dịch vụ không khả dụng. Client có thể lấy thông tin đăng ký của các dịch vụ phụ thuộc từ Server để gọi lẫn nhau. Đáng tiếc là theo [GitHub wiki](https://github.com/Netflix/eureka/wiki) chính thức, phiên bản 2.0 không còn là mã nguồn mở. Tuy nhiên, điều đó không ảnh hưởng đến việc tìm hiểu sâu về Eureka, vì đăng ký và khám phá dịch vụ vẫn là những khái niệm cơ bản, phổ biến; các framework mã nguồn mở khác cũng có tư tưởng tương tự.

## Trung tâm đăng ký dịch vụ (Eureka Server)

Thêm các dependency liên quan đến `Eureka Server` vào dự án, rồi thêm annotation `@EnableEurekaServer` vào lớp khởi chạy để dùng dự án làm trung tâm đăng ký. Sau khi khởi động dịch vụ, truy cập trang như sau:

![eureka-server-homepage.png](../../micro-services/images/eureka-server-homepage.png)

Tiếp tục thêm hai mô-đun `service-provider` và `service-consumer`, thêm annotation `@EnableEurekaClient` vào lớp khởi chạy và chỉ định địa chỉ trung tâm đăng ký là `Eureka Server` vừa khởi động. Khi truy cập lại, có thể thấy hai dịch vụ đã được đăng ký.

![eureka-instance-registered-currently.png](../../micro-services/images/eureka-instance-registered-currently.png)

Có thể thấy sử dụng `Eureka` rất đơn giản: chỉ cần thêm một vài annotation và cấu hình là có thể đăng ký và khám phá dịch vụ. Tiếp theo, hãy xem các chức năng này được triển khai như thế nào.

### Đăng ký dịch vụ (Register)

Trung tâm đăng ký cung cấp giao diện đăng ký dịch vụ, được gọi khi dịch vụ mới khởi chạy để đăng ký dịch vụ, hoặc khi heartbeat phát hiện trạng thái dịch vụ bất thường để thay đổi trạng thái tương ứng. Đăng ký dịch vụ là gửi yêu cầu `POST` kèm thông tin instance hiện tại đến phương thức `addInstance` của lớp `ApplicationResource`.

![eureka-server-applicationresource-addinstance.png](../../micro-services/images/eureka-server-applicationresource-addinstance.png)

Có thể thấy phương thức này gọi phương thức `register` của lớp `PeerAwareInstanceRegistryImpl`. Phương thức này chủ yếu gồm hai bước:

1. Gọi phương thức `register` của lớp cha `AbstractInstanceRegistry` để đăng ký dịch vụ hiện tại với trung tâm đăng ký;
2. Gọi phương thức `replicateToPeers` theo cách bất đồng bộ để đồng bộ thông tin đăng ký dịch vụ sang các nút `Eureka Server` khác.

Thông tin đăng ký dịch vụ được lưu trong một `map` lồng nhau, có cấu trúc như sau:

![eureka-server-registry-structure.png](../../micro-services/images/eureka-server-registry-structure.png)

`key` của `map` tầng thứ nhất là tên ứng dụng (ứng với `SERVICE-PROVIDER` trong `Demo`); `key` của `map` tầng thứ hai là tên instance tương ứng với ứng dụng (ứng với `mghio-mbp:service-provider:9999` trong `Demo`). Một ứng dụng có thể có nhiều instance; quy trình gọi chính như sơ đồ dưới đây:

![eureka-server-register-sequence-chart.png](../../micro-services/images/eureka-server-register-sequence-chart.png)

### Gia hạn dịch vụ (Renew)

Nhà cung cấp dịch vụ (chẳng hạn `service-provider` trong `Demo`) định kỳ gia hạn dịch vụ, tương tự heartbeat, để thông báo trạng thái của mình cho trung tâm đăng ký `Eureka Server` và tránh bị `Eureka Server` cho là đã ngừng hoạt động rồi gỡ xuống. Gia hạn dịch vụ là gửi yêu cầu `PUT` kèm thông tin instance hiện tại đến phương thức `renewLease` của lớp `InstanceResource`.

![eureka-server-instanceresource-renew.png](../../micro-services/images/eureka-server-instanceresource-renew.png)

Trong phương thức `renew` của `PeerAwareInstanceRegistryImpl`, có thể thấy các bước gia hạn dịch vụ nhìn chung giống với đăng ký dịch vụ: trước tiên cập nhật trạng thái của nút `Eureka Server` hiện tại; sau khi gia hạn thành công, đồng bộ trạng thái sang các nút `Eureka Server` khác theo cách bất đồng bộ. Quy trình gọi chính như sơ đồ dưới đây:

![eureka-server-renew-sequence-chart.png](../../micro-services/images/eureka-server-renew-sequence-chart.png)

### Gỡ dịch vụ (Cancel)

Khi nhà cung cấp dịch vụ (chẳng hạn `service-provider` trong `Demo`) dừng dịch vụ, nó gửi yêu cầu để thông báo cho trung tâm đăng ký `Eureka Server` gỡ dịch vụ, tránh để consumer gọi dịch vụ không còn tồn tại từ trung tâm đăng ký. Gỡ dịch vụ là gửi yêu cầu `DELETE` kèm thông tin instance hiện tại đến phương thức `cancelLease` của lớp `InstanceResource`.

![eureka-server-instanceresource-cancellease.png](../../micro-services/images/eureka-server-instanceresource-cancellease.png)

Trong phương thức `cancel` của `PeerAwareInstanceRegistryImpl`, có thể thấy các bước gia hạn dịch vụ nhìn chung giống với đăng ký dịch vụ: trước tiên gỡ dịch vụ khỏi nút `Eureka Server` hiện tại; sau khi gỡ thành công, đồng bộ trạng thái sang các nút `Eureka Server` khác theo cách bất đồng bộ. Quy trình gọi chính như sơ đồ dưới đây:

![eureka-server-cancellease-sequence-chart.png](../../micro-services/images/eureka-server-cancellease-sequence-chart.png)

### Loại bỏ dịch vụ (Eviction)

Khi khởi động, trung tâm đăng ký `Eureka Server` chạy một luồng nền `evictionTimer` để định kỳ (mặc định `60` giây) kiểm tra dịch vụ. Tiêu chí loại bỏ là dịch vụ không thực hiện `Renew` trong một khoảng thời gian nhất định; thời gian hết hạn mặc định là `90` giây. Nghĩa là nếu dịch vụ đã đăng ký không gia hạn dịch vụ (`Renew`) với trung tâm đăng ký `Eureka Server` trong `90` giây thì sẽ bị loại khỏi trung tâm đăng ký. Có thể sửa thời gian hết hạn bằng cấu hình `eureka.instance.leaseExpirationDurationInSeconds`; có thể sửa khoảng thời gian kiểm tra định kỳ bằng cấu hình `eureka.server.evictionIntervalTimerInMs`. Quy trình gọi chính như sơ đồ dưới đây:

![eureka-server-evict-sequence-chart.png](../../micro-services/images/eureka-server-evict-sequence-chart.png)

## Nhà cung cấp dịch vụ (Service Provider)

Đối với phía cung cấp dịch vụ (chẳng hạn dịch vụ `service-provider` trong `Demo`), có ba loại thao tác chính: `đăng ký dịch vụ (Register)`, `gia hạn dịch vụ (Renew)` và `gỡ dịch vụ (Cancel)`. Tiếp theo, hãy xem cách triển khai ba thao tác này.

### Đăng ký dịch vụ (Register)

Để cung cấp dịch vụ ra bên ngoài, trước hết dịch vụ phải đăng ký thông tin liên quan với trung tâm đăng ký `Eureka Server`. Để làm được điều này, cần cấu hình `eureka.client.register-with-eureka=true`; giá trị mặc định là `true`. Trung tâm đăng ký không cần tự đăng ký với chính nó, nên đặt cấu hình này thành `false`. Lời gọi này khá đơn giản; quy trình chính như sơ đồ dưới đây:

![eureka-service-provider-register-sequence-chart.png](../../micro-services/images/eureka-server-register-sequence-chart.png)

### Gia hạn dịch vụ (Renew)

Phía nhà cung cấp dịch vụ định kỳ gửi heartbeat (mặc định `30` giây), chủ yếu để thông báo với trung tâm đăng ký `Eureka Server` rằng trạng thái vẫn bình thường và dịch vụ vẫn hoạt động. Có thể thay đổi bằng cấu hình `eureka.instance.lease-renewal-interval-in-seconds`. Tất nhiên, để gia hạn dịch vụ cần cấu hình `eureka.client.register-with-eureka=true` để đăng ký dịch vụ với trung tâm đăng ký. Quy trình gọi chính như sơ đồ dưới đây:

![eureka-service-provider-renew-sequence-chart.png](../../micro-services/images/eureka-service-provider-renew-sequence-chart.png)

### Gỡ dịch vụ (Cancel)

Khi dịch vụ ở phía nhà cung cấp dừng, nó phải gửi yêu cầu `DELETE` để thông báo với trung tâm đăng ký `Eureka Server` rằng mình đã ngừng hoạt động, để trung tâm đăng ký gỡ dịch vụ và tránh cho phía consumer lấy dịch vụ không khả dụng từ trung tâm đăng ký. Quy trình này được triển khai khá đơn giản: phương thức `shutdown` trong lớp `DiscoveryClient` được gắn annotation `@PreDestroy`; khi dịch vụ dừng, thao tác gỡ dịch vụ sẽ tự động được kích hoạt. Quy trình gọi chính như sơ đồ dưới đây:

![eureka-service-provider-cancel-sequence-chart.png](../../micro-services/images/eureka-service-provider-cancel-sequence-chart.png)

## Consumer dịch vụ (Service Consumer)

Nếu consumer dịch vụ này không cần được các dịch vụ khác gọi đến thì chỉ liên quan đến hai thao tác: `lấy danh sách dịch vụ (Fetch)` từ trung tâm đăng ký và `cập nhật danh sách dịch vụ (Update)`. Nếu đồng thời cần đăng ký với trung tâm đăng ký để cung cấp dịch vụ ra bên ngoài thì các bước còn lại giống với phía nhà cung cấp dịch vụ đã nói ở trên, không trình bày lại ở đây. Tiếp theo, hãy xem cách triển khai hai thao tác này.

### Lấy danh sách dịch vụ (Fetch)

Sau khi khởi động, consumer dịch vụ trước tiên cần lấy danh sách dịch vụ khả dụng từ trung tâm đăng ký `Eureka Server` và đồng thời lưu một bản cache cục bộ. Thao tác lấy danh sách này được thực hiện khi dịch vụ khởi động và instance của lớp `DiscoverClient` được khởi tạo.

![eureka-service-consumer-fetchregistry.png](../../micro-services/images/eureka-service-consumer-fetchregistry.png)

Có thể thấy để thực hiện thao tác lấy danh sách dịch vụ thì cần cấu hình `eureka.client.fetch-registry=true`; giá trị mặc định là `true`. Quy trình gọi chính như sơ đồ dưới đây:

![eureka-service-consumer-fetch-sequence-chart.png](../../micro-services/images/eureka-service-consumer-fetch-sequence-chart.png)

### Cập nhật danh sách dịch vụ (Update)

Như đã thấy trong quy trình `lấy danh sách dịch vụ (Fetch)` ở trên, một bản sao cũng được lưu cục bộ. Vì vậy, cần định kỳ lấy cấu hình dịch vụ mới nhất từ trung tâm đăng ký `Eureka Server`, so sánh rồi cập nhật cache cục bộ. Có thể sửa khoảng thời gian cập nhật bằng cấu hình `eureka.client.registry-fetch-interval-seconds`; mặc định là `30` giây. Để thực hiện cập nhật danh sách dịch vụ, cần cấu hình `eureka.client.register-with-eureka=true`; giá trị mặc định là `true`. Quy trình gọi chính như sơ đồ dưới đây:

![eureka-service-consumer-update-sequence-chart.png](../../micro-services/images/eureka-service-consumer-update-sequence-chart.png)

## Tổng kết

Trong công việc, dự án sử dụng stack công nghệ `Spring Cloud`, có bộ mã nguồn mở rất hoàn chỉnh để tích hợp `Eureka` nên sử dụng rất tiện lợi. Trước đây chỉ cần thêm annotation và sửa một vài thuộc tính cấu hình là xong; tôi chưa tìm hiểu sâu cách triển khai trong mã nguồn. Bài viết này chủ yếu trình bày các quy trình liên quan như đăng ký và khám phá dịch vụ cùng cách triển khai, giúp hiểu sâu hơn về thành phần khám phá dịch vụ `Eureka`.

---

Bài viết tham khảo

[Netflix Eureka](https://github.com/Netflix/eureka)

[Service Discovery in a Microservices Architecture](https://www.nginx.com/blog/service-discovery-in-a-microservices-architecture)
