# Vấn đề cạnh tranh đồng thời trong Redis

## Câu hỏi phỏng vấn

Vấn đề cạnh tranh đồng thời trong Redis là gì? Giải quyết vấn đề này như thế nào? Bạn có biết phương án CAS trong transaction của Redis không?

## Phân tích suy nghĩ của người phỏng vấn

Đây cũng là vấn đề rất thường gặp trên production: **nhiều client đồng thời ghi vào cùng một key**. Dữ liệu lẽ ra đến trước có thể lại đến sau, khiến version dữ liệu sai; hoặc nhiều client đồng thời lấy cùng một key, sửa giá trị rồi ghi lại. Chỉ cần sai thứ tự là dữ liệu sai.

Hơn nữa, bản thân Redis đã có phương án optimistic lock kiểu CAS tự nhiên để giải quyết vấn đề này.

## Phân tích câu hỏi phỏng vấn

Tại một thời điểm, nhiều system instance cùng cập nhật một key. Có thể dùng zookeeper để triển khai distributed lock. Mỗi hệ thống lấy distributed lock thông qua zookeeper, đảm bảo tại cùng một thời điểm chỉ có một system instance thao tác trên một key; các instance khác không được đọc hoặc ghi.

![zookeeper-distributed-lock](../../high-concurrency/images/zookeeper-distributed-lock.png)

Dữ liệu bạn ghi vào cache đều được truy vấn từ mysql và cũng phải được ghi vào mysql. Khi ghi vào mysql, bắt buộc phải lưu một timestamp; khi truy vấn từ mysql cũng lấy timestamp đó ra.

Trước mỗi lần **ghi, trước tiên hãy kiểm tra** timestamp của value hiện tại có mới hơn timestamp của value trong cache hay không. Nếu có thì được phép ghi; nếu không thì không được dùng dữ liệu cũ ghi đè dữ liệu mới.
