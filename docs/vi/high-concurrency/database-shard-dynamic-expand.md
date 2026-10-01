# Phương án mở rộng và thu hẹp quy mô động

## Câu hỏi phỏng vấn

Làm thế nào để thiết kế phương án sharding database và table có thể mở rộng, thu hẹp quy mô động?

## Phân tích suy nghĩ của người phỏng vấn

Đối với sharding database và table, chủ yếu cần đối mặt với các vấn đề sau:

-   Chọn một database middleware, nghiên cứu, học và kiểm thử;
-   Thiết kế phương án sharding database và table, quyết định chia thành bao nhiêu database và mỗi database chia thành bao nhiêu table, chẳng hạn 3 database, mỗi database có 4 table;
-   Dựa trên database middleware đã chọn và môi trường sharding database/table được dựng trong môi trường kiểm thử, kiểm tra xem việc đọc/ghi sau khi sharding có diễn ra bình thường hay không;
-   Hoàn thành **migration** từ một database/một table sang sharding database/table và triển khai phương án dual write;
-   Hệ thống production bắt đầu cung cấp dịch vụ dựa trên sharding database/table;
-   Khi mở rộng, chẳng hạn thành 6 database, mỗi database cần 12 table, làm sao thêm database và table?

Đây là việc bạn buộc phải đối mặt: bạn đã thiết lập phương án sharding database/table, tạo xong một loạt database và table, hoàn thành việc phát triển code dựa trên middleware sharding database/table và kiểm thử đều ổn. Dữ liệu được phân phối đồng đều vào từng database và table; sau đó bạn đưa hệ thống lên production bằng phương án dual write và chạy trực tiếp theo phương án sharding database/table.

Bây giờ phát sinh vấn đề: các database và table hiện tại không còn chịu tải được, cần tiếp tục mở rộng thì phải làm sao? Có thể dung lượng của từng database gần đầy, lượng dữ liệu của từng table quá lớn hoặc mức concurrency ghi vào từng database quá cao; bạn phải tiếp tục mở rộng.

Đây đều là những việc phải trải qua khi vận hành sharding database/table trên production.

## Phân tích câu hỏi phỏng vấn

### Mở rộng bằng cách dừng hệ thống (không khuyến nghị)

Phương án này gần giống migration khi dừng hệ thống; các bước hầu như giống nhau. Điểm khác biệt duy nhất là công cụ chuyển dữ liệu sẽ trích xuất dữ liệu từ database/table hiện có rồi nạp dần vào database/table mới. Nhưng tốt nhất đừng làm theo cách này vì không đáng tin cậy lắm: đã dùng **sharding database/table** thì có nghĩa lượng dữ liệu rất lớn, có thể lên đến vài trăm triệu hoặc thậm chí vài tỷ bản ghi; làm như vậy có thể phát sinh vấn đề.

Khi migration từ một database/một table sang sharding database/table, lượng dữ liệu chưa lớn; một table tối đa chỉ khoảng 20–30 triệu bản ghi. Khi đó có thể viết công cụ, dùng thêm vài máy chạy song song và nạp xong dữ liệu trong một giờ. Cách này không có vấn đề gì.

Nếu đã chạy một thời gian với 3 database + 12 table và lượng dữ liệu đã lên 100–200 triệu bản ghi, chỉ riêng việc nạp 200 triệu bản ghi cũng mất vài giờ. Bắt đầu nạp lúc 6 giờ, vừa nạp xong dữ liệu thì còn phải sửa cấu hình, khởi động lại hệ thống, kiểm thử xác minh; đến 10 giờ mới xong. Vì vậy không thể làm như vậy.

### Phương án đã tối ưu

Ngay từ đầu, tạo 32 database, mỗi database có 32 table, tổng cộng 1024 table.

Tôi có thể nói với các bạn rằng cách chia này, thứ nhất, về cơ bản đủ dùng cho các công ty Internet trong nước; thứ hai, không có vấn đề gì về khả năng đáp ứng concurrency hay lượng dữ liệu.

