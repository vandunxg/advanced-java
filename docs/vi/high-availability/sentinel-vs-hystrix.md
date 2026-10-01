# Nên chọn công nghệ nào? Sentinel hay Hystrix?

Sentinel là một component nhẹ để kiểm soát lưu lượng và đảm bảo high availability, hướng đến kiến trúc dịch vụ phân tán, do đội ngũ middleware của Alibaba phát triển và chính thức mã nguồn mở vào tháng 7 năm 2018. Sentinel lấy lưu lượng làm trọng tâm, giúp người dùng nâng cao stability của service thông qua nhiều khía cạnh như kiểm soát lưu lượng, circuit breaking và degradation, bảo vệ tải hệ thống. Có thể bạn sẽ hỏi: Sentinel khác gì và giống gì với thư viện circuit breaking/degradation Netflix Hystrix thường dùng trước đây? Bài viết này so sánh Sentinel và Hystrix từ các góc độ như mô hình tài nguyên và mô hình thực thi, thiết kế isolation, circuit breaking/degradation và thiết kế thống kê metric thời gian thực; hy vọng sẽ giúp developer khi cần lựa chọn công nghệ.

Địa chỉ dự án Sentinel: https://github.com/alibaba/Sentinel

## Tổng quan

Trước tiên hãy xem phần giới thiệu chính thức về Hystrix:

> Hystrix is a library that helps you control the interactions between these distributed services by adding latency tolerance and fault tolerance logic. Hystrix does this by isolating points of access between the services, stopping cascading failures across them, and providing fallback options, all of which improve your system’s overall resiliency.

Có thể thấy Hystrix tập trung vào cơ chế chịu lỗi, chủ yếu dựa trên isolation và circuit breaking. Lời gọi bị timeout hoặc bị circuit breaker ngắt sẽ thất bại nhanh, đồng thời có thể cung cấp cơ chế fallback.

Sentinel tập trung vào các điểm sau:

-   Kiểm soát lưu lượng đa dạng
-   Circuit breaking và degradation
-   Bảo vệ tải hệ thống
-   Giám sát thời gian thực và console

Hai bên giải quyết các vấn đề khá khác nhau; dưới đây chúng ta sẽ so sánh cụ thể.

## Đặc điểm chung

### 1. So sánh mô hình tài nguyên và mô hình thực thi

Về thiết kế mô hình tài nguyên, Hystrix dùng command pattern, đóng gói lời gọi đến tài nguyên bên ngoài và logic fallback thành một đối tượng command `HystrixCommand` hoặc `HystrixObservableCommand`; việc thực thi bên dưới dựa trên RxJava. Khi tạo mỗi Command, cần chỉ định `commandKey`, `groupKey` (dùng để phân biệt resource) và chiến lược isolation tương ứng (isolation thread pool hoặc isolation semaphore). Với chế độ isolation thread pool, cần cấu hình các tham số của thread pool (tên, dung lượng, thời gian chờ trong queue, v.v.); sau đó Command sẽ thực thi trong thread pool được chỉ định theo chiến lược chịu lỗi đã cấu hình. Với chế độ isolation semaphore, cần cấu hình concurrency tối đa; khi thực thi Command, Hystrix sẽ giới hạn số lời gọi đồng thời.

**Lưu ý**: Để xem giới thiệu chi tiết và demo code về Hystrix, tham khảo phần Hystrix trong [kiến trúc high availability](./README.md) của dự án này.

Thiết kế của Sentinel đơn giản hơn. So với việc Hystrix Command phụ thuộc chặt vào rule isolation, định nghĩa resource của Sentinel ít bị kết hợp với cấu hình rule hơn. Command của Hystrix phụ thuộc chặt vào cấu hình rule isolation vì rule isolation ảnh hưởng trực tiếp đến quá trình thực thi Command. Khi thực thi, Hystrix phân tích rule isolation của Command để tạo RxJava Scheduler và lập lịch thực thi trên đó. Nếu là chế độ thread pool, thread pool bên dưới Scheduler là thread pool đã cấu hình; nếu là chế độ semaphore, nó chỉ được đóng gói thành Scheduler thực thi trên thread hiện tại.

Sentinel thì khác: khi phát triển, chỉ cần cân nhắc method/code này có cần được bảo vệ hay không; có thể thay đổi động theo thời gian thực cách bảo vệ bất cứ lúc nào.

