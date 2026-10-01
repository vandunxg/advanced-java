# Sự khác nhau giữa Redis và Memcached

## Câu hỏi phỏng vấn

Redis và Memcached khác nhau thế nào? Mô hình luồng của Redis là gì? Vì sao Redis chỉ dùng một luồng nhưng vẫn hỗ trợ high concurrency?

## Phân tích suy nghĩ của người phỏng vấn

Đây là câu hỏi cơ bản nhất khi phỏng vấn về Redis. Một trong những nguyên lý nội bộ và đặc điểm cơ bản nhất của Redis là trên thực tế Redis dùng **mô hình đơn luồng**. Nếu bạn còn không biết điều này thì sau đó gặp vấn đề khi dùng Redis, chẳng phải bạn sẽ không biết gì sao?

Người phỏng vấn cũng có thể hỏi sự khác nhau giữa Redis và Memcached. Memcached từng là phương án cache thường dùng ở các công ty Internet lớn nhiều năm trước, nhưng vài năm gần đây hầu như các nơi đều dùng Redis; không có mấy công ty dùng Memcached nữa.

## Phân tích câu hỏi phỏng vấn

### Redis và Memcached khác nhau thế nào?

#### Redis hỗ trợ cấu trúc dữ liệu phức tạp

So với Memcached, Redis có [nhiều kiểu dữ liệu hơn](./redis-data-types.md) và hỗ trợ nhiều thao tác dữ liệu phong phú hơn. Nếu cần cache hỗ trợ cấu trúc và thao tác phức tạp hơn thì Redis là một lựa chọn tốt.

#### Redis hỗ trợ cluster nguyên bản

Từ phiên bản Redis 3.x, Redis đã hỗ trợ chế độ cluster. Memcached không có chế độ cluster nguyên bản; cần dựa vào client để phân mảnh và ghi dữ liệu vào cluster.

#### So sánh hiệu năng

Vì Redis chỉ sử dụng **một core**, còn Memcached có thể sử dụng **nhiều core**, nên tính trung bình trên mỗi core, Redis có hiệu năng cao hơn Memcached khi lưu dữ liệu nhỏ. Với dữ liệu trên 100k thì Memcached có hiệu năng cao hơn Redis. Gần đây Redis cũng tối ưu hiệu năng lưu dữ liệu lớn, nhưng vẫn kém Memcached một chút.

### Mô hình luồng của Redis

Bên trong, Redis dùng file event handler `file event handler`; file event handler này là đơn luồng nên Redis được gọi là mô hình đơn luồng. Nó dùng cơ chế IO multiplexing để đồng thời lắng nghe nhiều socket, đưa socket phát sinh event vào hàng đợi trong bộ nhớ. Event dispatcher chọn event handler tương ứng để xử lý dựa trên loại event của socket.

Cấu trúc của file event handler gồm 4 phần:

-   Nhiều socket
-   Bộ xử lý IO multiplexing
-   Bộ phân phối file event
-   Event handler (handler chấp nhận kết nối, handler xử lý yêu cầu lệnh, handler phản hồi lệnh)

Nhiều socket có thể đồng thời phát sinh các thao tác khác nhau; mỗi thao tác tương ứng một file event khác nhau. Tuy nhiên, bộ xử lý IO multiplexing lắng nghe nhiều socket và đưa socket phát sinh event vào hàng đợi. Mỗi lần event dispatcher lấy một socket khỏi hàng đợi, nó chuyển socket cho event handler tương ứng dựa trên loại event của socket.

Hãy xem quá trình giao tiếp giữa client và Redis:

![Redis-single-thread-model](../../high-concurrency/images/redis-single-thread-model.png)

Cần hiểu rằng giao tiếp được thực hiện qua socket. Nếu chưa biết socket, bạn có thể tìm hiểu lập trình mạng socket trước.

Khi tiến trình server Redis khởi tạo, nó liên kết event `AE_READABLE` của server socket với handler chấp nhận kết nối.

Client socket01 yêu cầu thiết lập kết nối đến server socket của tiến trình Redis. Lúc này server socket phát sinh event `AE_READABLE`; bộ xử lý IO multiplexing phát hiện event của server socket rồi đưa socket đó vào hàng đợi. Bộ phân phối file event lấy socket từ hàng đợi và chuyển cho **handler chấp nhận kết nối**. Handler chấp nhận kết nối tạo một socket01 có thể giao tiếp với client, rồi liên kết event `AE_READABLE` của socket01 với handler xử lý yêu cầu lệnh.

