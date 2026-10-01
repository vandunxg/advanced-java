# Chiến lược cân bằng tải và chịu lỗi cụm của Dubbo

## Câu hỏi phỏng vấn

Dubbo có những chiến lược cân bằng tải và chịu lỗi cụm nào? Còn chiến lược proxy động thì sao?

## Phân tích góc nhìn của người phỏng vấn

Hãy tiếp tục hỏi sâu hơn: đây đều là những điều cần biết khi dùng Dubbo. Bạn phải hiểu nguyên lý cơ bản, biết giao thức tuần tự hóa là gì, và biết cụ thể khi dùng Dubbo thì cân bằng tải, tính sẵn sàng cao và proxy động hoạt động ra sao.

Nói thẳng ra là để xem bạn có thông thạo Dubbo hay không:

-   Nguyên lý hoạt động của Dubbo: đăng ký dịch vụ, trung tâm đăng ký, consumer, giao tiếp qua proxy, cân bằng tải;
-   Giao tiếp mạng, tuần tự hóa: giao thức Dubbo, kết nối dài, NIO, giao thức tuần tự hóa Hessian;
-   Chiến lược cân bằng tải, chịu lỗi cụm, proxy động: các chức năng khi Dubbo chạy hoạt động thế nào? Cân bằng tải ra sao? Chịu lỗi cụm như thế nào? Tạo proxy động bằng cách nào?
-   Cơ chế SPI của Dubbo: bạn có hiểu cơ chế SPI của Dubbo không? Có thể mở rộng Dubbo dựa trên SPI như thế nào?

## Phân tích câu hỏi phỏng vấn

### Chiến lược cân bằng tải của Dubbo

#### RandomLoadBalance

Theo mặc định, Dubbo dùng RandomLoadBalance, tức gọi **ngẫu nhiên** để cân bằng tải. Có thể **đặt trọng số khác nhau** cho các instance provider; cân bằng tải sẽ dựa trên trọng số, trọng số càng cao thì lưu lượng được phân bổ càng nhiều. Thông thường dùng mặc định này là được.

Ý tưởng thuật toán rất đơn giản. Giả sử có một nhóm máy chủ servers = `[A, B, C]`, với trọng số tương ứng weights = `[5, 3, 2]`, tổng trọng số là 10. Trải các trọng số này trên một trục tọa độ một chiều: đoạn `[0, 5)` thuộc máy chủ A, đoạn `[5, 8)` thuộc máy chủ B, đoạn `[8, 10)` thuộc máy chủ C. Tiếp theo, dùng bộ tạo số ngẫu nhiên sinh một số trong phạm vi `[0, 10)`, rồi xác định số đó rơi vào đoạn nào. Ví dụ số 3 rơi vào đoạn ứng với máy chủ A, khi đó trả về máy chủ A. Máy có trọng số cao hơn sẽ có đoạn tương ứng dài hơn trên trục tọa độ, vì vậy số ngẫu nhiên có xác suất cao hơn rơi vào đoạn đó. Nếu số ngẫu nhiên do bộ tạo sinh có phân bố tốt, sau nhiều lần chọn, tỷ lệ số lần mỗi máy chủ được chọn sẽ gần với tỷ lệ trọng số của nó. Ví dụ, sau 10.000 lần chọn, máy chủ A được chọn khoảng 5000 lần, máy chủ B khoảng 3000 lần và máy chủ C khoảng 2000 lần.

#### RoundRobinLoadBalance

Mặc định cách này phân bổ lưu lượng đồng đều đến các máy, nhưng nếu hiệu năng các máy khác nhau thì máy yếu hơn dễ bị quá tải. Vì vậy cần điều chỉnh trọng số để máy yếu hơn chịu trọng số nhỏ hơn và nhận ít lưu lượng hơn.

Lấy một ví dụ.

Tôi xin máy từ đồng nghiệp vận hành; đôi khi may mắn là nguồn lực của công ty khá dồi dào, vừa có một lô máy ảo mới tinh với cấu hình khá cao: máy 8 lõi + 16G, xin được 2 máy. Sau một thời gian, chúng tôi thấy 2 máy hơi thiếu nên tôi hỏi đồng nghiệp vận hành: “Bạn có thể cấp thêm cho tôi một máy không?” Nhưng lúc đó chỉ còn một máy 4 lõi + 8G. Dù vậy tôi vẫn phải nhận.

Khi đó có thể đặt trọng số 4 cho hai máy 8 lõi 16G và trọng số 2 cho máy 4 lõi 8G còn lại.

#### LeastActiveLoadBalance

