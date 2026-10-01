# Làm thế nào chuyển đổi sharding database/table một cách êm ái?

## Câu hỏi phỏng vấn

Hiện có một hệ thống chưa sharding database/table; trong tương lai cần sharding database/table, nên thiết kế thế nào để hệ thống có thể **chuyển đổi động** từ trạng thái chưa sharding sang sharding?

## Phân tích suy nghĩ của người phỏng vấn

Hãy xem, giờ bạn đã hiểu vì sao cần sharding database/table, biết các middleware sharding database/table thường dùng và cũng đã thiết kế phương án sharding cho hệ thống (tách ngang, tách dọc, tách table). Vậy câu hỏi là: tiếp theo bạn sẽ migration hệ thống một database/một table sang sharding database/table như thế nào?

Đây là quy trình liên kết từng bước; họ muốn biết bạn đã từng trải qua toàn bộ quy trình này hay chưa.

## Phân tích câu hỏi phỏng vấn

Thực ra có nhiều phương án, từ mức đơn giản đến phức tạp; chúng ta đã thử qua và tôi sẽ nói lần lượt.

### Phương án migration khi dừng hệ thống

Trước tiên, tôi sẽ nói về phương án đơn giản nhất: mọi người bắt đầu vận hành lúc 12 giờ đêm; website hoặc app đăng thông báo rằng từ 0 giờ đến 6 giờ sáng sẽ bảo trì và không thể truy cập.

Tiếp đó, đến 0 giờ thì dừng hệ thống, không còn lưu lượng ghi vào; khi đó database một database/một table cũ đã ngừng thay đổi. Sau đó chạy công cụ **nạp dữ liệu một lần** đã viết sẵn để đọc dữ liệu từ database một database/một table rồi ghi liên tục vào các database/table đã sharding.

Sau khi nạp xong dữ liệu là được; sửa cấu hình kết nối database của hệ thống, có thể cả code và SQL cũng cần thay đổi. Khi đó dùng code mới nhất rồi khởi động hệ thống để kết nối vào sharding database/table mới.

Xác minh một lượt, mọi thứ ổn, thật hoàn hảo. Mọi người vươn vai, ngắm cảnh đêm Bắc Kinh lúc 4 giờ sáng rồi gọi xe về nhà.

Tuy nhiên, phương án này khá đơn giản và ai cũng làm được; hãy xem phương án chuyên nghiệp hơn.

![database-shard-method-1](../../high-concurrency/images/database-shard-method-1.png)

### Phương án migration dual write

Đây là phương án migration thường dùng và đáng tin cậy hơn; không cần dừng hệ thống, cũng không cần ngắm cảnh Bắc Kinh lúc 4 giờ sáng.

Nói đơn giản, trong hệ thống production, ở tất cả nơi trước đây ghi vào database, ngoài thao tác thêm/xóa/sửa ở database cũ, **còn thêm thao tác thêm/xóa/sửa vào database mới**. Đó chính là **dual write**, ghi đồng thời vào hai database cũ và mới.

Sau khi **triển khai hệ thống**, dữ liệu trong database mới còn chênh lệch nhiều. Dùng công cụ nạp dữ liệu đã nói trước đó để đọc dữ liệu ở database cũ rồi ghi vào database mới. Khi ghi, cần dựa vào các trường như gmt_modified để xác định thời điểm sửa cuối cùng của dữ liệu; chỉ ghi nếu dữ liệu đọc ra chưa có trong database mới hoặc mới hơn dữ liệu ở database mới. Nói đơn giản, không được dùng dữ liệu cũ ghi đè dữ liệu mới.

Sau một lượt nạp dữ liệu, có thể dữ liệu vẫn chưa nhất quán. Khi đó chương trình tự động thực hiện một lượt kiểm tra, so sánh từng bản ghi trong từng table của database mới và cũ. Nếu có khác biệt, đọc lại dữ liệu tương ứng từ database cũ rồi ghi lại. Lặp lại quá trình này cho đến khi dữ liệu trong mọi table của hai database hoàn toàn nhất quán.

Sau khi dữ liệu hoàn toàn nhất quán là được. Triển khai lại phiên bản code mới nhất chỉ sử dụng sharding database/table; như vậy hệ thống sẽ chỉ thao tác trên sharding database/table, mà không cần dừng hệ thống hàng giờ và vẫn rất ổn định. Vì vậy, hiện nay các công việc như migration dữ liệu thường được thực hiện theo cách này.

![database-shard-method-2](../../high-concurrency/images/database-shard-method-2.png)
