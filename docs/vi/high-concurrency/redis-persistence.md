# Cơ chế persistence của Redis

## Câu hỏi phỏng vấn

Redis có những cách persistence nào? Mỗi cơ chế persistence có ưu điểm và nhược điểm gì? Cơ chế persistence hoạt động cụ thể như thế nào ở tầng bên dưới?

## Phân tích suy nghĩ của người phỏng vấn

Nếu Redis chỉ cache dữ liệu trong bộ nhớ thì khi Redis bị sập rồi khởi động lại, toàn bộ dữ liệu trong bộ nhớ sẽ mất. Bạn cần dùng cơ chế persistence của Redis để vừa ghi dữ liệu vào bộ nhớ, vừa dần dần ghi dữ liệu bất đồng bộ vào file trên đĩa để lưu trữ bền vững.

Nếu Redis bị sập rồi khởi động lại, nó có thể tự nạp một phần dữ liệu đã được lưu bền trước đó từ đĩa. Có thể mất một ít dữ liệu, nhưng ít nhất sẽ không mất toàn bộ.

Thực ra câu hỏi này cũng xoay quanh một số vấn đề có thể xảy ra trong môi trường production của Redis: nếu Redis bị lỗi rồi khởi động lại thì dữ liệu trong bộ nhớ sẽ mất hết. Có thể khôi phục dữ liệu khi khởi động lại không?

## Phân tích câu hỏi phỏng vấn

Persistence chủ yếu phục vụ khôi phục sau thảm họa và khôi phục dữ liệu; cũng có thể xem đây là một phần của high availability. Ví dụ Redis của bạn sập hoàn toàn và không dùng được; việc cần làm là đưa Redis trở lại trạng thái khả dụng càng sớm càng tốt.

Khởi động lại Redis để nó nhanh chóng cung cấp dịch vụ trở lại. Nếu không sao lưu dữ liệu thì dù Redis đã khởi động, nó vẫn không dùng được vì dữ liệu đã mất.

Rất có thể sẽ có một lượng lớn request đổ tới, cache đều không hit và Redis không tìm thấy dữ liệu. Khi đó sẽ xảy ra vấn đề **cache avalanche**. Mọi request không hit Redis sẽ tìm dữ liệu từ nguồn dữ liệu gốc như MySQL; MySQL đột ngột phải xử lý high concurrency rồi có thể bị sập...

Nếu triển khai persistence Redis tốt, có phương án sao lưu và khôi phục ở cấp độ doanh nghiệp, thì ngay cả khi Redis gặp sự cố, bạn vẫn có thể nhanh chóng khôi phục từ bản sao lưu và lập tức cung cấp dịch vụ trở lại.

### Hai cơ chế persistence của Redis

-   RDB: cơ chế persistence RDB lưu dữ liệu trong Redis theo **định kỳ**.
-   AOF: cơ chế AOF ghi lại mọi lệnh ghi vào file log theo chế độ `append-only`. Khi Redis khởi động lại, có thể dựng lại toàn bộ dataset bằng cách **phát lại** các lệnh ghi trong log AOF.

Dùng RDB hoặc AOF đều có thể lưu bền dữ liệu từ bộ nhớ Redis xuống đĩa, sau đó sao lưu dữ liệu này sang nơi khác, chẳng hạn các dịch vụ đám mây như Alibaba Cloud.

Nếu Redis bị sập và dữ liệu trên cả bộ nhớ lẫn đĩa của server đều mất, có thể sao chép dữ liệu trước đó từ dịch vụ đám mây về thư mục chỉ định rồi khởi động lại Redis. Redis sẽ tự khôi phục dữ liệu trong bộ nhớ dựa trên dữ liệu trong các file persistence và tiếp tục cung cấp dịch vụ.

Nếu dùng đồng thời cả hai cơ chế persistence RDB và AOF thì khi khởi động lại Redis sẽ dùng **AOF** để dựng lại dữ liệu, vì **dữ liệu trong AOF đầy đủ hơn**.

#### Ưu điểm và nhược điểm của RDB