Từ phiên bản `0.1.1`, Sentinel còn hỗ trợ định nghĩa resource dựa trên annotation; có thể chỉ định hàm xử lý exception và hàm fallback thông qua tham số annotation. Sentinel cung cấp nhiều cách cấu hình rule. Ngoài việc đăng ký rule trực tiếp vào bộ nhớ bằng API `loadRules`, người dùng có thể đăng ký nhiều external data source để cung cấp rule động. Người dùng có thể thay đổi động cấu hình rule theo tình hình thời gian thực hiện tại của hệ thống; data source sẽ đẩy thay đổi đến Sentinel và rule có hiệu lực ngay lập tức.

### 2. So sánh thiết kế isolation

Isolation là một trong những chức năng cốt lõi của Hystrix. Hystrix cung cấp hai chiến lược isolation: thread pool isolation `Bulkhead Pattern` và semaphore isolation; trong đó **thread pool isolation** được khuyến nghị và dùng phổ biến nhất. Thread pool isolation của Hystrix tạo thread pool riêng cho từng resource; các lời gọi đến service khác nhau chạy trong các thread pool khác nhau. Khi xảy ra tình trạng block như xếp hàng trong thread pool hoặc timeout, lời gọi có thể thất bại nhanh và cung cấp cơ chế fallback. Ưu điểm của thread pool isolation là mức độ cô lập cao; có thể xử lý thread pool của một resource mà không ảnh hưởng resource khác. Đổi lại, chi phí chuyển đổi context giữa các thread tương đối lớn, đặc biệt ảnh hưởng đáng kể đến các lời gọi có độ trễ thấp.

Tuy nhiên, trong thực tế, thread pool isolation không mang lại quá nhiều lợi ích. Ảnh hưởng trực tiếp nhất là làm phân mảnh tài nguyên máy. Xét một tình huống phổ biến: dùng Hystrix trong servlet container như Tomcat; bản thân Tomcat đã có rất nhiều thread (có thể vài chục hoặc hơn một trăm). Nếu cộng thêm thread pool Hystrix tạo cho từng resource, tổng số thread sẽ rất lớn (vài trăm thread), khiến chi phí chuyển đổi context tăng cao. Ngoài ra, khả năng isolation triệt để của chế độ thread pool cho phép Hystrix xử lý riêng tình trạng xếp hàng và timeout của thread pool thuộc các resource khác nhau. Nhưng đây vốn là những vấn đề timeout/circuit breaking và kiểm soát lưu lượng cần giải quyết; nếu component đã có khả năng timeout/circuit breaking và kiểm soát lưu lượng thì thread pool isolation không còn cần thiết đến vậy.

Semaphore isolation của Hystrix giới hạn số lời gọi đồng thời đến một resource. Kiểu isolation này rất nhẹ: chỉ giới hạn số lời gọi đồng thời đến resource, chứ không tạo thread pool tường minh, nên overhead thấp nhưng hiệu quả tốt. Tuy nhiên, nhược điểm là không thể tự động degradation các lời gọi chậm; chỉ có thể chờ client tự timeout, vì vậy vẫn có thể xảy ra block dây chuyền.

Sentinel có thể cung cấp chức năng semaphore isolation thông qua kiểm soát lưu lượng theo chế độ số lượng thread đồng thời. Kết hợp với chế độ circuit breaking/degradation dựa trên thời gian phản hồi, khi thời gian phản hồi trung bình của resource không ổn định ở mức cao, hệ thống có thể tự động degradation để tránh quá nhiều lời gọi chậm chiếm hết concurrency và ảnh hưởng toàn hệ thống.

### 3. So sánh circuit breaking và degradation

Về bản chất, chức năng circuit breaking/degradation của Sentinel và Hystrix đều dựa trên Circuit Breaker Pattern. Cả Sentinel và Hystrix đều hỗ trợ circuit breaking/degradation dựa trên tỷ lệ thất bại (tỷ lệ exception): khi số lần gọi đạt đến một mức nhất định và tỷ lệ thất bại đạt ngưỡng đã đặt, hệ thống tự động ngắt mạch. Khi đó, mọi lời gọi đến resource đều bị block cho đến khi hết time window chỉ định thì mới thử khôi phục. Như đã nói ở trên, Sentinel còn hỗ trợ circuit breaking/degradation dựa trên thời gian phản hồi trung bình; khi thời gian phản hồi của service liên tục tăng vọt, hệ thống tự động ngắt mạch và từ chối thêm request, rồi mới khôi phục sau một khoảng thời gian. Cách này có thể ngăn block dây chuyền do lời gọi quá chậm.

