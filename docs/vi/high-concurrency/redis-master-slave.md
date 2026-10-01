# Kiến trúc Redis primary–replica

Một Redis instance đơn lẻ có thể xử lý khoảng vài chục nghìn QPS. Cache thường được dùng để hỗ trợ **đọc với high concurrency**. Vì vậy kiến trúc được triển khai theo mô hình primary-replica (master-slave): một primary và nhiều replica; primary phụ trách ghi và sao chép dữ liệu sang các replica khác, còn các node replica phụ trách đọc. **Toàn bộ request đọc đều đi qua các replica**. Cách này cũng giúp mở rộng theo chiều ngang dễ dàng, **hỗ trợ đọc với high concurrency**.

![Redis-master-slave](./images/redis-master-slave.png)

Redis replication -> kiến trúc primary-replica -> tách đọc ghi -> mở rộng theo chiều ngang để hỗ trợ đọc với high concurrency

## Cơ chế cốt lõi của Redis replication

-   Redis sao chép dữ liệu đến các node replica theo cách **bất đồng bộ**. Tuy nhiên, từ Redis 2.8, replica node định kỳ xác nhận lượng dữ liệu đã sao chép mỗi lần;
-   Một master node có thể được cấu hình với nhiều slave node;
-   Slave node cũng có thể kết nối với các slave node khác;
-   Khi slave node sao chép dữ liệu, nó không block hoạt động bình thường của master node;
-   Trong lúc sao chép, slave node cũng không block các truy vấn gửi đến chính nó; nó dùng tập dữ liệu cũ để phục vụ. Nhưng khi sao chép hoàn tất, cần xóa tập dữ liệu cũ và nạp tập dữ liệu mới; lúc đó dịch vụ sẽ tạm dừng;
-   Slave node chủ yếu dùng để mở rộng theo chiều ngang và tách đọc ghi; thêm slave node có thể tăng throughput đọc.

Lưu ý, nếu dùng kiến trúc primary-replica thì nên **bật** [persistence](./redis-persistence.md) trên master node. Không nên dùng slave node làm bản sao lưu nóng dữ liệu của master node, vì nếu tắt persistence trên master thì khi master bị sập và khởi động lại, dữ liệu có thể trống; sau đó khi replication diễn ra, dữ liệu của các slave node cũng có thể bị mất.

Ngoài ra cũng cần triển khai các phương án sao lưu khác nhau cho master. Nếu toàn bộ file cục bộ bị mất, có thể chọn một file rdb từ bản sao lưu để khôi phục master; như vậy mới **đảm bảo khi khởi động có dữ liệu**. Ngay cả khi dùng [cơ chế high availability](./redis-sentinel.md) được trình bày sau, slave node có thể tự tiếp quản master node, nhưng cũng có thể Sentinel chưa kịp phát hiện master bị lỗi thì master node đã tự khởi động lại; khi đó dữ liệu của tất cả slave node như trên vẫn có thể bị xóa.

## Nguyên lý cốt lõi của Redis primary-replica replication

Khi khởi động slave node, nó gửi lệnh `PSYNC` đến master node.

Nếu đây là lần đầu slave node kết nối với master node thì sẽ kích hoạt `full resynchronization` — sao chép toàn bộ dữ liệu. Lúc này master khởi động một luồng nền để tạo file snapshot `RDB`, đồng thời lưu vào bộ nhớ mọi lệnh ghi mới nhận từ client. Sau khi tạo xong file `RDB`, master gửi file này cho slave; slave **ghi file vào đĩa cục bộ trước rồi mới nạp vào bộ nhớ**. Tiếp theo, master gửi các lệnh ghi đang được lưu trong bộ nhớ cho slave để slave đồng bộ dữ liệu. Nếu slave node gặp sự cố mạng với master node và mất kết nối, nó sẽ tự động kết nối lại. Sau khi kết nối, master node chỉ sao chép cho slave phần dữ liệu còn thiếu.

![Redis-master-slave-replication](./images/redis-master-slave-replication.png)

### Tiếp tục replication từ điểm bị gián đoạn

Từ Redis 2.8, replication primary-replica hỗ trợ tiếp tục từ điểm bị gián đoạn. Nếu kết nối mạng bị ngắt trong quá trình replication thì có thể tiếp tục từ vị trí sao chép lần trước, thay vì sao chép lại toàn bộ từ đầu.

Master node duy trì một backlog trong bộ nhớ; master và slave đều lưu một replica offset cùng một master run id. Offset là vị trí được lưu trong backlog. Nếu kết nối mạng giữa master và slave bị ngắt, slave yêu cầu master tiếp tục sao chép từ replica offset trước đó. Nếu không tìm được offset tương ứng thì sẽ thực hiện một lần `resynchronization`.

> Nếu định vị master node bằng host + ip thì không đáng tin cậy. Nếu master node khởi động lại hoặc dữ liệu thay đổi thì slave node cần phân biệt bằng run id khác nhau.

