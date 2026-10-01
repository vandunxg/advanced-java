# Xây dựng kiến trúc dịch vụ có high availability bằng Hystrix

Tham khảo [Hystrix Home](https://github.com/Netflix/Hystrix/wiki#what).

## Hystrix là gì?

Trong hệ thống phân tán, mỗi service có thể gọi nhiều service khác; những service được gọi là **dịch vụ phụ thuộc**. Một số dịch vụ phụ thuộc gặp sự cố đôi khi cũng là chuyện bình thường.

Hystrix cho phép chúng ta kiểm soát các lời gọi giữa các service trong hệ thống phân tán, đồng thời bổ sung cơ chế **chịu lỗi** trước **độ trễ khi gọi** hoặc **sự cố của dependency**.

Hystrix thực hiện **isolation tài nguyên** cho các dịch vụ phụ thuộc, qua đó ngăn sự cố của một dịch vụ phụ thuộc lan rộng sang mọi lời gọi dịch vụ phụ thuộc trong toàn hệ thống. Hystrix cũng cung cấp cơ chế fallback degradation khi xảy ra sự cố.

**Tóm lại, Hystrix giúp nâng cao availability và stability của hệ thống phân tán thông qua các phương pháp này.**

## Lịch sử của Hystrix

Hystrix là một framework đảm bảo high availability. Đội ngũ API của Netflix (có thể xem là một website video nước ngoài như Youku hoặc iQIYI) bắt đầu thực hiện một số công việc nhằm cải thiện availability và stability của hệ thống từ năm 2011; Hystrix bắt đầu phát triển từ thời điểm đó.

Đến năm 2012, Hystrix đã trở nên khá hoàn thiện và ổn định. Tại Netflix, ngoài đội ngũ API, nhiều đội ngũ khác cũng bắt đầu sử dụng Hystrix.

Cho đến nay, mỗi ngày có hàng tỷ lời gọi giữa các service tại Netflix được thực hiện thông qua framework Hystrix; Hystrix cũng đã giúp nâng cao availability và stability tổng thể của website Netflix.

[Vào tháng 11 năm 2018, Hystrix thông báo trên trang Github rằng dự án sẽ không mở thêm tính năng mới và khuyến nghị developer sử dụng các dự án mã nguồn mở khác vẫn đang hoạt động](https://github.com/Netflix/Hystrix/blob/master/README.md#hystrix-status). Việc chuyển sang chế độ bảo trì không có nghĩa là Hystrix không còn giá trị. Ngược lại, Hystrix đã khơi nguồn cho nhiều ý tưởng và dự án tuyệt vời; phần kiến thức về high availability ở đây vẫn sẽ được trình bày dựa trên Hystrix.

## Nguyên tắc thiết kế của Hystrix

-   **Kiểm soát và bảo vệ khả năng chịu lỗi** trước độ trễ và thất bại xảy ra khi gọi dịch vụ phụ thuộc.
-   Trong hệ thống phân tán phức tạp, ngăn sự cố của một dịch vụ phụ thuộc lan rộng ra toàn hệ thống. Ví dụ, một service gặp lỗi khiến các service khác cũng lỗi theo.
-   Hỗ trợ `fail-fast` (thất bại nhanh) và khôi phục nhanh.
-   Hỗ trợ fallback degradation một cách mềm mại.
-   Hỗ trợ giám sát, cảnh báo và thao tác vận hành gần thời gian thực.

Lấy một ví dụ.

Xét một hệ thống phân tán trong đó service A phụ thuộc vào service B, còn service B phụ thuộc vào service C/D/E. Trong một hệ thống đã hoạt động ổn định như vậy, giả sử tổng cộng có tối đa 100 thread. Trong điều kiện bình thường, 40 thread đồng thời gọi service C, mỗi service D và E được 30 thread đồng thời gọi.

Gọi service C chỉ mất 20ms. Nhưng hiện service C gặp sự cố, chẳng hạn bị trễ hoặc ngừng hoạt động, khiến các thread bị treo khoảng 2 giây. Cả 40 thread đều bị kẹt; do request liên tục đổ vào, các thread khác cũng được dùng để gọi service C và cũng bị kẹt tương tự. Điều này làm cạn tài nguyên thread của service B, khiến service không thể nhận request mới; thậm chí có thể tự sập do quá nhiều thread liên tục hoạt động. Ảnh hưởng này chắc chắn sẽ lan đến service A và khiến service A cũng ngừng hoạt động.

![service-invoke-road](../../high-availability/images/service-invoke-road.png)

Hystrix có thể thực hiện isolation tài nguyên, chẳng hạn giới hạn service B chỉ dùng 40 thread để gọi service C. Khi 40 thread này bị treo, 60 thread còn lại vẫn có thể gọi các dịch vụ khác và hoạt động bình thường. Nhờ đó, toàn bộ hệ thống không bị kéo sập.

## Nguyên tắc thiết kế chi tiết hơn của Hystrix

-   Ngăn bất kỳ dịch vụ phụ thuộc nào làm cạn toàn bộ tài nguyên, chẳng hạn tất cả tài nguyên thread trong tomcat.
-   Tránh request xếp hàng và tồn đọng; dùng rate limit và `fail fast` để kiểm soát sự cố.
-   Cung cấp cơ chế fallback degradation để ứng phó với sự cố.
-   Dùng kỹ thuật isolation tài nguyên như `bulkhead` (isolation vách ngăn), `swimlane` (kỹ thuật làn bơi) và `circuit breaker` (kỹ thuật ngắt mạch) để giới hạn ảnh hưởng từ sự cố của bất kỳ dịch vụ phụ thuộc nào.
-   Dùng chức năng thống kê, giám sát và cảnh báo gần thời gian thực để phát hiện sự cố nhanh hơn.
-   Dùng chức năng **thay đổi nóng** các thuộc tính và cấu hình gần thời gian thực để xử lý sự cố và khôi phục nhanh hơn.
-   Bảo vệ trước mọi loại sự cố khi gọi dịch vụ phụ thuộc, chứ không chỉ sự cố mạng.
