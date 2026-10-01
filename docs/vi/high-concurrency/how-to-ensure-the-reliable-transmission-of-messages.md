# Làm thế nào đảm bảo truyền message đáng tin cậy?

## Câu hỏi phỏng vấn

Làm thế nào đảm bảo truyền message đáng tin cậy? Hay nói cách khác, xử lý vấn đề mất message như thế nào?

## Phân tích suy nghĩ của người phỏng vấn

Điều này là chắc chắn: có một nguyên tắc cơ bản khi dùng MQ, đó là **không được thừa cũng không được thiếu dữ liệu**. Không được thừa nghĩa là vấn đề **[tiêu thụ lặp lại và tính idempotent](./how-to-ensure-that-messages-are-not-repeatedly-consumed.md)** đã nói trước đó. Không được thiếu nghĩa là không để mất dữ liệu. Vì vậy bạn bắt buộc phải cân nhắc vấn đề này.

Nếu dùng MQ để truyền các message cực kỳ cốt lõi, chẳng hạn message tính phí hoặc trừ tiền, thì phải đảm bảo trong quá trình MQ truyền tải **tuyệt đối không làm mất message tính phí**.

## Phân tích câu hỏi phỏng vấn

Vấn đề mất dữ liệu có thể xảy ra ở producer, MQ hoặc consumer. Hãy phân tích riêng với RabbitMQ và Kafka.

### RabbitMQ

![rabbitmq-message-lose](../../high-concurrency/images/rabbitmq-message-lose.png)

#### Producer làm mất dữ liệu

Khi producer gửi dữ liệu đến RabbitMQ, dữ liệu có thể bị mất giữa đường do vấn đề mạng hoặc nguyên nhân khác.

Lúc này có thể chọn dùng chức năng transaction của RabbitMQ: trước khi **gửi dữ liệu**, producer bắt đầu transaction RabbitMQ bằng `channel.txSelect()`, rồi gửi message. Nếu RabbitMQ không nhận được message thành công thì producer nhận exception; khi đó có thể rollback transaction bằng `channel.txRollback()` rồi thử gửi lại. Nếu nhận được message thì có thể commit transaction bằng `channel.txCommit()`.

```java
try {
    // 通过工厂创建连接
    connection = factory.newConnection();
    // 获取通道
    channel = connection.createChannel();
    // 开启事务
    channel.txSelect();

    // 这里发送消息
    channel.basicPublish(exchange, routingKey, MessageProperties.PERSISTENT_TEXT_PLAIN, msg.getBytes());

    // 模拟出现异常
    int result = 1 / 0;

    // 提交事务
    channel.txCommit();
} catch (IOException | TimeoutException e) {
    // 捕捉异常，回滚事务
    channel.txRollback();
}
```

Tuy nhiên, khi dùng cơ chế transaction (đồng bộ) của RabbitMQ thì **throughput về cơ bản sẽ giảm vì quá tốn hiệu năng**.

Vì vậy, nếu muốn đảm bảo message ghi vào RabbitMQ không bị mất thì thường bật chế độ `confirm`. Sau khi bật chế độ `confirm` ở producer, mỗi message gửi đi sẽ được gán một id duy nhất. Nếu ghi vào RabbitMQ thành công, RabbitMQ sẽ gửi lại message `ack` để báo message đã ổn. Nếu RabbitMQ không xử lý được message thì sẽ gọi lại interface `nack` để báo nhận thất bại; bạn có thể thử gửi lại. Bạn cũng có thể kết hợp cơ chế này để tự duy trì trạng thái của từng message id trong bộ nhớ; nếu quá thời gian nhất định mà chưa nhận được callback của message thì có thể gửi lại.

Khác biệt lớn nhất giữa cơ chế transaction và cơ chế `confirm` là **transaction là đồng bộ**: sau khi commit transaction, luồng sẽ **bị block** tại đó. Còn cơ chế `confirm` là **bất đồng bộ**: sau khi gửi message thì có thể gửi message kế tiếp; khi RabbitMQ nhận message đó, nó sẽ bất đồng bộ gọi lại một interface để thông báo đã nhận.

Vì vậy, để **tránh mất dữ liệu** ở phía producer, thông thường dùng cơ chế `confirm`.

> Channel đã ở chế độ transaction thì không thể chuyển sang chế độ confirm; nghĩa là hai chế độ này không thể cùng tồn tại.