### Replication không dùng đĩa

Master tạo `RDB` trực tiếp trong bộ nhớ rồi gửi cho slave, không ghi ra đĩa cục bộ. Chỉ cần bật `repl-diskless-sync yes` trong file cấu hình.

```bash
repl-diskless-sync yes

# 等待 5s 后再开始复制，因为要等更多 slave 重新连接过来
repl-diskless-sync-delay 5
```

### Xử lý key hết hạn

Slave không tự làm key hết hạn mà chỉ chờ master làm key hết hạn. Nếu master làm một key hết hạn hoặc loại bỏ key theo LRU thì nó sẽ giả lập một lệnh del và gửi cho slave.

## Quy trình replication đầy đủ

Khi khởi động, slave node lưu thông tin của master node tại máy cục bộ, gồm `host` và `ip` của master node, nhưng quy trình replication chưa bắt đầu.

Slave node có một tác vụ định kỳ bên trong; mỗi giây tác vụ này kiểm tra xem có master node mới nào cần kết nối và replication hay không. Nếu có, nó thiết lập kết nối mạng socket với master node. Sau đó slave node gửi lệnh `ping` đến master node. Nếu master được cấu hình requirepass thì slave node phải gửi mật khẩu masterauth để xác thực. **Lần đầu tiên, master node thực hiện sao chép toàn bộ dữ liệu** và gửi toàn bộ dữ liệu cho slave node. Từ những lần sau, master node liên tục sao chép bất đồng bộ các lệnh ghi cho slave node.

![Redis-master-slave-replication-detail](./images/redis-master-slave-replication-detail.png)

### Sao chép toàn bộ dữ liệu

-   Master thực thi bgsave và tạo một file snapshot rdb tại máy cục bộ.
-   Master node gửi file snapshot rdb cho slave node. Nếu thời gian sao chép rdb vượt quá 60 giây (repl-timeout), slave node sẽ cho rằng replication thất bại; có thể tăng giá trị tham số này lên (với máy dùng card mạng gigabit, thông thường truyền 100MB mỗi giây; file 6G rất có thể mất hơn 60 giây).
-   Khi tạo rdb, master node lưu trong bộ nhớ tất cả lệnh ghi mới. Sau khi slave node lưu rdb xong, master mới sao chép các lệnh ghi mới cho slave node.
-   Nếu trong quá trình sao chép, bộ đệm bộ nhớ liên tục dùng vượt 64MB hoặc vượt 256MB trong một lần thì dừng sao chép và replication thất bại.

```bash
client-output-buffer-limit slave 256MB 64MB 60
```

-   Sau khi nhận rdb, slave node xóa dữ liệu cũ của mình rồi nạp lại rdb vào bộ nhớ. Lưu ý, trước khi xóa dữ liệu cũ, slave node vẫn phục vụ các request **dựa trên phiên bản dữ liệu cũ**.
-   Nếu slave node bật AOF thì sẽ lập tức thực thi BGREWRITEAOF để ghi lại AOF.

### Sao chép gia tăng

-   Nếu kết nối mạng master-slave bị ngắt trong quá trình sao chép toàn bộ thì khi slave kết nối lại với master sẽ kích hoạt sao chép gia tăng.
-   Master lấy trực tiếp một phần dữ liệu bị thiếu từ backlog của mình rồi gửi cho slave node; mặc định backlog có dung lượng 1MB.
-   Master lấy dữ liệu từ backlog dựa vào offset trong psync do slave gửi.

### Heartbeat

Các node primary và replica gửi thông tin heartbeat cho nhau.

Theo mặc định, master gửi heartbeat 10 giây một lần; slave node gửi heartbeat mỗi giây một lần.

### Replication bất đồng bộ

Sau mỗi lần nhận lệnh ghi, master ghi dữ liệu nội bộ trước rồi mới gửi bất đồng bộ đến slave node.

## Làm thế nào để Redis đạt high availability

Nếu trong 365 ngày, hệ thống có thể phục vụ bên ngoài 99,99% thời gian thì hệ thống được xem là có high availability.

Một slave bị sập không ảnh hưởng đến tính khả dụng; các slave khác vẫn cung cấp dịch vụ truy vấn với cùng dữ liệu.

Nhưng nếu master node chết thì sao? Không thể ghi dữ liệu; mọi thao tác ghi cache đều thất bại. Các slave node còn tác dụng gì khi không có master để replication dữ liệu cho chúng? Khi đó hệ thống gần như không khả dụng.

Kiến trúc high availability của Redis được gọi là `failover` (**chuyển đổi dự phòng**), cũng có thể gọi là chuyển đổi primary/standby.

Quá trình tự động phát hiện master node gặp sự cố rồi tự động chuyển một slave node thành master node được gọi là chuyển đổi primary/standby. Quá trình này triển khai high availability cho kiến trúc primary-replica của Redis.

Phần sau sẽ trình bày chi tiết [high availability dựa trên Sentinel của Redis](./redis-sentinel.md).
