# Thiết kế một message queue như thế nào?

## Câu hỏi phỏng vấn

Nếu yêu cầu bạn viết một message queue, bạn sẽ thiết kế kiến trúc như thế nào? Hãy trình bày ý tưởng của bạn.

## Phân tích suy nghĩ của người phỏng vấn

Thực ra khi nói đến câu hỏi này, thông thường người phỏng vấn muốn đánh giá hai khía cạnh:

-   Bạn đã tìm hiểu nguyên lý của một message queue nào đó tương đối sâu chưa, hoặc có hiểu và nắm được nguyên lý kiến trúc của một message queue ở mức tổng thể hay không.
-   Họ muốn xem năng lực thiết kế của bạn: đưa ra một hệ thống phổ biến, tức hệ thống message queue, rồi xem liệu bạn có thể nắm bắt kiến trúc tổng thể từ góc độ toàn cục và đưa ra một số điểm mấu chốt hay không.

Nói thật, khi được hỏi các câu tương tự thì phần lớn mọi người đều bối rối vì bình thường chưa từng suy nghĩ về vấn đề như vậy; **đa số chỉ chăm chú sử dụng mà không bao giờ suy nghĩ về những thứ phía sau**. Các câu hỏi tương tự gồm: nếu yêu cầu bạn thiết kế một framework Spring thì bạn sẽ làm thế nào? Nếu yêu cầu bạn thiết kế một framework Dubbo thì sao? Nếu yêu cầu bạn thiết kế một framework MyBatis thì sao?

## Phân tích câu hỏi phỏng vấn

Thực ra khi trả lời loại câu hỏi này, nói cho rõ là không yêu cầu bạn phải đọc source code của công nghệ đó; ít nhất cần biết sơ lược nguyên lý cơ bản, các thành phần cốt lõi và cấu trúc kiến trúc cơ bản của nó. Sau đó, tham khảo một số công nghệ mã nguồn mở và trình bày ý tưởng thiết kế hệ thống là được.

Ví dụ, với hệ thống message queue này, hãy thử xem xét một số góc độ sau:

-   Trước hết mq cần hỗ trợ khả năng mở rộng linh hoạt: khi cần phải mở rộng nhanh để tăng throughput và dung lượng. Làm thế nào? Thiết kế hệ thống phân tán; tham khảo ý tưởng thiết kế của kafka: broker -> topic -> partition, mỗi partition nằm trên một máy và lưu một phần dữ liệu. Nếu hiện tại không đủ tài nguyên thì rất đơn giản: tăng partition cho topic, rồi migration dữ liệu và thêm máy; như vậy có thể lưu thêm dữ liệu và cung cấp throughput cao hơn.

-   Tiếp theo, cần cân nhắc dữ liệu mq có cần ghi xuống đĩa không. Chắc chắn cần, vì chỉ khi ghi xuống đĩa mới đảm bảo process bị sập thì dữ liệu không mất. Vậy ghi xuống đĩa như thế nào? Ghi tuần tự để tránh chi phí định vị của thao tác đọc/ghi đĩa ngẫu nhiên; hiệu năng đọc/ghi tuần tự trên đĩa rất cao. Đây là ý tưởng của kafka.

-   Tiếp theo, cần cân nhắc availability của mq. Về vấn đề này, tham khảo cơ chế đảm bảo high availability của kafka đã giải thích ở phần availability trước đó: nhiều replica -> leader & follower -> khi broker sập thì bầu lại leader để tiếp tục cung cấp dịch vụ.

-   Có thể hỗ trợ không mất dữ liệu không? Có, tham khảo phương án không mất dữ liệu Kafka đã nói trước đó.

mq chắc chắn rất phức tạp. Khi người phỏng vấn hỏi câu này, thực ra đây là câu hỏi mở; họ muốn xem bạn có tư duy và năng lực suy nghĩ, thiết kế tổng thể từ góc độ kiến trúc hay không. Câu hỏi này thực sự có thể loại được nhiều người vì phần lớn mọi người bình thường không suy nghĩ về những việc này.
