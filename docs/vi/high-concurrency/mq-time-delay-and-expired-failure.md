# Làm thế nào giải quyết vấn đề message queue bị trễ và hết hạn?

## Câu hỏi phỏng vấn

Làm thế nào giải quyết vấn đề message queue bị trễ và hết hạn? Khi message queue đầy thì xử lý thế nào? Nếu vài triệu message liên tục tồn đọng hàng giờ thì giải quyết ra sao?

## Phân tích suy nghĩ của người phỏng vấn

Xét cách hỏi này, thực chất các tình huống được nhắm đến đều là consumer gặp sự cố nên không tiêu thụ message, hoặc tốc độ tiêu thụ cực kỳ chậm. Sau đó sẽ rất rắc rối: có thể đĩa của cụm message queue sắp đầy mà không ai tiêu thụ; lúc này phải làm gì? Hoặc toàn bộ message bị tồn đọng vài giờ thì xử lý thế nào? Hoặc thời gian tồn đọng quá lâu khiến message hết hạn và biến mất do RabbitMQ đã đặt thời gian hết hạn thì sao?

Thực ra chuyện này khá phổ biến trên production; bình thường không xảy ra, nhưng một khi xảy ra thì là sự cố lớn. Ví dụ thường gặp là consumer ghi vào mysql sau mỗi lần tiêu thụ, nhưng mysql bị sập khiến consumer bị treo, không hoạt động; hoặc consumer gặp lỗi gì đó khiến tốc độ tiêu thụ cực kỳ chậm.

## Phân tích câu hỏi phỏng vấn

Hãy lần lượt phân tích vấn đề này. Trước tiên giả sử consumer gặp sự cố, một lượng lớn message bị tồn đọng trong mq và sự cố đã xảy ra; mọi người đang hoảng hốt.

### Message bị tồn đọng trong mq vài giờ mà vẫn chưa giải quyết được

Vài chục triệu bản ghi bị tồn đọng trong MQ suốt bảy, tám tiếng, từ hơn 4 giờ chiều đến hơn 11 giờ đêm. Đây là tình huống thực tế chúng tôi từng gặp; đúng là đã xảy ra sự cố production. Lúc này, hoặc sửa lỗi consumer để khôi phục tốc độ tiêu thụ rồi dừng lại và chờ vài tiếng cho tiêu thụ hết dữ liệu. Chắc chắn không thể trả lời như vậy trong buổi phỏng vấn.

Một consumer tiêu thụ 1000 bản ghi mỗi giây; ba consumer tiêu thụ 3000 bản ghi mỗi giây, tức 180 nghìn bản ghi mỗi phút. Vì vậy, nếu vài triệu đến hàng chục triệu bản ghi bị tồn đọng thì kể cả consumer đã khôi phục cũng cần khoảng 1 giờ mới xử lý hết.

Thông thường lúc này chỉ có thể tạm thời mở rộng khẩn cấp. Các bước thao tác và ý tưởng cụ thể như sau:

-   Trước tiên sửa lỗi của consumer, đảm bảo tốc độ tiêu thụ được khôi phục rồi dừng toàn bộ consumer hiện tại.
-   Tạo topic mới với số partition gấp 10 lần ban đầu; tạm thời tạo số lượng queue gấp 10 lần ban đầu.
-   Sau đó viết một consumer tạm thời để phân phối dữ liệu. Triển khai chương trình này để tiêu thụ dữ liệu tồn đọng; **sau khi tiêu thụ không thực hiện xử lý tốn thời gian**, mà ghi luân phiên đồng đều vào số queue tạm thời đã tạo, gấp 10 lần ban đầu.
-   Tiếp đó tạm thời sử dụng số máy gấp 10 lần để triển khai consumer; mỗi nhóm consumer tiêu thụ dữ liệu của một queue tạm thời. Cách này tương đương tạm thời tăng gấp 10 lần tài nguyên queue và consumer để tiêu thụ dữ liệu với tốc độ gấp 10 lần bình thường.
-   Sau khi tiêu thụ nhanh hết dữ liệu tồn đọng, **cần khôi phục kiến trúc triển khai ban đầu**, **triển khai lại** để các máy consumer ban đầu tiêu thụ message.

### Message trong mq hết hạn và bị mất

Giả sử bạn dùng RabbitMQ; RabbtiMQ có thể đặt thời gian hết hạn, tức TTL. Nếu message tồn đọng trong queue quá thời gian nhất định, RabbitMQ sẽ dọn sạch và dữ liệu đó sẽ mất. Đây là vấn đề thứ hai. Tình huống này không phải message bị tồn đọng nhiều trong mq mà là **một lượng lớn dữ liệu bị mất trực tiếp**.

Trong trường hợp này, không phải tăng consumer để tiêu thụ message tồn đọng vì thực tế không có gì bị tồn đọng — dữ liệu đã mất. Có thể dùng phương án **nạp lại theo lô**; trước đây chúng tôi cũng từng xử lý tình huống tương tự trên production. Khi có lượng dữ liệu lớn tồn đọng, lúc đó chúng tôi xóa dữ liệu trực tiếp rồi đợi qua giờ cao điểm, chẳng hạn mọi người cùng uống cà phê làm xuyên đêm đến sau 12 giờ, khi người dùng đã ngủ. Lúc đó bắt đầu viết chương trình lấy từng chút một lô dữ liệu bị mất, rồi nạp lại vào mq để bù dữ liệu đã mất ban ngày. Chỉ có thể làm như vậy.

