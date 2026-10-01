# Tại sao cần dùng message queue?

## Câu hỏi phỏng vấn

-   Tại sao cần dùng message queue?
-   Message queue có ưu điểm và nhược điểm gì?
-   Kafka, ActiveMQ, RabbitMQ và RocketMQ khác nhau thế nào, phù hợp với những tình huống nào?

## Phân tích suy nghĩ của người phỏng vấn

Thực ra người phỏng vấn chủ yếu muốn xem:

-   **Thứ nhất**, bạn có biết tại sao hệ thống của mình cần dùng message queue không?

    Không ít ứng viên nói dự án của mình dùng Redis, MQ nhưng thực ra lại không biết tại sao cần dùng chúng. Nói trắng ra là dùng chỉ để dùng, hoặc kiến trúc do người khác thiết kế nên từ đầu đến cuối họ chưa từng suy nghĩ về nó.

    Người chưa từng tự hỏi tại sao kiến trúc của mình lại như vậy thì chắc hẳn bình thường ít suy nghĩ; người phỏng vấn thường có ấn tượng không tốt với những ứng viên này. Người phỏng vấn lo rằng sau khi vào team, bạn chỉ biết cắm đầu làm việc máy móc mà không tự suy nghĩ.

-   **Thứ hai**, nếu đã dùng message queue thì bạn có biết ưu điểm và **nhược điểm** của nó không?

    Nếu chưa từng cân nhắc điều này mà bạn cứ mù quáng đưa MQ vào hệ thống, sau này có vấn đề thì bạn sẽ bỏ đi và để lại rắc rối cho công ty sao? Nếu chưa từng cân nhắc nhược điểm và rủi ro có thể phát sinh khi đưa một công nghệ vào, ứng viên kiểu này khi được tuyển vào team có thể là người chuyên tạo ra vấn đề. Chỉ sợ bạn làm một năm, để lại cả đống vấn đề rồi chuyển việc, gây hậu quả không dứt cho công ty.

-   **Thứ ba**, nếu đã dùng MQ, có thể là một loại MQ cụ thể, vậy lúc đó bạn có khảo sát các lựa chọn không?

    Đừng tự quyết định theo sở thích cá nhân rồi dùng bừa một MQ như Kafka, thậm chí còn chưa từng khảo sát xem trong ngành có những MQ phổ biến nào và mỗi MQ có ưu nhược điểm ra sao. Không MQ nào **tốt hay xấu tuyệt đối**; điều quan trọng là dùng vào tình huống nào để **phát huy ưu điểm và tránh nhược điểm**.

    Nếu một ứng viên không cân nhắc chọn lựa công nghệ được tuyển vào team, leader giao thiết kế một hệ thống nào đó, bạn ấy dùng một số công nghệ nhưng có thể chưa từng cân nhắc lựa chọn; cuối cùng công nghệ được chọn có thể không phù hợp và tiếp tục để lại vấn đề.

## Phân tích câu hỏi phỏng vấn

### Tại sao cần dùng message queue?

Thực ra câu hỏi này muốn hỏi message queue có những tình huống sử dụng nào; dự án của bạn thuộc tình huống nào và bạn dùng message queue cụ thể ra sao trong tình huống đó?

Khi người phỏng vấn hỏi câu này, **câu trả lời họ mong đợi** là: công ty có một **tình huống nghiệp vụ** nào đó, tình huống đó có thách thức kỹ thuật ra sao; nếu không dùng MQ thì sẽ rất phiền phức, nhưng sau khi dùng MQ thì có nhiều lợi ích.

Trước tiên nói về các tình huống sử dụng phổ biến của message queue. Thực ra có nhiều tình huống, nhưng 3 tình huống cốt lõi hơn cả là: **tách rời**, **bất đồng bộ**, **làm phẳng đỉnh tải**.

#### Tách rời

Hãy xem tình huống sau. Hệ thống A gửi dữ liệu đến ba hệ thống B, C và D bằng cách gọi API. Nếu hệ thống E cũng cần dữ liệu này thì sao? Nếu hệ thống D hiện không cần nữa thì sao? Người phụ trách hệ thống A gần như phát điên...

![mq-1](./images/mq-1.png)