Mỗi database thông thường có thể chịu mức concurrency ghi là 1000; vậy 32 database có thể chịu $32 \times 1000 = 32000$ lượt ghi đồng thời. Nếu mỗi database chịu 1500 lượt ghi đồng thời thì tổng cộng là $32 \times 1500 = 48000$ lượt, gần 50 nghìn lượt ghi đồng thời mỗi giây. Đặt thêm một MQ ở phía trước để san bằng đỉnh: mỗi giây ghi 80 nghìn message vào MQ và tiêu thụ 50 nghìn message mỗi giây.

Chỉ một số công ty nằm trong nhóm dẫn đầu ở Trung Quốc mới có thể có quy mô hàng trăm máy chủ database cho database thuộc các hệ thống cốt lõi nhất của họ; chẳng hạn 128, 256 hoặc 512 database.

Với 1024 table, giả sử mỗi table lưu 5 triệu bản ghi thì MySQL có thể lưu 5 tỷ bản ghi.

Với 50 nghìn lượt ghi đồng thời mỗi giây và tổng cộng 5 tỷ bản ghi, thông thường như vậy đã đủ cho phần lớn công ty Internet trong nước.

Khi nói đến mở rộng sharding database/table, **ngay lần đầu sharding, hãy chia đủ lớn**: 32 database, 1024 table có thể đã đáp ứng nhu cầu của phần lớn công ty Internet vừa và nhỏ trong vài năm.

Một phương án thực tế là dùng $32 \times 32$ để sharding, tức chia thành 32 database, mỗi database lại chia thành 32 table. Tổng cộng có 1024 table. Dựa trên một id, trước tiên lấy modulo 32 để định tuyến đến database, rồi lấy modulo 32 để định tuyến đến table trong database đó.

| orderId | id % 32 (database) | id / 32 % 32 (table) |
| ------- | ------------------ | -------------------- |
| 259     | 3                  | 8                    |
| 1189    | 5                  | 5                    |
| 352     | 0                  | 11                   |
| 4593    | 17                 | 15                   |

Ban đầu, các database này có thể chỉ là logical database cùng nằm trên một MySQL server; chẳng hạn, một MySQL server có thể tạo n database, ví dụ 32 database. Về sau, nếu cần tách ra thì chỉ cần lần lượt migration các database sang các MySQL server khác. Sau đó, hệ thống phối hợp thay đổi cấu hình.

Ví dụ, tối đa có thể mở rộng đến 32 database server, mỗi server có một database. Nếu vẫn chưa đủ thì tối đa có thể mở rộng đến 1024 database server, mỗi server có một database và một table; như vậy tối đa có 1024 table.

Làm theo cách này thì không cần tự viết code để migration dữ liệu; có thể giao cho DBA xử lý. DBA đúng là cần thực hiện một số công việc migration database và table, nhưng cách đó vẫn hiệu quả hơn nhiều so với việc tự viết code, trích xuất rồi nạp dữ liệu.

Ngay cả khi cần giảm số database thì cũng rất đơn giản; nói thẳng ra là chỉ cần thu hẹp theo bội số rồi sửa quy tắc định tuyến.

Tóm tắt các bước như sau:

1. Ấn định số database server, số database trên mỗi server và số table trong mỗi database. Khuyến nghị $32 database \times 32 table$; với phần lớn công ty, số lượng này có thể đủ dùng trong vài năm.
2. Quy tắc định tuyến: orderId modulo 32 = database; orderId / 32 modulo 32 = table.
3. Khi mở rộng, xin thêm database server, cài MySQL và mở rộng theo bội số: từ 4 server lên 8 server, rồi 16 server.
4. DBA phụ trách migration các database từ database server cũ sang database server mới; có sẵn một số công cụ thuận tiện cho việc migration database.
5. Phía chúng ta chỉ cần sửa cấu hình để thay đổi địa chỉ database server chứa database sau migration.
6. Phát hành lại hệ thống và đưa lên production. Không cần thay đổi quy tắc định tuyến cũ; hệ thống có thể tiếp tục cung cấp dịch vụ production dựa trên tài nguyên của số database server tăng lên n lần.
