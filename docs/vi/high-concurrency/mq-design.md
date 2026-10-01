# Thiết kế một message queue như thế nào?

## Câu hỏi phỏng vấn

Nếu yêu cầu bạn viết một message queue, bạn sẽ thiết kế kiến trúc như thế nào? Hãy trình bày ý tưởng của bạn.

## Phân tích suy nghĩ của người phỏng vấn

Thực ra khi nói đến câu hỏi này, thông thường người phỏng vấn muốn đánh giá hai khía cạnh:

-   Bạn đã tìm hiểu nguyên lý của một message queue nào đó tương đối sâu chưa, hoặc có hiểu và nắm được nguyên lý kiến trúc của một message queue ở mức tổng thể hay không.
-   Họ muốn xem năng lực thiết kế của bạn: đưa ra một hệ thống phổ biến, tức hệ thống message queue, rồi xem liệu bạn có thể nhìn nhận thiết kế kiến trúc một cách tổng thể và nêu ra một số điểm mấu chốt hay không.

Nói thật, khi được hỏi các câu tương tự thì phần lớn mọi người đều bối rối vì bình thường chưa từng suy nghĩ về những vấn đề như vậy; **đa số chỉ cắm đầu sử dụng mà không bao giờ suy nghĩ về những vấn đề phía sau**. Các câu hỏi tương tự gồm: nếu yêu cầu bạn thiết kế một framework Spring thì bạn sẽ làm thế nào? Nếu yêu cầu bạn thiết kế một framework Dubbo thì sao? Nếu yêu cầu bạn thiết kế một framework MyBatis thì sao?

## Phân tích câu hỏi phỏng vấn

Nói thẳng ra, khi trả lời loại câu hỏi này, không yêu cầu bạn phải đọc source code của công nghệ đó; ít nhất cần biết sơ lược nguyên lý cơ bản, các thành phần cốt lõi và kiến trúc cơ bản của nó. Sau đó, tham khảo một số công nghệ mã nguồn mở để trình bày ý tưởng thiết kế một hệ thống là được.

Ví dụ, với hệ thống message queue này, hãy thử xem xét một số góc độ sau:

-   Trước hết MQ cần hỗ trợ khả năng mở rộng (scalability): khi cần thì có thể mở rộng nhanh để tăng throughput và dung lượng. Làm thế nào? Hãy thiết kế một hệ thống phân tán; tham khảo ý tưởng thiết kế của Kafka: broker -> topic -> partition, mỗi partition nằm trên một máy và lưu một phần dữ liệu. Nếu hiện tại không đủ tài nguyên thì rất đơn giản: tăng partition cho topic, thực hiện migration dữ liệu rồi thêm máy; như vậy có thể lưu trữ nhiều dữ liệu hơn và cung cấp throughput cao hơn.

-   Tiếp theo, cần cân nhắc dữ liệu của MQ có cần được ghi xuống đĩa hay không. Chắc chắn là cần, vì chỉ khi ghi dữ liệu xuống đĩa thì mới đảm bảo dữ liệu không bị mất khi process bị sập. Vậy ghi xuống đĩa như thế nào? Ghi tuần tự để không phải chịu chi phí định vị của thao tác đọc/ghi đĩa ngẫu nhiên; hiệu năng đọc/ghi tuần tự trên đĩa rất cao. Đây là ý tưởng của Kafka.

-   Tiếp theo, cần cân nhắc availability của MQ. Về vấn đề này, hãy tham khảo cơ chế đảm bảo high availability của Kafka đã được giải thích ở phần availability trước đó: nhiều replica -> leader & follower -> khi broker bị sập thì bầu lại leader để tiếp tục cung cấp dịch vụ.

-   Có thể đảm bảo dữ liệu không bị mất không? Có, hãy tham khảo phương án không mất dữ liệu của Kafka đã được đề cập trước đó.

MQ chắc chắn rất phức tạp. Khi người phỏng vấn hỏi câu này, thực ra đây là câu hỏi mở; họ muốn xem bạn có tư duy và năng lực hình dung, thiết kế tổng thể ở góc độ kiến trúc hay không. Câu hỏi này thực sự có thể loại được không ít ứng viên vì bình thường phần lớn mọi người không suy nghĩ về những vấn đề này.