Trong tình huống này, hệ thống A bị coupling chặt với đủ loại hệ thống khác. A tạo ra một dữ liệu quan trọng và nhiều hệ thống đều cần A gửi dữ liệu đó. A phải luôn cân nhắc phải làm gì nếu một trong các hệ thống BCDE bị sập: có nên gửi lại không, có nên lưu message không? Đau đầu quá!

Nếu dùng MQ, hệ thống A tạo một dữ liệu rồi gửi vào MQ; hệ thống nào cần dữ liệu thì tự lấy từ MQ. Nếu có hệ thống mới cần dữ liệu thì chỉ việc lấy từ MQ; nếu hệ thống nào đó không cần dữ liệu nữa thì hủy đăng ký nhận message MQ là xong. Như vậy, hệ thống A hoàn toàn không cần cân nhắc phải gửi dữ liệu cho ai, không cần duy trì đoạn code này, cũng không cần quan tâm hệ thống kia gọi thành công hay thất bại, timeout, v.v.

![mq-2](./images/mq-2.png)

**Tóm lại**: thông qua MQ và mô hình Pub/Sub (publish-subscribe), hệ thống A được tách rời hoàn toàn khỏi các hệ thống khác.

**Mẹo phỏng vấn**: hãy nghĩ xem hệ thống bạn phụ trách có tình huống tương tự không: một hệ thống hoặc module gọi nhiều hệ thống hoặc module khác, các lời gọi lẫn nhau phức tạp và khó bảo trì. Nhưng thực ra không cần gọi API đồng bộ trực tiếp; có thể dùng MQ để xử lý bất đồng bộ và tách rời. Hãy cân nhắc liệu dự án của bạn có thể dùng MQ để tách rời các hệ thống không. Hãy thể hiện phần này trong CV, nêu việc dùng MQ để tách rời.

#### Bất đồng bộ

Xem thêm tình huống sau: hệ thống A nhận một request, cần ghi vào database cục bộ và cũng cần ghi vào database của ba hệ thống B, C, D. Ghi vào database cục bộ mất 3ms; ghi vào database của B, C, D lần lượt mất 300ms, 450ms và 200ms. Tổng độ trễ của request là 3 + 300 + 450 + 200 = 953ms, gần 1 giây; người dùng sẽ thấy mọi thứ chậm kinh khủng. Người dùng gửi request qua browser rồi phải đợi 1 giây, gần như không thể chấp nhận được.

![mq-3](./images/mq-3.png)

Thông thường, các doanh nghiệp Internet yêu cầu mỗi thao tác trực tiếp của người dùng phải hoàn tất trong vòng 200ms để người dùng gần như không nhận thấy độ trễ.

Nếu **dùng MQ**, hệ thống A liên tục gửi 3 message vào hàng đợi MQ; giả sử mất 5ms. Từ lúc nhận request đến lúc trả response cho người dùng, tổng thời gian của hệ thống A là 3 + 5 = 8ms. Với người dùng, cảm giác chỉ là bấm một nút rồi 8ms sau đã nhận được kết quả; thật thoải mái! Website làm tốt quá, nhanh thật!

![mq-4](./images/mq-4.png)

#### Làm phẳng đỉnh tải

Mỗi ngày từ 0:00 đến 12:00, hệ thống A rất yên ắng, số request đồng thời mỗi giây chỉ có 50. Nhưng cứ đến 12:00–13:00, số request đồng thời mỗi giây đột nhiên tăng vọt lên hơn 5.000. Hệ thống lại truy cập MySQL trực tiếp nên rất nhiều request đổ vào MySQL, mỗi giây thực thi khoảng 5.000 câu SQL.

MySQL thông thường chỉ chịu được khoảng 2.000 request mỗi giây; nếu số request mỗi giây lên đến 5.000 thì có thể MySQL sẽ sập, khiến hệ thống lỗi và người dùng không thể tiếp tục sử dụng.

Nhưng sau khi giờ cao điểm qua đi, đến buổi chiều lại thành giờ thấp điểm; có thể chỉ khoảng 10.000 người dùng đồng thời thao tác trên website và số request mỗi giây chỉ khoảng 50, gần như không gây áp lực cho toàn hệ thống.

