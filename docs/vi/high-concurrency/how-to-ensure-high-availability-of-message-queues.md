# Làm thế nào đảm bảo high availability cho message queue?

## Câu hỏi phỏng vấn

Làm thế nào đảm bảo high availability cho message queue?

## Phân tích suy nghĩ của người phỏng vấn

Nếu có người hỏi kiến thức MQ của bạn thì **high availability chắc chắn là câu hỏi bắt buộc**. [Phần trước](./why-mq.md) đã nói MQ làm **giảm availability của hệ thống**. Vì vậy, nếu dùng MQ thì các câu hỏi tiếp theo chắc chắn xoay quanh cách giải quyết những nhược điểm của MQ.

Nếu bạn dùng MQ một cách ngây thơ mà chưa từng cân nhắc các vấn đề khác nhau thì sẽ gặp rắc rối. Người phỏng vấn sẽ nghĩ bạn chỉ biết dùng một số kỹ thuật đơn giản, không hề suy nghĩ; ấn tượng về bạn sẽ nhanh chóng xấu đi. Tuyển một người như vậy vào vị trí nhân viên bình thường với mức lương dưới 20k thì còn tạm được; nhưng nếu tuyển làm senior engineer với lương trên 20k thì rất tệ: giao thiết kế hệ thống cho bạn sẽ có cả đống vấn đề; khi xảy ra sự cố công ty chịu tổn thất và cả team cùng chịu trách nhiệm.

## Phân tích câu hỏi phỏng vấn

Cách hỏi câu này rất tốt, vì không thể hỏi bạn làm sao đảm bảo high availability của Kafka hay của ActiveMQ. Nếu người phỏng vấn hỏi như vậy thì có vẻ thiếu hiểu biết; người được phỏng vấn có thể đang dùng RabbitMQ, chưa từng dùng Kafka, vậy hỏi Kafka để làm gì? Chẳng phải rõ ràng là đang làm khó người ta sao?

Vì vậy, người phỏng vấn có kinh nghiệm sẽ hỏi làm sao đảm bảo high availability của MQ. Bạn đã dùng MQ nào thì hãy trình bày hiểu biết của mình về high availability của MQ đó.

### High availability của RabbitMQ

RabbitMQ là một ví dụ điển hình, vì nó đảm bảo high availability **dựa trên kiến trúc primary-replica** (không phân tán). Chúng ta sẽ lấy RabbitMQ làm ví dụ để trình bày cách triển khai high availability của loại MQ thứ nhất.

RabbitMQ có ba chế độ: chế độ standalone, chế độ cluster thông thường và chế độ mirror cluster.

#### Chế độ standalone

Chế độ standalone chỉ ở mức Demo; thông thường bạn khởi chạy ở máy cá nhân để thử nghiệm, không ai dùng chế độ standalone trong production.

#### Chế độ cluster thông thường (không có high availability)

Chế độ cluster thông thường nghĩa là khởi chạy nhiều RabbitMQ instance trên nhiều máy, mỗi máy một instance. **Queue bạn tạo chỉ nằm trên một RabbitMQ instance**, nhưng metadata của queue được đồng bộ đến từng instance (có thể xem metadata là một số thông tin cấu hình của queue; thông qua metadata có thể tìm ra instance chứa queue). Khi consumer tiêu thụ, nếu kết nối đến một instance khác thì instance đó sẽ lấy dữ liệu từ instance chứa queue.

![mq-7](./images/mq-7.png)

Cách này thực sự khá phiền và không tốt, **không đạt được cái gọi là phân tán**, chỉ là một cluster thông thường. Vì vậy hoặc consumer kết nối ngẫu nhiên đến một instance mỗi lần rồi lấy dữ liệu, hoặc kết nối cố định đến instance chứa queue để tiêu thụ. Cách đầu có **chi phí lấy dữ liệu**; cách sau dẫn đến **nút thắt hiệu năng ở một instance đơn lẻ**.

Ngoài ra, nếu instance chứa queue bị sập thì các instance khác sẽ không thể lấy dữ liệu từ instance đó. Nếu bạn **bật message persistence** để RabbitMQ lưu message xuống đĩa thì **message chưa chắc bị mất**; cần đợi instance đó khôi phục rồi mới có thể tiếp tục lấy message từ queue.