### 4. So sánh cách triển khai thống kê metric thời gian thực

Việc thống kê dữ liệu metric thời gian thực của Hystrix và Sentinel đều dựa trên cửa sổ trượt. Các phiên bản trước Hystrix 1.5 dùng mảng vòng để thực hiện cửa sổ trượt; thao tác thống kê của mỗi bucket được cập nhật bằng cách kết hợp lock và CAS. Từ Hystrix 1.5, phần triển khai thống kê metric thời gian thực được tái cấu trúc; cấu trúc dữ liệu metric được trừu tượng hóa thành dạng reactive stream để consumer dễ sử dụng thông tin metric. Đồng thời, phần bên dưới được chuyển sang mô hình hướng sự kiện dựa trên RxJava. Khi lời gọi service thành công/thất bại/timeout, hệ thống phát sự kiện tương ứng; qua một loạt phép biến đổi và tổng hợp, cuối cùng tạo ra luồng dữ liệu metric thời gian thực để circuit breaker hoặc Dashboard sử dụng.

Hiện tại Sentinel đã trừu tượng hóa giao diện thống kê metric Metric; phần bên dưới có thể có nhiều cách triển khai. Cách triển khai mặc định hiện nay là cửa sổ trượt dựa trên LeapArray; sau này có thể bổ sung các cách triển khai như reactive stream tùy theo nhu cầu.

## Đặc điểm của Sentinel

Ngoài các đặc điểm chung của hai bên đã nêu trước đó, Sentinel còn cung cấp các tính năng sau:

### 1. Nhẹ và hiệu năng cao

Là component kiểm soát lưu lượng high availability đầy đủ chức năng, sentinel-core cốt lõi của Sentinel không có dependency dư thừa nào; sau khi đóng gói chỉ chưa đến 200KB nên rất nhẹ. Developer có thể yên tâm đưa sentinel-core vào mà không phải lo vấn đề dependency. Đồng thời, Sentinel cung cấp nhiều extension point để người dùng dễ mở rộng theo nhu cầu và tích hợp liền mạch vào Sentinel.

Chi phí hiệu năng khi đưa Sentinel vào rất nhỏ. Chỉ khi lưu lượng của một máy vượt quá 250K QPS thì mới có ảnh hưởng rõ rệt (khoảng 5%–10%); khi QPS trên một máy không quá lớn, chi phí gần như không đáng kể.

### 2. Kiểm soát lưu lượng

Sentinel có thể kiểm soát lưu lượng gọi resource dựa trên các quan hệ gọi khác nhau và các chỉ số vận hành khác nhau (như QPS, số lời gọi đồng thời, tải hệ thống, v.v.), điều chỉnh các request ngẫu nhiên thành hình dạng phù hợp.

Sentinel hỗ trợ nhiều chiến lược điều chỉnh lưu lượng. Khi QPS quá cao, hệ thống có thể tự động điều chỉnh lưu lượng thành hình dạng phù hợp. Các chế độ thường dùng gồm:

-   **Chế độ từ chối trực tiếp**: từ chối trực tiếp các request vượt ngưỡng.
-   **Chế độ khởi động chậm/làm nóng**: khi lưu lượng tăng đột biến, kiểm soát tốc độ lưu lượng đi qua; tăng dần lưu lượng trong một khoảng thời gian cho đến ngưỡng tối đa, tạo thời gian làm nóng hệ thống lạnh và tránh làm hệ thống bị quá tải.
    ![Slow-Start-Preheating-Mode](../../high-availability/images/Slow-Start-Preheating-Mode.jpg)

-   **Chế độ điều tốc đều**: chế độ đều được triển khai bằng thuật toán Leaky Bucket, kiểm soát chặt chẽ khoảng thời gian giữa các request được phép đi qua; các request tích tụ sẽ xếp hàng, request vượt quá thời lượng timeout sẽ bị từ chối trực tiếp. Sentinel cũng hỗ trợ rate limit dựa trên quan hệ gọi, bao gồm rate limit theo bên gọi, theo entry point của call chain, theo lưu lượng liên quan, v.v. Dựa vào thông tin thống kê call chain mạnh mẽ của Sentinel, hệ thống có thể cung cấp rate limit chính xác theo nhiều chiều khác nhau.
    ![Homogenizer-mode](../../high-availability/images/Homogenizer-mode.jpg)

