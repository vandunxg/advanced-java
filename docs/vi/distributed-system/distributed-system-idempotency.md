# Thiết kế tính idempotency cho giao diện dịch vụ phân tán như thế nào?

## Câu hỏi phỏng vấn

Thiết kế tính idempotency cho giao diện dịch vụ phân tán như thế nào (ví dụ không được trừ tiền nhiều lần)?

## Phân tích góc nhìn của người phỏng vấn

Bắt đầu từ câu hỏi này, người phỏng vấn đã chuyển sang hỏi về **các vấn đề thực tế trong môi trường production**.

Làm thế nào để bảo đảm tính idempotency cho một giao diện trong hệ thống phân tán? Đây thực ra là một vấn đề kỹ thuật production mà bạn phải cân nhắc khi xây dựng hệ thống phân tán. Ý nghĩa cụ thể là gì?

Giả sử bạn có một dịch vụ cung cấp một số giao diện cho bên ngoài gọi; dịch vụ được triển khai trên 5 máy. Một trong các giao diện đó là **giao diện thanh toán**. Khi người dùng thao tác trên giao diện phía trước, không biết vì sao nhưng một đơn hàng **vô tình gửi yêu cầu thanh toán hai lần**, và hai yêu cầu được chuyển đến các máy khác nhau của dịch vụ. Kết quả là đơn hàng bị trừ tiền hai lần.

Hoặc hệ thống đơn hàng gọi hệ thống thanh toán để thanh toán, nhưng vô tình gặp **timeout mạng**; hệ thống đơn hàng chạy cơ chế thử lại đã nói ở phần trước và gửi lại yêu cầu. Hệ thống thanh toán nhận cùng một yêu cầu thanh toán hai lần, mà do thuật toán cân bằng tải, chúng lại đến các máy khác nhau — thật khó xử...

Vì vậy, chắc chắn bạn phải hiểu vấn đề này; nếu không, hệ thống phân tán bạn xây dựng có thể tiềm ẩn lỗi.

## Phân tích câu hỏi phỏng vấn

Đây không phải vấn đề có một phương pháp kỹ thuật chung cho mọi trường hợp; cần bảo đảm tính idempotency bằng cách **kết hợp với nghiệp vụ**.

**Tính idempotency** nghĩa là khi cùng một yêu cầu được gửi nhiều lần đến một giao diện, giao diện phải bảo đảm kết quả chính xác, chẳng hạn không trừ tiền nhiều lần, không chèn thêm một bản ghi trùng, không cộng thêm 1 nhiều lần vào giá trị thống kê. Đó chính là tính idempotency.

Về cơ bản, có ba điểm để bảo đảm tính idempotency:

-   Mỗi yêu cầu phải có một định danh duy nhất. Ví dụ, yêu cầu thanh toán đơn hàng chắc chắn phải có order id; mỗi order id chỉ được thanh toán tối đa một lần, đúng không?
-   Sau mỗi lần xử lý yêu cầu, phải có bản ghi đánh dấu rằng yêu cầu đã được xử lý. Một phương án phổ biến là ghi trạng thái trong MySQL; ví dụ, trước khi thanh toán thì ghi một bản ghi giao dịch thanh toán cho đơn hàng.
-   Mỗi khi nhận yêu cầu, cần kiểm tra xem yêu cầu đã được xử lý trước đó hay chưa. Chẳng hạn, nếu một đơn hàng đã được thanh toán thì đã có bản ghi giao dịch thanh toán; khi yêu cầu này được gửi lại, trước tiên hãy chèn bản ghi giao dịch. orderId đã tồn tại nên ràng buộc khóa duy nhất có hiệu lực và thao tác chèn báo lỗi. Sau đó không cần trừ tiền nữa.

Trong thực tế vận hành, cần kết hợp với nghiệp vụ của mình; chẳng hạn dùng Redis với orderId làm khóa duy nhất. Chỉ sau khi chèn thành công bản ghi giao dịch thanh toán mới được thực hiện thao tác trừ tiền thực tế.

Yêu cầu là mỗi lần thanh toán đơn hàng phải chèn một bản ghi giao dịch thanh toán và tạo khóa duy nhất `unique key` trên order_id. Trước khi thanh toán đơn hàng, hãy chèn một bản ghi giao dịch thanh toán để order_id được ghi nhận. Sau đó có thể ghi một dấu hiệu vào Redis: `set order_id payed`. Khi yêu cầu trùng lặp đến lần sau, trước tiên hãy tra value tương ứng với order_id trong Redis; nếu là `payed` thì nghĩa là đã thanh toán, không được thanh toán lại.