![mq-5](./images/mq-5.png)

Nếu dùng MQ, mỗi giây có 5.000 request được ghi vào MQ; hệ thống A xử lý tối đa 2.000 request mỗi giây vì MySQL chỉ xử lý được tối đa 2.000 request mỗi giây. Hệ thống A từ từ lấy request từ MQ, mỗi giây lấy 2.000 request và không vượt quá số request tối đa nó có thể xử lý mỗi giây; thế là ổn. Như vậy, dù trong giờ cao điểm, hệ thống A cũng không bị sập. MQ nhận 5.000 request mỗi giây và chỉ đưa ra 2.000 request, vì thế vào giờ cao điểm buổi trưa (một giờ), có thể có vài trăm nghìn đến vài triệu request bị dồn trong MQ.

![mq-6](./images/mq-6.png)

Lượng request bị dồn trong thời gian cao điểm ngắn này vẫn ổn. Sau giờ cao điểm, mỗi giây chỉ có 50 request vào MQ nhưng hệ thống A vẫn xử lý với tốc độ 2.000 request mỗi giây. Vì vậy, ngay sau khi giờ cao điểm qua đi, hệ thống A sẽ nhanh chóng xử lý hết các message còn tồn đọng.

### Message queue có ưu nhược điểm gì?

Ưu điểm đã nói ở trên: **trong một số tình huống cụ thể, MQ mang lại lợi ích tương ứng**, gồm **tách rời**, **bất đồng bộ** và **làm phẳng đỉnh tải**.

Nhược điểm gồm:

-   Giảm tính khả dụng của hệ thống

    Càng có nhiều dependency bên ngoài mà hệ thống dùng đến thì hệ thống càng dễ sập. Ban đầu chỉ cần hệ thống A gọi API của các hệ thống B, C, D; cả bốn hệ thống ABCD vẫn hoạt động bình thường, không có vấn đề gì. Bạn lại thêm MQ vào; nếu MQ bị sập thì sao? MQ sập, toàn bộ hệ thống sập theo, chẳng phải bạn gặp rắc rối sao? Tìm hiểu cách đảm bảo high availability cho message queue [tại đây](./how-to-ensure-high-availability-of-message-queues.md).

-   Tăng độ phức tạp của hệ thống

    Cứng nhắc thêm MQ vào thì làm sao [đảm bảo message không bị tiêu thụ lặp](./how-to-ensure-that-messages-are-not-repeatedly-consumed)? Làm sao [xử lý trường hợp mất message](./how-to-ensure-the-reliable-transmission-of-messages)? Làm sao đảm bảo thứ tự truyền message? Thật nhức đầu, hàng đống vấn đề, rất khó xử lý.

-   Vấn đề nhất quán

    Hệ thống A xử lý xong và trả về thành công, mọi người đều nghĩ request này đã thành công. Nhưng vấn đề là nếu hai trong ba hệ thống B, C, D — chẳng hạn B và D — ghi database thành công còn hệ thống C ghi database thất bại thì sao? Dữ liệu của bạn sẽ không nhất quán.

    Vì vậy message queue thực ra là một kiến trúc rất phức tạp. Đưa MQ vào có nhiều lợi ích, nhưng cũng cần triển khai nhiều giải pháp kỹ thuật và kiến trúc bổ sung để tránh các nhược điểm nó mang lại. Sau khi làm xong, bạn sẽ thấy độ phức tạp hệ thống tăng lên cả một cấp độ, có thể phức tạp hơn gấp 10 lần. Nhưng đến lúc cần thì vẫn phải dùng.

### Kafka, ActiveMQ, RabbitMQ và RocketMQ có ưu nhược điểm gì?