Hiện Sentinel chưa hỗ trợ tốt call chain bất đồng bộ; các phiên bản sau sẽ tập trung cải thiện hỗ trợ lời gọi bất đồng bộ.

### 3. Bảo vệ tải hệ thống

Sentinel cung cấp bảo vệ ở cấp độ hệ thống; thuật toán bảo vệ tải lấy ý tưởng từ TCP BBR. Khi tải hệ thống cao mà vẫn tiếp tục cho request đi vào thì hệ thống có thể sập và không thể phản hồi. Trong môi trường cluster, load balancer mạng có thể chuyển lưu lượng mà máy này đáng lẽ phải gánh sang các máy khác. Nếu những máy khác lúc đó cũng đang ở trạng thái cận ngưỡng, lượng lưu lượng tăng thêm có thể khiến các máy đó sập, cuối cùng làm toàn bộ cluster không khả dụng. Với tình huống này, Sentinel cung cấp cơ chế bảo vệ tương ứng để cân bằng lưu lượng đầu vào và tải hệ thống, đảm bảo hệ thống xử lý được nhiều request nhất trong phạm vi năng lực của mình.

![BRP](../../high-availability/images/BRP.jpg)

### 4. Giám sát thời gian thực và control panel

Sentinel cung cấp HTTP API để lấy thông tin giám sát thời gian thực, chẳng hạn thống kê call chain, thông tin cụm điểm, thông tin rule, v.v. Nếu người dùng đang dùng Spring Boot/Spring Cloud và Sentinel Spring Cloud Starter, họ cũng có thể dễ dàng lấy một số thông tin runtime như rule động thông qua Actuator Endpoint mà starter này expose. Trong tương lai, Sentinel sẽ hỗ trợ API giám sát metric chuẩn hóa để dễ dàng tích hợp với nhiều hệ thống giám sát và trực quan hóa như Prometheus, Grafana, v.v.

Sentinel Dashboard cung cấp các chức năng phát hiện máy, cấu hình rule, xem giám sát thời gian thực và xem thông tin call chain, giúp người dùng dễ dàng xem giám sát và cấu hình.

![Sentinel-Dashboard](../../high-availability/images/Sentinel-Dashboard.jpg)

### 5. Hệ sinh thái

Hiện tại Sentinel đã được tích hợp với Servlet, Dubbo, Spring Boot/Spring Cloud, gRPC, v.v. Người dùng chỉ cần thêm dependency tương ứng và cấu hình đơn giản là có thể dễ dàng sử dụng khả năng bảo vệ lưu lượng high availability của Sentinel. Trong tương lai, Sentinel sẽ tích hợp thêm nhiều framework phổ biến và cung cấp khả năng bảo vệ lưu lượng cluster cho Service Mesh.

## Tổng kết

| #              | Sentinel                                             | Hystrix                       |
| -------------- | ---------------------------------------------------- | ----------------------------- |
| Chiến lược isolation | Isolation semaphore                              | Isolation thread pool/isolation semaphore |
| Chiến lược circuit breaking/degradation | Dựa trên thời gian phản hồi hoặc tỷ lệ thất bại | Dựa trên tỷ lệ thất bại |
| Triển khai metric thời gian thực | Cửa sổ trượt                         | Cửa sổ trượt (dựa trên RxJava) |
| Cấu hình rule   | Hỗ trợ nhiều data source                             | Hỗ trợ nhiều data source      |
| Khả năng mở rộng | Nhiều extension point                               | Dạng plugin                  |
| Hỗ trợ dựa trên annotation | Có                                       | Có                            |
| Rate limit      | Dựa trên QPS, hỗ trợ rate limit theo quan hệ gọi     | Không hỗ trợ                  |
| Điều chỉnh lưu lượng | Hỗ trợ chế độ khởi động chậm, điều tốc đều        | Không hỗ trợ                  |
| Bảo vệ tải hệ thống | Có                                                | Không hỗ trợ                  |
| Console         | Dùng ngay được, cấu hình rule, xem giám sát theo giây, phát hiện máy, v.v. | Chưa hoàn thiện |
| Tích hợp framework phổ biến | Servlet, Spring Cloud, Dubbo, gRPC           | Servlet, Spring Cloud Netflix |