Tài liệu chính thức giải thích `LeastActiveLoadBalance` là “**cân bằng tải theo số lời gọi đang hoạt động ít nhất**”: số lời gọi đang hoạt động càng nhỏ thì hiệu suất của nhà cung cấp dịch vụ càng cao, có thể xử lý nhiều yêu cầu hơn trong một đơn vị thời gian; khi đó yêu cầu sẽ được ưu tiên phân cho nhà cung cấp dịch vụ đó.

Ý tưởng cơ bản của thuật toán cân bằng tải theo số lời gọi đang hoạt động ít nhất như sau:

Mỗi nhà cung cấp dịch vụ có một số lời gọi đang hoạt động `active` tương ứng. Ban đầu, `active` của tất cả nhà cung cấp dịch vụ đều bằng 0. Mỗi khi nhận một yêu cầu, `active` của nhà cung cấp tương ứng tăng 1; sau khi xử lý yêu cầu xong, `active` giảm 1. Vì vậy, nếu nhà cung cấp dịch vụ có hiệu năng tốt và xử lý yêu cầu nhanh thì `active` cũng giảm nhanh hơn. Do đó có thể ưu tiên phân yêu cầu cho nhà cung cấp dịch vụ đó.

Ngoài số lời gọi đang hoạt động ít nhất, `LeastActiveLoadBalance` còn đưa trọng số vào quá trình triển khai. Vì vậy, nói chính xác hơn, `LeastActiveLoadBalance` được triển khai dựa trên thuật toán số lời gọi đang hoạt động ít nhất có trọng số.

#### ConsistentHashLoadBalance

Thuật toán Consistent Hash bảo đảm các yêu cầu có cùng tham số luôn được phân phối đến cùng một provider. Khi provider ngừng hoạt động, lưu lượng còn lại được phân phối đồng đều dựa trên các nút ảo và mức dao động không quá lớn. **Nếu bạn không cần cân bằng tải ngẫu nhiên** mà muốn một nhóm yêu cầu đều đến cùng một nút, hãy dùng chiến lược Consistent Hash này.

> Xem mô tả chi tiết hơn về chiến lược cân bằng tải của Dubbo trên trang web chính thức https://dubbo.apache.org/zh/docs/advanced/loadbalance .

### Chiến lược chịu lỗi cụm của Dubbo

#### Chế độ Failover Cluster

Tự động chuyển đổi khi thất bại và tự động thử lại trên máy khác; đây là chế độ **mặc định**, thường dùng cho thao tác đọc. (Nếu thất bại thì thử lại trên máy khác.)

Có thể cấu hình số lần thử lại bằng một trong các cách sau:

```xml
<dubbo:service retries="2" />
```

Hoặc:

```xml
<dubbo:reference retries="2" />
```

Hoặc:

```xml
<dubbo:reference>
    <dubbo:method name="findFoo" retries="2" />
</dubbo:reference>
```

#### Chế độ Failfast Cluster

Lời gọi thất bại một lần thì thất bại ngay lập tức; thường dùng cho thao tác ghi không idempotent, chẳng hạn thêm một bản ghi. (Lời gọi thất bại thì lập tức thất bại.)

#### Chế độ Failsafe Cluster

Bỏ qua khi xảy ra ngoại lệ; thường dùng cho lời gọi interface không quan trọng, chẳng hạn ghi nhật ký.

Ví dụ cấu hình:

```xml
<dubbo:service cluster="failsafe" />
```

Hoặc:

```xml
<dubbo:reference cluster="failsafe" />
```

#### Chế độ Failback Cluster

Khi thất bại, tự động ghi lại yêu cầu ở chế độ nền rồi gửi lại theo lịch; khá phù hợp với việc ghi vào message queue (MQ).

#### Chế độ Forking Cluster

**Gọi song song** nhiều provider và trả về ngay khi có một provider thành công. Thường dùng cho thao tác đọc cần tính thời gian thực cao, nhưng tiêu tốn nhiều tài nguyên dịch vụ hơn. Có thể đặt số lần gọi song song tối đa bằng `forks="2"`.

#### Chế độ Broadcast Cluster

Gọi lần lượt tất cả provider. Nếu bất kỳ provider nào gặp lỗi thì báo lỗi (được hỗ trợ từ phiên bản `2.1.0`). Thường dùng để thông báo tất cả nhà cung cấp cập nhật cache hoặc tài nguyên cục bộ như nhật ký.

> Xem mô tả chi tiết hơn về chiến lược chịu lỗi cụm của Dubbo trên trang web chính thức https://dubbo.apache.org/zh/docs/advanced/fault-tolerent-strategy .

### Chiến lược proxy động của Dubbo

Mặc định sử dụng javassist để tạo bytecode động và tạo lớp proxy. Tuy nhiên, có thể cấu hình chiến lược proxy động riêng thông qua cơ chế mở rộng SPI.