Có 3 cách triển khai `confirm` phía producer của client:

1.**Chế độ confirm thông thường**: sau mỗi message được gửi, gọi phương thức `waitForConfirms()` để đợi server confirm. Nếu server trả về false hoặc không trả về trong một khoảng thời gian, client có thể gửi lại message.

```java
channel.basicPublish(ConfirmConfig.exchangeName, ConfirmConfig.routingKey, MessageProperties.PERSISTENT_TEXT_PLAIN, ConfirmConfig.msg_10B.getBytes());
if (!channel.waitForConfirms()) {
    // 消息发送失败
    // ...
}
```

2.**Chế độ confirm theo lô**: sau khi gửi một lô message, gọi phương thức `waitForConfirms()` để đợi server confirm.

```java
channel.confirmSelect();
for (int i = 0; i < batchCount; ++i) {
    channel.basicPublish(ConfirmConfig.exchangeName, ConfirmConfig.routingKey, MessageProperties.PERSISTENT_TEXT_PLAIN, ConfirmConfig.msg_10B.getBytes());
}
if (!channel.waitForConfirms()) {
    // 消息发送失败
    // ...
}
```

3.**Chế độ confirm bất đồng bộ**: cung cấp một callback; sau khi server confirm một hoặc nhiều message, client sẽ gọi lại phương thức này.

```java
SortedSet<Long> confirmSet = Collections.synchronizedSortedSet(new TreeSet<Long>());
channel.confirmSelect();
channel.addConfirmListener(new ConfirmListener() {
    public void handleAck(long deliveryTag, boolean multiple) throws IOException {
        if (multiple) {
            confirmSet.headSet(deliveryTag + 1).clear();
        } else {
            confirmSet.remove(deliveryTag);
        }
    }

    public void handleNack(long deliveryTag, boolean multiple) throws IOException {
        System.out.println("Nack, SeqNo: " + deliveryTag + ", multiple: " + multiple);
        if (multiple) {
            confirmSet.headSet(deliveryTag + 1).clear();
        } else {
            confirmSet.remove(deliveryTag);
        }
    }
});

while (true) {
    long nextSeqNo = channel.getNextPublishSeqNo();
    channel.basicPublish(ConfirmConfig.exchangeName, ConfirmConfig.routingKey, MessageProperties.PERSISTENT_TEXT_PLAIN, ConfirmConfig.msg_10B.getBytes());
    confirmSet.add(nextSeqNo);
}
```

#### RabbitMQ làm mất dữ liệu

Trường hợp này là RabbitMQ tự làm mất dữ liệu. Bạn bắt buộc phải **bật persistence của RabbitMQ**; sau khi message được ghi, nó sẽ được lưu bền vững xuống đĩa. Dù RabbitMQ tự sập thì **sau khi khôi phục, nó sẽ tự động đọc lại dữ liệu đã lưu trước đó**; thông thường dữ liệu không mất. Trừ trường hợp cực kỳ hiếm là RabbitMQ chưa kịp persistence thì đã sập, **có thể dẫn đến mất một lượng nhỏ dữ liệu**, nhưng xác suất thấp.

Có **hai bước** để đặt persistence:

-   Khi tạo queue, đặt queue thành persistent. Như vậy đảm bảo RabbitMQ persistence metadata của queue, nhưng không persistence dữ liệu bên trong queue.

-   Bước thứ hai là đặt `deliveryMode` của message thành 2 khi gửi. Tức đặt message là persistent, khi đó RabbitMQ sẽ persistence message xuống đĩa.

Phải đồng thời đặt cả hai cấu hình persistence này. Kể cả RabbitMQ bị sập rồi khởi động lại, nó cũng sẽ khởi động lại queue từ đĩa và khôi phục dữ liệu trong queue.

Lưu ý, dù bật cơ chế persistence của RabbitMQ vẫn có khả năng message đã được ghi vào RabbitMQ nhưng chưa kịp persistence xuống đĩa thì RabbitMQ không may bị sập; lúc đó một phần nhỏ dữ liệu trong bộ nhớ sẽ bị mất.

Vì vậy, có thể phối hợp persistence với cơ chế `confirm` ở producer: chỉ sau khi message được persistence xuống đĩa thì RabbitMQ mới thông báo `ack` cho producer. Do đó, kể cả RabbitMQ bị sập và mất dữ liệu trước khi persistence xuống đĩa, producer không nhận được `ack` thì vẫn có thể tự gửi lại.

