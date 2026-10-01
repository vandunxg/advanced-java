# Làm thế nào để chuyển đổi êm ái sang sharding database/table?

## Câu hỏi phỏng vấn

Hiện có một hệ thống chưa thực hiện sharding database/table; trong tương lai cần sharding database/table, nên thiết kế thế nào để hệ thống có thể **chuyển đổi động** từ trạng thái chưa sharding sang sharding?

## Phân tích tâm lý người phỏng vấn

Hãy xem, giờ bạn đã hiểu vì sao cần sharding database/table, cũng biết các middleware sharding database/table thường dùng và đã thiết kế xong phương án sharding cho hệ thống (tách ngang, tách dọc, tách table). Vậy câu hỏi đặt ra là: tiếp theo, bạn sẽ migration hệ thống một database/một table sang sharding database/table như thế nào?

Đây là một chuỗi mắt xích liên kết với nhau; cốt lõi là xem bạn đã từng trải qua toàn bộ quy trình này hay chưa.

## Phân tích câu hỏi phỏng vấn

Thực ra có khá nhiều phương án, từ đơn giản đến bài bản; chúng ta đã từng làm qua và tôi sẽ nói lần lượt.

### Phương án migration khi dừng hệ thống

Trước tiên, tôi sẽ nói về phương án đơn giản nhất: đến 12 giờ đêm, đội vận hành bắt đầu công việc bảo trì; website hoặc app treo thông báo rằng từ 0 giờ đến 6 giờ sáng sẽ bảo trì và không thể truy cập.

Tiếp đó, đến 0 giờ thì dừng hệ thống, không còn lưu lượng ghi vào; khi đó database cũ theo mô hình một database/một table đã đứng yên. Sau đó chạy công cụ **chuyển dữ liệu một lần** đã viết sẵn, đọc dữ liệu từ database cũ rồi ghi toàn bộ vào các database/table đã sharding.

Sau khi chuyển dữ liệu xong là ổn; sửa cấu hình kết nối database của hệ thống, có thể cả code và SQL cũng cần thay đổi. Khi đó, dùng code mới nhất rồi khởi động hệ thống để kết nối vào sharding database/table mới.

Xác minh một lượt, mọi thứ ổn, thật hoàn hảo. Mọi người vươn vai, ngắm cảnh đêm Bắc Kinh lúc 4 giờ sáng rồi gọi một chuyến Didi về nhà.

Tuy nhiên, phương án này khá đơn giản, ai cũng làm được; hãy xem một phương án bài bản hơn.

![database-shard-method-1](../../high-concurrency/images/database-shard-method-1.png)

### Phương án migration bằng dual write

Đây là một phương án migration thường dùng, đáng tin cậy hơn; không cần dừng hệ thống, cũng không cần ngắm cảnh Bắc Kinh lúc 4 giờ sáng.

Nói đơn giản, trong hệ thống production, tại mọi nơi trước đây thực hiện thao tác ghi vào database, ngoài việc thêm/xóa/sửa ở database cũ, **còn thực hiện thêm/xóa/sửa ở database mới**. Đó chính là **dual write**, tức đồng thời ghi vào database cũ và database mới.

Sau khi **triển khai hệ thống**, dữ liệu trong database mới còn chênh lệch rất nhiều. Dùng công cụ chuyển dữ liệu đã nói ở trên để đọc dữ liệu từ database cũ rồi ghi vào database mới. Khi ghi, cần dựa vào các trường như gmt_modified để xác định thời điểm dữ liệu được sửa đổi lần cuối; chỉ ghi khi dữ liệu đọc ra chưa có trong database mới hoặc mới hơn dữ liệu trong database mới. Nói đơn giản, không được dùng dữ liệu cũ ghi đè dữ liệu mới.

Sau một lượt chuyển dữ liệu, dữ liệu vẫn có thể chưa nhất quán. Khi đó, chương trình tự động thực hiện một lượt kiểm tra, so sánh từng bản ghi trong từng table của database mới và database cũ. Nếu có khác biệt, đọc lại dữ liệu tương ứng từ database cũ rồi ghi lại. Lặp đi lặp lại cho đến khi dữ liệu trong mọi table của hai database hoàn toàn nhất quán.

Khi dữ liệu đã hoàn toàn nhất quán thì ổn. Triển khai lại code mới nhất chỉ sử dụng sharding database/table; như vậy hệ thống sẽ chỉ thao tác trên sharding database/table mà không cần dừng hệ thống hàng giờ, vẫn rất ổn định. Vì vậy, hiện nay các công việc liên quan đến migration dữ liệu về cơ bản đều được thực hiện theo cách này.

![database-shard-method-2](../../high-concurrency/images/database-shard-method-2.png)
