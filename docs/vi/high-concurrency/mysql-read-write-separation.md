# Làm thế nào triển khai read/write separation?

## Câu hỏi phỏng vấn

Các bạn có triển khai read/write separation cho MySQL không? Làm thế nào triển khai read/write separation cho MySQL? Nguyên lý replication primary-replica của MySQL là gì? Làm thế nào giải quyết vấn đề trễ đồng bộ primary-replica của MySQL?

## Phân tích suy nghĩ của người phỏng vấn

Ở giai đoạn high concurrency, chắc chắn cần read/write separation. Nghĩa là gì? Thực tế, phần lớn công ty Internet, website hoặc app thường đọc nhiều, ghi ít. Vì vậy, với tình huống này, tạo một primary database và gắn nhiều replica database vào nó; sau đó chỉ ghi vào primary database, còn đọc từ nhiều replica database. Như vậy chẳng phải có thể chịu áp lực concurrency đọc cao hơn sao?

## Phân tích câu hỏi phỏng vấn

### Làm thế nào triển khai read/write separation cho MySQL?

Thực ra rất đơn giản: dựa trên kiến trúc replication primary-replica. Nói đơn giản, tạo một primary database và gắn nhiều replica database; sau đó chỉ ghi vào primary database, primary database sẽ tự động đồng bộ dữ liệu sang các replica database.

### Nguyên lý replication primary-replica của MySQL là gì?

Primary database ghi các thay đổi vào binlog. Sau khi replica database kết nối với primary database, một IO thread trên replica sẽ sao chép binlog của primary về máy cục bộ rồi ghi vào relay log. Tiếp đó, một SQL thread trên replica đọc binlog từ relay log và thực thi nội dung trong binlog, tức thực thi lại câu lệnh SQL trên máy của mình. Như vậy, dữ liệu của replica sẽ giống với primary.

![mysql-master-slave](../../high-concurrency/images/mysql-master-slave.png)

Một điểm rất quan trọng là quá trình replica đồng bộ dữ liệu của primary được tuần tự hóa. Nghĩa là các thao tác được thực hiện song song trên primary sẽ được thực thi tuần tự trên replica. Đây là điểm rất quan trọng: do đặc điểm replica sao chép log từ primary và thực thi SQL tuần tự, trong tình huống high concurrency, dữ liệu của replica chắc chắn sẽ chậm hơn primary một chút, tức **có độ trễ**. Vì vậy thường xảy ra tình huống dữ liệu vừa ghi vào primary chưa đọc được ngay; phải đợi vài chục mili giây, thậm chí vài trăm mili giây mới đọc được.

Ngoài ra còn có một vấn đề khác: nếu primary đột ngột sập và dữ liệu chưa kịp đồng bộ sang replica thì một số dữ liệu có thể không có trên replica, tức có thể bị mất.

Vì vậy, thực tế MySQL có hai cơ chế ở phần này: một là **semi-synchronous replication**, dùng để giải quyết vấn đề mất dữ liệu ở primary; hai là **parallel replication**, dùng để giải quyết vấn đề trễ đồng bộ primary-replica.

Cái gọi là **semi-synchronous replication**, còn gọi là replication `semi-sync`, nghĩa là sau khi primary ghi binlog thì **bắt buộc** lập tức đồng bộ dữ liệu sang replica. Sau khi replica ghi log vào relay log cục bộ, nó gửi ack về primary; primary chỉ xem thao tác ghi đã hoàn tất sau khi nhận ack của **ít nhất một replica**.

Cái gọi là **parallel replication** nghĩa là replica khởi chạy nhiều thread để đọc song song log của các database khác nhau trong relay log, sau đó **replay log của các database khác nhau song song**. Đây là parallelism ở cấp database.

### Vấn đề trễ đồng bộ primary-replica của MySQL (phần trọng tâm)

Trước đây chúng tôi từng xử lý bug production do trễ đồng bộ primary-replica; đó là một sự cố production nhỏ.

Tình huống như sau. Một đồng nghiệp viết logic code như thế này: chèn một bản ghi, đọc lại bản ghi đó rồi cập nhật bản ghi. Trong giờ cao điểm ở môi trường production, concurrency ghi đạt 2000/s; khi đó độ trễ replication primary-replica vào khoảng vài chục mili giây. Trên production, mỗi ngày đều phát hiện một số bản ghi mà chúng tôi mong muốn cập nhật một trạng thái quan trọng nhưng lại không được cập nhật vào giờ cao điểm. Người dùng phản ánh với bộ phận chăm sóc khách hàng, sau đó bộ phận chăm sóc khách hàng phản ánh lại cho chúng tôi.

Chúng tôi dùng lệnh MySQL:

```sql
show slave status
```

để xem `Seconds_Behind_Master`; có thể thấy dữ liệu primary được replica sao chép bị chậm vài ms.

Thông thường, nếu độ trễ primary-replica khá nghiêm trọng thì có các phương án sau:

-   Sharding database: tách một primary database thành nhiều primary database để concurrency ghi của từng primary giảm đi vài lần; khi đó độ trễ primary-replica có thể không đáng kể.
-   Bật parallel replication được MySQL hỗ trợ để nhiều database được replication song song. Nếu concurrency ghi vào một database nào đó đặc biệt cao, một database đạt 2000 lần ghi đồng thời mỗi giây thì parallel replication cũng không có ý nghĩa.
-   Viết lại code. Đồng nghiệp viết code cần cẩn trọng; chèn dữ liệu xong truy vấn ngay có thể chưa thấy dữ liệu.
-   Nếu thực sự bắt buộc phải chèn trước rồi truy vấn thấy dữ liệu ngay, sau đó lập tức thực hiện một số thao tác khác thì hãy **cấu hình kết nối trực tiếp đến primary cho truy vấn đó**. **Không khuyến nghị** cách này; nếu làm như vậy thì read/write separation mất ý nghĩa.