Giả sử lúc này client gửi request `set key value`. Socket01 trong Redis phát sinh event `AE_READABLE`; bộ xử lý IO multiplexing đưa socket01 vào hàng đợi. Lúc này event dispatcher lấy event `AE_READABLE` của socket01 từ hàng đợi. Vì trước đó event `AE_READABLE` của socket01 đã được liên kết với handler xử lý yêu cầu lệnh, event dispatcher chuyển event cho handler xử lý yêu cầu lệnh. Handler xử lý yêu cầu lệnh đọc `key value` từ socket01 và thiết lập `key value` trong bộ nhớ của chính nó. Sau khi thao tác hoàn tất, nó liên kết event `AE_WRITABLE` của socket01 với handler phản hồi lệnh.

Nếu client sẵn sàng nhận kết quả trả về thì socket01 trong Redis phát sinh event `AE_WRITABLE` và cũng được đưa vào hàng đợi. Event dispatcher tìm handler phản hồi lệnh được liên kết; handler phản hồi lệnh ghi kết quả của thao tác, chẳng hạn `ok`, vào socket01, sau đó hủy liên kết event `AE_WRITABLE` của socket01 với handler phản hồi lệnh.

Như vậy một lần giao tiếp đã hoàn tất. Để tìm hiểu hệ thống về quy trình giao tiếp của Redis, khuyên bạn đọc cuốn “[Redis 设计与实现——黄健宏](https://github.com/doocs/technical-books#database)”.

### Vì sao mô hình đơn luồng của Redis vẫn hiệu quả cao?

-   Thao tác hoàn toàn trong bộ nhớ.
-   Cốt lõi dựa trên cơ chế IO multiplexing không chặn.
-   Được triển khai bằng ngôn ngữ C. Nói chung, chương trình viết bằng C “gần” hệ điều hành hơn nên tốc độ thực thi tương đối nhanh hơn.
-   Đơn luồng ngược lại tránh được vấn đề chuyển đổi context thường xuyên ở đa luồng và ngăn các vấn đề tranh chấp có thể phát sinh trong đa luồng.

### Bắt đầu từ Redis 6.0, Redis đưa vào đa luồng

**Lưu ý!** Các phiên bản sau Redis 6.0 từ bỏ thiết kế mô hình đơn luồng; **Redis vốn chạy bằng một luồng cũng bắt đầu lựa chọn sử dụng mô hình đa luồng**.

Phần trước còn nhấn mạnh hiệu quả của mô hình đơn luồng Redis, vậy tại sao giờ lại đưa vào đa luồng? Điều này thực ra cho thấy ở một số khía cạnh, đơn luồng không còn có lợi thế. Vì các system call Read/Write để đọc/ghi mạng chiếm phần lớn thời gian CPU khi Redis chạy; chuyển phần đọc/ghi mạng sang đa luồng có thể cải thiện hiệu năng đáng kể.

**Phần đa luồng của Redis chỉ dùng để xử lý việc đọc/ghi dữ liệu mạng và phân tích protocol; việc thực thi lệnh vẫn là đơn luồng.** Thiết kế này nhằm tránh việc Redis trở nên phức tạp vì đa luồng, với các vấn đề concurrency cần kiểm soát liên quan đến key, lua, transaction, LPUSH/LPOP, v.v.

### Tổng kết

Redis chọn mô hình đơn luồng để xử lý request của client chủ yếu vì CPU không phải nút thắt cổ chai của server Redis. Do đó, mức tăng hiệu năng nhờ mô hình đa luồng không bù được chi phí phát triển và bảo trì mà nó mang lại; nút thắt hiệu năng của hệ thống chủ yếu nằm ở thao tác network I/O. Redis đưa vào xử lý đa luồng cũng nhằm cải thiện hiệu năng: với một số thao tác xóa cặp key-value lớn, giải phóng không gian bộ nhớ theo cách không chặn bằng nhiều luồng (thao tác giải phóng không chặn việc đọc/ghi I/O mạng, vì việc đọc/ghi I/O mạng và thực thi lệnh giải phóng không chạy trên cùng một luồng) cũng có thể giảm thời gian chặn luồng chính Redis và nâng cao hiệu quả thực thi.