| Đặc tính | ActiveMQ | RabbitMQ | RocketMQ | Kafka |
| ------------------------ | ------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Throughput đơn máy | Cấp hàng chục nghìn, thấp hơn RocketMQ và Kafka một bậc độ lớn | Tương tự ActiveMQ | Cấp 100 nghìn, hỗ trợ throughput cao | Cấp 100 nghìn, throughput cao; thường kết hợp với hệ thống big data để tính toán dữ liệu thời gian thực, thu thập log và các tình huống tương tự |
| Ảnh hưởng của số lượng topic lên throughput |  |  | Topic có thể lên đến hàng trăm/hàng nghìn; throughput giảm nhẹ. Đây là một ưu điểm lớn của RocketMQ: với cùng cấu hình máy, có thể hỗ trợ số lượng topic lớn | Khi số lượng topic từ vài chục đến vài trăm, throughput giảm mạnh. Với cùng cấu hình máy, Kafka nên giữ số topic ở mức không quá nhiều; nếu cần hỗ trợ lượng topic lớn thì phải tăng thêm tài nguyên máy |
| Độ trễ | Cấp ms | Cấp microsecond, đây là ưu điểm lớn của RabbitMQ và có độ trễ thấp nhất | Cấp ms | Độ trễ dưới cấp ms |
| Tính khả dụng | Cao, high availability được triển khai dựa trên kiến trúc primary-replica | Tương tự ActiveMQ | Rất cao, kiến trúc phân tán | Rất cao, phân tán; một dữ liệu có nhiều bản sao, một số ít máy bị sập cũng không làm mất dữ liệu hay khiến hệ thống không khả dụng |
| Độ tin cậy của message | Có xác suất thấp bị mất dữ liệu | Về cơ bản không mất | Có thể đạt mức không mất dữ liệu nếu tối ưu cấu hình tham số | Tương tự RocketMQ |
| Hỗ trợ chức năng | Chức năng trong lĩnh vực MQ rất đầy đủ | Phát triển dựa trên erlang, có khả năng xử lý đồng thời mạnh, hiệu năng rất tốt, độ trễ thấp | Chức năng MQ khá đầy đủ, có tính phân tán và khả năng mở rộng tốt | Chức năng khá đơn giản, chủ yếu hỗ trợ các chức năng MQ cơ bản; được sử dụng rộng rãi trong lĩnh vực big data để tính toán thời gian thực và thu thập log |

Sau khi so sánh, có một số đề xuất như sau:

Thông thường, các hệ thống nghiệp vụ cần dùng MQ; ban đầu mọi người đều dùng ActiveMQ. Nhưng hiện nay đúng là ít người dùng, nó chưa được kiểm chứng trong các tình huống throughput lớn và cộng đồng cũng không hoạt động sôi nổi, nên tôi không khuyến nghị dùng nữa.

Sau đó mọi người bắt đầu dùng RabbitMQ. Tuy nhiên, ngôn ngữ erlang thực sự ngăn nhiều kỹ sư Java nghiên cứu sâu và làm chủ nó; với công ty, MQ này gần như ở trạng thái khó kiểm soát. Dù vậy, đây là mã nguồn mở, có khả năng hỗ trợ ổn định và cộng đồng cũng hoạt động tích cực.

Hiện nay ngày càng nhiều công ty dùng RocketMQ; quả thật nó khá tốt, dù sao cũng do Alibaba phát triển. Tuy nhiên cộng đồng có thể đột ngột không còn hoạt động (hiện RocketMQ đã được chuyển giao cho [Apache](https://github.com/apache/rocketmq), nhưng mức độ hoạt động trên GitHub thực ra không cao). Nếu công ty hoàn toàn tự tin vào năng lực kỹ thuật thì khuyến nghị dùng RocketMQ; nếu không, hãy dùng RabbitMQ một cách ổn định, vì nó có cộng đồng mã nguồn mở tích cực và sẽ không đột nhiên ngừng hoạt động.

Vì vậy, với **công ty vừa và nhỏ** có năng lực kỹ thuật tương đối bình thường và thách thức kỹ thuật không quá cao, RabbitMQ là lựa chọn tốt; với **công ty lớn** có năng lực nghiên cứu và phát triển hạ tầng mạnh, RocketMQ là lựa chọn rất tốt.

Nếu xử lý tính toán thời gian thực hoặc thu thập log trong **lĩnh vực big data** thì Kafka là tiêu chuẩn trong ngành, chắc chắn phù hợp; cộng đồng hoạt động rất tích cực và sẽ không đột nhiên ngừng hoạt động, hơn nữa nó gần như là tiêu chuẩn thực tế trên toàn thế giới trong lĩnh vực này.