#### Consumer làm mất dữ liệu

Nếu RabbitMQ làm mất dữ liệu thì nguyên nhân chính là khi tiêu thụ, **vừa nhận message nhưng chưa xử lý xong thì process đã sập**, chẳng hạn bị khởi động lại. Khi đó RabbitMQ nghĩ bạn đã tiêu thụ xong và message bị mất.

Lúc này cần dùng cơ chế `ack` của RabbitMQ. Nói đơn giản, phải tắt `ack` tự động của RabbitMQ, có thể gọi qua một API; sau đó chỉ `ack` trong chương trình sau khi code của bạn đảm bảo đã xử lý xong. Như vậy, nếu chưa xử lý xong thì chưa có `ack`; RabbitMQ sẽ xem là bạn chưa xử lý xong và phân phối lượt tiêu thụ này cho consumer khác. Message sẽ không bị mất.

> Để đảm bảo message được truyền đáng tin cậy từ queue đến consumer, RabbitMQ cung cấp cơ chế xác nhận message. Khi khai báo queue, consumer có thể chỉ định tham số noAck. Khi noAck=false, RabbitMQ chờ consumer gửi tín hiệu ack tường minh rồi mới xóa message khỏi bộ nhớ (và đĩa nếu là message persistent). Nếu không, ngay khi consumer nhận message, RabbitMQ sẽ lập tức xóa message khỏi queue.

![rabbitmq-message-lose-solution](../../high-concurrency/images/rabbitmq-message-lose-solution.png)

### Kafka

#### Consumer làm mất dữ liệu

Trường hợp duy nhất có thể khiến consumer làm mất dữ liệu là consumer đã nhận message, sau đó **tự động commit offset** khiến Kafka tưởng message đã được tiêu thụ xong, nhưng thực tế consumer mới chuẩn bị xử lý message, chưa xử lý xong thì đã sập. Khi đó message này sẽ mất.

Chẳng phải chuyện này giống RabbitMQ sao? Mọi người đều biết Kafka tự động commit offset; chỉ cần **tắt commit tự động** rồi tự commit offset sau khi xử lý xong là có thể đảm bảo dữ liệu không bị mất. Tuy nhiên lúc này vẫn **có thể tiêu thụ lặp lại**: chẳng hạn vừa xử lý xong nhưng chưa commit offset thì process bị sập; lúc đó chắc chắn sẽ tiêu thụ lặp lại một lần. Chỉ cần tự đảm bảo tính idempotent.

Một vấn đề gặp trong production: sau khi Kafka consumer nhận dữ liệu thì trước tiên ghi vào một queue trong bộ nhớ để đệm; đôi khi ngay sau khi ghi message vào memory queue thì consumer tự động commit offset. Nếu lúc này chúng ta khởi động lại hệ thống thì dữ liệu trong memory queue chưa kịp xử lý sẽ bị mất.

#### Kafka làm mất dữ liệu

Một tình huống khá phổ biến là một broker Kafka bị sập rồi hệ thống bầu chọn lại leader của partition. Hãy nghĩ xem: nếu các follower khác còn một số dữ liệu chưa được đồng bộ thì leader bị sập, sau đó một follower được bầu làm leader, chẳng phải sẽ thiếu một phần dữ liệu sao? Đó là mất dữ liệu.

Chúng tôi cũng từng gặp tình huống này trong production: trước đây máy leader của Kafka bị sập; sau khi chuyển follower thành leader thì phát hiện dữ liệu đã bị mất.

Vì vậy, thông thường cần đặt ít nhất 4 tham số sau:

-   Đặt tham số `replication.factor` cho topic: giá trị phải lớn hơn 1; yêu cầu mỗi partition có ít nhất 2 replica.
-   Đặt tham số `min.insync.replicas` ở Kafka server: giá trị phải lớn hơn 1; yêu cầu leader nhận biết ít nhất một follower vẫn liên lạc với mình và không bị tụt lại, để khi leader sập vẫn còn follower.
-   Đặt `acks=all` ở producer: yêu cầu mỗi bản ghi **chỉ được xem là ghi thành công sau khi đã ghi vào tất cả replica**.
-   Đặt `retries=MAX` ở producer (một giá trị rất lớn, tức thử lại vô hạn): **yêu cầu tiếp tục retry vô hạn khi ghi thất bại**, chờ ở đó.