-   RDB tạo nhiều file dữ liệu, mỗi file đại diện cho dữ liệu Redis tại một thời điểm. Cách lưu thành nhiều file này **rất phù hợp để sao lưu lạnh**; có thể gửi các file dữ liệu đầy đủ lên một dịch vụ lưu trữ an toàn từ xa, chẳng hạn dịch vụ đám mây S3 của Amazon hoặc dịch vụ lưu trữ phân tán ODPS của Alibaba Cloud ở Trung Quốc, rồi định kỳ sao lưu dữ liệu Redis theo chính sách đã định.
-   RDB hầu như không ảnh hưởng đến dịch vụ đọc ghi Redis, giúp Redis **duy trì hiệu năng cao**, vì tiến trình Redis chính chỉ cần fork một tiến trình con để tiến trình con thực hiện thao tác I/O trên đĩa nhằm tạo persistence RDB.
-   So với cơ chế persistence AOF, khởi động lại và khôi phục tiến trình Redis trực tiếp từ file dữ liệu RDB nhanh hơn.
-   Nếu muốn hạn chế tối đa mất dữ liệu khi Redis gặp sự cố thì RDB không tốt bằng AOF. Thông thường, file snapshot dữ liệu RDB được tạo mỗi 5 phút hoặc lâu hơn. Vì vậy cần chấp nhận rằng nếu tiến trình Redis bị sập thì có thể mất dữ liệu trong 5 phút gần nhất (hoặc lâu hơn).
-   Mỗi lần fork tiến trình con để tạo file snapshot RDB, nếu file dữ liệu quá lớn thì việc phục vụ client có thể tạm dừng vài millisecond, thậm chí vài giây.

#### Ưu điểm và nhược điểm của AOF

-   AOF bảo vệ dữ liệu khỏi bị mất tốt hơn. Thông thường, cứ mỗi giây một luồng nền lại thực hiện thao tác `fsync` cho AOF một lần; tối đa chỉ mất dữ liệu của một giây.
-   File log AOF được ghi theo chế độ `append-only`, nên không tốn chi phí định vị trên đĩa; hiệu năng ghi cao và file khó bị hỏng. Ngay cả khi phần cuối file bị hỏng thì cũng dễ sửa.
-   Dù file log AOF lớn, thao tác rewrite chạy ở luồng nền cũng không ảnh hưởng đến việc đọc ghi của client. Khi `rewrite` log, các lệnh được nén lại để tạo ra file log nhỏ nhất cần dùng để khôi phục dữ liệu. Trong lúc tạo file log mới, file log cũ vẫn được ghi như thường. Khi file log mới đã merge xong và sẵn sàng thì chỉ cần hoán đổi file log mới và cũ.
-   Các lệnh trong file log AOF được ghi theo cách dễ đọc, đặc tính này **rất phù hợp để khôi phục khẩn cấp sau sự cố xóa nhầm dữ liệu nghiêm trọng**. Ví dụ, ai đó vô tình dùng lệnh `flushall` xóa sạch dữ liệu. Chỉ cần thao tác `rewrite` ở luồng nền chưa diễn ra thì có thể lập tức sao chép file AOF, xóa lệnh `flushall` cuối cùng rồi đưa file `AOF` đó trở lại. Cơ chế khôi phục sẽ tự động khôi phục toàn bộ dữ liệu.
-   Với cùng một tập dữ liệu, file log AOF thường lớn hơn file snapshot dữ liệu RDB.
-   Sau khi bật AOF, QPS ghi mà hệ thống hỗ trợ sẽ thấp hơn so với khi dùng RDB, vì AOF thường được cấu hình để `fsync` file log mỗi giây. Dĩ nhiên, `fsync` mỗi giây vẫn có hiệu năng khá cao. (Nếu ghi theo thời gian thực thì QPS sẽ giảm mạnh và hiệu năng Redis cũng giảm đáng kể.)
-   Trước đây AOF từng có bug: khi khôi phục dữ liệu từ log AOF, dữ liệu khôi phục không hoàn toàn giống dữ liệu ban đầu. Vì vậy, cách `merge` và phát lại log lệnh phức tạp như AOF dễ lỗi hơn một chút so với việc RDB tạo một file snapshot dữ liệu hoàn chỉnh mỗi lần. Tuy nhiên, AOF được thiết kế để tránh bug do quá trình rewrite gây ra; vì thế mỗi lần rewrite không merge dựa trên log lệnh cũ mà **dựng lại các lệnh dựa trên dữ liệu trong bộ nhớ tại thời điểm đó**, giúp cơ chế vững chắc hơn.

### Nên chọn RDB hay AOF?

-   Đừng chỉ dùng RDB, vì như vậy sẽ khiến bạn mất nhiều dữ liệu;
-   Cũng đừng chỉ dùng AOF vì có hai vấn đề: thứ nhất, khi dùng AOF để sao lưu lạnh, tốc độ khôi phục không nhanh bằng sao lưu lạnh bằng RDB; thứ hai, RDB tạo snapshot dữ liệu một cách đơn giản và trực tiếp mỗi lần nên vững chắc hơn, tránh được bug trong cơ chế sao lưu và khôi phục phức tạp như AOF;
-   Redis hỗ trợ bật đồng thời cả hai cơ chế persistence. Có thể kết hợp AOF và RDB: dùng AOF để đảm bảo dữ liệu không mất, làm lựa chọn khôi phục dữ liệu đầu tiên; dùng RDB để sao lưu lạnh ở các mức độ khác nhau. Nếu tất cả file AOF bị mất, hỏng hoặc không sử dụng được thì vẫn có thể dùng RDB để khôi phục dữ liệu nhanh.