Vì vậy, tình huống này khá khó xử: **không có high availability thực sự**. **Phương án này chủ yếu tăng throughput**, cho phép nhiều node trong cluster phục vụ thao tác đọc ghi trên một queue.

#### Chế độ mirror cluster (⚠️ đã deprecated, không khuyến nghị sử dụng)

> **⚠️ Cập nhật quan trọng**: Từ RabbitMQ phiên bản 4.0, chế độ mirror cluster chính thức đã deprecated; không còn hỗ trợ thêm mirror policy mới. Khuyến nghị người dùng hiện tại sớm migration sang Quorum Queues.

Trước đây, đây từng là chế độ high availability của RabbitMQ. Khác với chế độ cluster thông thường, trong mirror cluster, queue bạn tạo — cả metadata lẫn message trong queue — đều **tồn tại trên nhiều instance**. Nghĩa là mỗi RabbitMQ node đều có một **mirror đầy đủ** của queue, bao gồm toàn bộ dữ liệu queue. Sau đó, mỗi lần ghi message vào queue, message sẽ tự động được **đồng bộ** đến queue trên nhiều instance.

![mq-8](./images/mq-8.png)

Vậy **bật chế độ mirror cluster** như thế nào? Thực ra rất đơn giản. RabbitMQ có management console tốt; chỉ cần thêm policy trong backend. Policy này là **policy cho chế độ mirror cluster**; khi chỉ định, có thể yêu cầu đồng bộ dữ liệu đến mọi node hoặc đến một số node xác định. Khi tạo queue tiếp theo và áp dụng policy này, dữ liệu sẽ tự động được đồng bộ sang các node khác.

Ưu điểm là nếu bất kỳ máy nào bị sập thì không sao, vì các máy (node) khác vẫn có toàn bộ dữ liệu queue; consumer khác có thể tiêu thụ dữ liệu từ các node đó. Nhược điểm: thứ nhất, chi phí hiệu năng quá lớn vì message cần được đồng bộ sang mọi máy, tạo áp lực và tiêu tốn nhiều băng thông mạng. Thứ hai, làm như vậy không phải là phân tán nên **không có khả năng mở rộng**. Nếu một queue có tải nặng thì việc thêm máy vẫn khiến máy mới chứa toàn bộ dữ liệu của queue, **không thể mở rộng queue tuyến tính**. Hãy nghĩ xem: nếu lượng dữ liệu queue lớn đến mức vượt quá dung lượng máy thì lúc đó phải làm thế nào?


#### Quorum Queues (queue quorum, khuyến nghị)

Từ RabbitMQ phiên bản 3.8, Quorum Queues được giới thiệu như một giải pháp high availability mới nhằm thay thế chế độ mirror cluster truyền thống.

**Nguyên lý cốt lõi**: dựa trên thuật toán đồng thuận Raft, Quorum Queues đảm bảo tính nhất quán dữ liệu giữa nhiều node thông qua quorum replication.

**Ưu điểm chính**:
- **Nhất quán dữ liệu**: dựa trên thuật toán Raft, đảm bảo message chỉ được xem là ghi thành công sau khi phần lớn node trong quorum xác nhận
- **Failover tự động**: sau khi leader node bị sập, hệ thống tự động bầu chọn lại, không cần can thiệp thủ công
- **Mở rộng tuyến tính**: có thể mở rộng số lượng replica độc lập, không bị giới hạn bởi dung lượng một node
- **Tối ưu persistence**: hỗ trợ lưu trữ theo segment, hiệu năng tốt hơn khi refresh tuần tự

**Ví dụ cấu hình**:
```bash
rabbitmqctl set_policy ha-quorum "^quorum\." '{"ha-mode":" quorum"}'
```

**Tình huống áp dụng**:
- Môi trường production yêu cầu độ tin cậy dữ liệu cao
- Triển khai phân tán cần khả năng mở rộng tốt hơn
- Lộ trình nâng cấp thay thế chế độ mirror cluster truyền thống

**Lưu ý**:
- Quorum Queues chỉ hỗ trợ message persistence (persistent), không phù hợp với queue tạm thời
- Tiêu thụ nhiều tài nguyên hơn queue thông thường; cần quy hoạch số lượng node hợp lý
- Cần tối thiểu 3 node để hình thành quorum hợp lệ

