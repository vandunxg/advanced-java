# Thiết kế tính idempotent cho interface dịch vụ phân tán như thế nào?

## Câu hỏi phỏng vấn

Thiết kế tính idempotent cho interface dịch vụ phân tán như thế nào (ví dụ không được trừ tiền nhiều lần)?

## Phân tích tâm lý người phỏng vấn

Từ câu hỏi này, người phỏng vấn đã bắt đầu đi sâu vào **các vấn đề thực tế trong môi trường production**.

Trong một hệ thống phân tán, làm thế nào để bảo đảm tính idempotent cho một interface? Đây thực ra là một vấn đề kỹ thuật trong môi trường production mà bạn bắt buộc phải cân nhắc khi xây dựng hệ thống phân tán. Cụ thể là gì?

Giả sử bạn có một dịch vụ cung cấp một số interface cho bên ngoài gọi đến, và dịch vụ này được triển khai trên 5 máy. Trong đó có một **interface thanh toán**. Khi người dùng thao tác trên frontend, không biết vì sao, nhưng tóm lại là một đơn hàng **vô tình phát sinh hai yêu cầu thanh toán**, rồi hai yêu cầu này được phân tán đến những máy khác nhau trong số các máy triển khai dịch vụ. Kết quả là một đơn hàng bị trừ tiền hai lần.

Hoặc hệ thống đơn hàng gọi hệ thống thanh toán để thanh toán, nhưng không may xảy ra **timeout mạng**, nên hệ thống đơn hàng sử dụng cơ chế retry đã nói ở phần trước và thử lại một lần. Hệ thống thanh toán nhận cùng một yêu cầu thanh toán hai lần; do thuật toán cân bằng tải, hai yêu cầu lại được chuyển đến các máy khác nhau. Thật khó xử...

Vì vậy, bạn chắc chắn phải hiểu vấn đề này; nếu không, hệ thống phân tán bạn xây dựng rất dễ để lại những lỗi tiềm ẩn.

## Phân tích câu hỏi phỏng vấn

Đây không phải là vấn đề có thể giải quyết bằng một phương pháp kỹ thuật chung; cần **kết hợp với nghiệp vụ** để bảo đảm tính idempotent.

**Tính idempotent** nghĩa là khi cùng một yêu cầu được gửi đến một interface nhiều lần, interface đó phải bảo đảm kết quả chính xác; chẳng hạn, không được trừ tiền nhiều lần, không được chèn thêm một bản ghi, cũng không được cộng thêm 1 vào giá trị thống kê nhiều lần. Đó chính là tính idempotent.

Về cơ bản, có ba điểm chính để bảo đảm tính idempotent:

-   Đối với mỗi yêu cầu, phải có một định danh duy nhất. Ví dụ, yêu cầu thanh toán đơn hàng chắc chắn phải chứa order id; một order id chỉ được thanh toán tối đa một lần, đúng không?
-   Sau mỗi lần xử lý yêu cầu, phải có một bản ghi đánh dấu yêu cầu đó đã được xử lý. Một phương án phổ biến là ghi lại trạng thái trong MySQL; ví dụ, trước khi thanh toán, ghi một bản ghi giao dịch thanh toán cho đơn hàng.
-   Mỗi khi nhận yêu cầu, cần kiểm tra xem yêu cầu đó đã được xử lý trước đó hay chưa. Ví dụ, nếu một đơn hàng đã được thanh toán thì đã có một bản ghi giao dịch thanh toán; khi yêu cầu trùng lặp được gửi đến, trước tiên hãy chèn bản ghi giao dịch. Vì orderId đã tồn tại nên ràng buộc khóa duy nhất có hiệu lực, thao tác chèn sẽ báo lỗi và không chèn được. Sau đó, bạn không cần trừ tiền nữa.

Trong thực tế vận hành, cần kết hợp với nghiệp vụ cụ thể của mình; chẳng hạn, sử dụng Redis với orderId làm khóa duy nhất. Chỉ khi chèn thành công bản ghi giao dịch thanh toán thì mới được thực hiện thao tác trừ tiền thực tế.

Yêu cầu là khi thanh toán một đơn hàng, bắt buộc phải chèn một bản ghi giao dịch thanh toán và tạo khóa duy nhất `unique key` trên order_id. Trước khi thanh toán một đơn hàng, trước tiên hãy chèn một bản ghi giao dịch thanh toán để order_id được ghi nhận. Sau đó, có thể ghi một giá trị đánh dấu vào Redis: `set order_id payed`. Khi yêu cầu trùng lặp đến vào lần sau, trước tiên hãy kiểm tra value tương ứng với order_id trong Redis; nếu value là `payed` thì nghĩa là đã thanh toán rồi, không được thanh toán lại.