Trong production, chúng tôi cấu hình theo các yêu cầu trên. Với cấu hình này, ít nhất phía Kafka broker có thể đảm bảo dữ liệu không mất khi broker chứa leader gặp sự cố và hệ thống chuyển đổi leader.

#### Producer có làm mất dữ liệu không?

Nếu đã đặt `acks=all` theo hướng trên thì chắc chắn không mất dữ liệu; yêu cầu là leader nhận message và tất cả follower đồng bộ message xong thì mới xem lần ghi này thành công. Nếu chưa đáp ứng điều kiện đó, producer sẽ tự động retry liên tục, không giới hạn số lần.

### RocketMQ

#### Các tình huống mất message

1. Producer gửi message đến MQ có thể làm mất message.
2. MQ nhận message rồi ghi vào đĩa có thể làm mất message.
3. Sau khi message được ghi vào đĩa, đĩa hỏng và làm mất message.
4. Consumer tiêu thụ MQ cũng có thể làm mất message.
5. Toàn bộ MQ node bị sập và làm mất message.

#### Làm thế nào đảm bảo không mất message khi producer gửi?

Có thể giải quyết vấn đề mất message khi gửi bằng cơ chế **transaction message** tích hợp trong RocketMQ.

Nguyên lý transaction message: trước tiên producer gửi một **half message** (gói bọc message gốc); consumer không nhìn thấy message này. MQ trả trạng thái nhận message thông qua cơ chế ACK; producer thực thi local transaction rồi trả một trạng thái cho MQ (Commit, RollBack, v.v.). Nếu là Commit thì MQ gửi message xuống hạ lưu; nếu RollBack thì bỏ message. Nếu trạng thái là UnKnow thì sau một khoảng thời gian MQ kiểm tra lại trạng thái local transaction; mặc định kiểm tra 15 lần. Nếu trạng thái vẫn luôn là UnKnow thì MQ sẽ bỏ message này.

Vì sao gửi half message trước? Mục đích là kiểm tra trước xem MQ có vấn đề hay không, service có hoạt động bình thường không.

#### Làm thế nào đảm bảo message không mất khi MQ nhận rồi ghi vào đĩa?

Bỏ qua cache khi lưu dữ liệu, chuyển sang flush đồng bộ. Bước này cần sửa file cấu hình Broker, đổi flushDiskType thành chiến lược flush đồng bộ SYNC_FLUSH. Mặc định là flush bất đồng bộ ASYNC_FLUSH; khi flush đồng bộ trả về thành công thì chắc chắn message đã được persistence vào đĩa.

#### Làm thế nào đảm bảo message không mất nếu đĩa hỏng sau khi ghi message?

Để tránh mất dữ liệu do hỏng đĩa, RocketMQ dùng kiến trúc primary-replica và triển khai cluster; dữ liệu trong Leader có các bản sao lưu ở nhiều Follower để tránh mất dữ liệu do single point of failure.

Nếu Master node bị sập thì sao? Sau khi Master node bị sập, DLedger sẽ được dùng:

-   Tiếp quản commitLog của MQ
-   Bầu chọn node phụ
-   Sao chép file ở trạng thái uncommited; phần lớn node phụ chuyển sang trạng thái commited sau khi nhận được

#### Làm thế nào đảm bảo không mất dữ liệu khi consumer tiêu thụ MQ?

1. Nếu tiêu thụ thất bại do vấn đề mạng thì có thể retry; mặc định mỗi message được retry 16 lần.
2. Nếu tiêu thụ bất đồng bộ đa luồng thất bại, MQ cho rằng đã tiêu thụ thành công nhưng trên thực tế logic nghiệp vụ chưa lưu message xuống nơi cần thiết. Giải pháp là làm theo khuyến nghị chính thức của MQ: thực thi local transaction trước rồi mới trả trạng thái thành công.

#### Làm thế nào đảm bảo không mất message nếu toàn bộ MQ node bị sập?

Với tình huống cực đoan này, sau khi gửi message thất bại có thể lưu tạm tại máy cục bộ, chẳng hạn đưa vào cache; đồng thời khởi động một thread để quét message trong cache và thử gửi lại.