**Khuyến nghị migration**: Với các queue hiện dùng mirror cluster, khuyến nghị chuyển dần sang Quorum Queues. Trong quá trình migration, cần lưu ý cấu hình message persistence và khả năng tương thích của consumer.

### High availability của Kafka

Nhận thức cơ bản nhất về kiến trúc Kafka: Kafka gồm nhiều broker, mỗi broker là một node. Bạn tạo một topic; topic này có thể được chia thành nhiều partition, mỗi partition có thể nằm trên một broker khác nhau và mỗi partition chỉ chứa một phần dữ liệu.

Đây là **message queue phân tán tự nhiên**; dữ liệu của một topic được **phân tán trên nhiều máy, mỗi máy chứa một phần dữ liệu**.

Trên thực tế, RabbitMQ và các hệ thống tương tự không phải message queue phân tán; đó là message queue truyền thống, chỉ cung cấp một số cơ chế cluster và HA (High Availability, high availability). Dù triển khai thế nào, dữ liệu của một queue RabbitMQ vẫn nằm trên một node; ở chế độ mirror cluster, mỗi node cũng chứa toàn bộ dữ liệu của queue đó.

Trước Kafka 0.8 chưa có cơ chế HA: nếu một broker bị sập thì partition trên broker đó không thể đọc hay ghi, không có high availability thực sự.

Ví dụ, giả sử tạo một topic và chỉ định có 3 partition, lần lượt nằm trên ba máy. Nếu máy thứ hai bị sập thì 1/3 dữ liệu của topic bị mất; do đó không thể đạt high availability.

![kafka-before](./images/kafka-before.png)

Từ Kafka 0.8 trở đi có cơ chế HA là replica (bản sao). Dữ liệu của mỗi partition được đồng bộ sang các máy khác để tạo nhiều replica riêng. Các replica sẽ bầu ra một leader; producer và consumer đều làm việc với leader, còn các replica khác là follower. Khi ghi, leader chịu trách nhiệm đồng bộ dữ liệu sang tất cả follower; khi đọc thì đọc trực tiếp dữ liệu trên leader. Chỉ có thể đọc ghi leader thôi sao? Rất đơn giản: **nếu tùy ý đọc ghi từng follower thì phải quan tâm đến vấn đề nhất quán dữ liệu**, khiến độ phức tạp của hệ thống quá cao và rất dễ phát sinh vấn đề. Kafka phân phối đồng đều mọi replica của một partition lên các máy khác nhau để tăng khả năng chịu lỗi.

![kafka-after](./images/kafka-after.png)

Làm như vậy sẽ có **high availability**: nếu một broker bị sập thì không sao, vì partition trên broker đó đều có bản sao ở các máy khác. Nếu partition trên broker bị sập là leader thì hệ thống sẽ **bầu chọn lại** một leader mới từ các follower; mọi người tiếp tục đọc ghi trên leader mới. Đó chính là high availability.

Khi **ghi dữ liệu**, producer ghi vào leader; leader ghi dữ liệu xuống đĩa cục bộ, sau đó các follower chủ động pull dữ liệu từ leader. Khi tất cả follower đã đồng bộ dữ liệu, chúng gửi ack cho leader; sau khi nhận ack của tất cả follower, leader mới trả thông báo ghi thành công cho producer. (Dĩ nhiên đây chỉ là một trong các chế độ; cũng có thể điều chỉnh hành vi này cho phù hợp.)

Khi **tiêu thụ**, chỉ đọc từ leader; nhưng consumer chỉ đọc được message sau khi message đó đã được tất cả follower đồng bộ thành công và trả ack.

Đến đây, hy vọng bạn đã hiểu đại khái cách Kafka đảm bảo high availability, đúng không? Không đến mức hoàn toàn không biết gì; tại buổi phỏng vấn vẫn có thể vẽ sơ đồ cho người phỏng vấn. Nếu gặp người phỏng vấn thực sự là chuyên gia Kafka và hỏi sâu hơn thì chỉ có thể nói rằng mình chưa nghiên cứu phần quá chuyên sâu.