Giả sử 10 nghìn đơn hàng bị tồn đọng trong mq chưa xử lý, trong đó 1000 đơn hàng đã mất; bạn chỉ có thể viết chương trình thủ công để lấy 1000 đơn hàng đó rồi gửi lại vào mq để bù thêm lần nữa.

### mq sắp đầy dung lượng ghi

Nếu message tồn đọng trong mq và bạn không xử lý trong thời gian dài, khiến mq sắp đầy thì phải làm sao? Còn cách nào khác không? Không có; ai bảo phương án đầu tiên của bạn làm quá chậm. Hãy viết chương trình tạm thời nhận dữ liệu và tiêu thụ; **tiêu thụ một message thì loại bỏ message đó, bỏ hết**, không cần giữ nữa, để nhanh chóng tiêu thụ toàn bộ message. Sau đó thực hiện phương án thứ hai và bù dữ liệu vào buổi tối.

---

Với RocketMQ, phía chính thức đã cung cấp giải pháp cho vấn đề message tồn đọng.

### 1. Tăng concurrency tiêu thụ

Phần lớn hoạt động tiêu thụ message đều thuộc loại IO-bound, tức có thể là thao tác database hoặc gọi RPC. Tốc độ tiêu thụ của loại hoạt động này phụ thuộc vào throughput của database backend hoặc hệ thống bên ngoài. Có thể tăng tổng throughput tiêu thụ bằng cách tăng concurrency, nhưng nếu tăng quá mức thì ngược lại throughput sẽ giảm. Vì vậy ứng dụng phải đặt concurrency hợp lý. Có một số cách thay đổi concurrency tiêu thụ như sau:

Trong cùng một ConsumerGroup, tăng số lượng Consumer instance để tăng concurrency (cần lưu ý Consumer instance nhiều hơn số queue đã subscribe sẽ không có tác dụng). Có thể thêm máy hoặc khởi chạy nhiều process trên máy hiện có.

Tăng số thread tiêu thụ đồng thời bên trong một Consumer bằng cách sửa tham số consumeThreadMin và consumeThreadMax.

### 2. Tiêu thụ theo batch

Nếu một số quy trình nghiệp vụ hỗ trợ tiêu thụ theo batch thì có thể tăng throughput tiêu thụ đáng kể. Ví dụ, ứng dụng trừ tiền đơn hàng mất 1 giây để xử lý một đơn; xử lý 10 đơn hàng một lần có thể chỉ mất 2 giây. Như vậy throughput tiêu thụ tăng đáng kể. Có thể đặt tham số consumeMessageBatchMaxSize của consumer; mặc định là 1, tức mỗi lần chỉ tiêu thụ một message. Ví dụ đặt bằng N thì số message được tiêu thụ mỗi lần nhỏ hơn hoặc bằng N.

### 3. Bỏ qua message không quan trọng

Khi message bị tồn đọng mà tốc độ tiêu thụ liên tục không theo kịp tốc độ gửi, nếu nghiệp vụ không yêu cầu cao về dữ liệu thì có thể chọn bỏ message không quan trọng. Ví dụ, khi số message tồn đọng của một queue vượt quá 100000, hãy thử bỏ một phần hoặc toàn bộ message để nhanh chóng bắt kịp tốc độ gửi. Code ví dụ như sau:

```java
public ConsumeConcurrentlyStatus consumeMessage(
            List<MessageExt> msgs,
            ConsumeConcurrentlyContext context) {
    long offset = msgs.get(0).getQueueOffset();
    String maxOffset =
            msgs.get(0).getProperty(Message.PROPERTY_MAX_OFFSET);
    long diff = Long.parseLong(maxOffset) - offset;
    if (diff > 100000) {
        // TODO 消息堆积情况的特殊处理
        return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
    }
    // TODO 正常消费过程
    return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
}
```

### 4. Tối ưu quá trình tiêu thụ từng message

Ví dụ, quá trình tiêu thụ một message như sau:

-   Truy vấn [dữ liệu 1] trong DB dựa trên message
-   Truy vấn [dữ liệu 2] trong DB dựa trên message
-   Tính toán nghiệp vụ phức tạp
-   Chèn [dữ liệu 3] vào DB
-   Chèn [dữ liệu 4] vào DB

Quá trình tiêu thụ message này có 4 lần tương tác với DB. Nếu tính mỗi lần là 5ms thì tổng cộng mất 20ms; giả sử tính toán nghiệp vụ mất 5ms thì tổng cộng mất 25ms. Vì vậy nếu tối ưu được 4 lần tương tác DB thành 2 lần thì tổng thời gian có thể giảm xuống 15ms, tức hiệu năng tổng thể tăng 40%. Do đó, nếu ứng dụng nhạy cảm với độ trễ thì có thể triển khai DB trên ổ SSD; so với ổ SCSI, RT của loại ổ trước sẽ thấp hơn nhiều.