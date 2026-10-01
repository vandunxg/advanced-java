# Cách sử dụng cache

## Câu hỏi phỏng vấn

Cache được sử dụng như thế nào trong dự án? Tại sao cần dùng cache? Dùng cache không đúng cách có thể dẫn đến hậu quả gì?

## Phân tích tâm lý người phỏng vấn

Đây là câu hỏi mà các công ty Internet chắc chắn sẽ hỏi. Nếu một người còn chưa hiểu rõ về cache thì đúng là khá ngượng.

Khi hỏi về cache, câu hỏi đầu tiên chắc chắn sẽ là: trong dự án của bạn cache được dùng ở đâu, tại sao phải dùng, không dùng có được không, và sau khi dùng có thể dẫn đến những hậu quả không mong muốn nào?

Đây là cách họ xem bạn có suy nghĩ về bản chất của cache hay không. Nếu bạn chỉ dùng bừa mà không thể đưa ra lời giải thích hợp lý cho người phỏng vấn, chắc chắn họ sẽ có ấn tượng không tốt và nghĩ rằng bình thường bạn ít suy nghĩ, chỉ biết cắm đầu làm việc.

## Phân tích câu hỏi phỏng vấn

### Cache được sử dụng như thế nào trong dự án?

Câu này cần gắn với nghiệp vụ của dự án bạn.

### Tại sao cần dùng cache?

Cache chủ yếu được dùng cho hai mục đích: **hiệu năng cao**, **high concurrency**.

#### Hiệu năng cao

Giả sử bạn có một thao tác như sau: khi một request đến, bạn phải loay hoay thực hiện đủ loại thao tác phức tạp trên MySQL và mất 600ms mới truy vấn được kết quả. Nhưng kết quả này có thể sẽ không thay đổi trong vài giờ tiếp theo, hoặc nếu thay đổi thì cũng không cần thông báo ngay cho người dùng. Vậy phải làm sao?

Dùng cache. Đưa kết quả mà phải mất 600ms mới truy vấn được vào cache, mỗi key tương ứng với một value. Lần sau có người truy vấn thì không cần mất 600ms thao tác trên MySQL nữa; chỉ cần dùng key lấy value trực tiếp từ cache, mất 2ms là xong. Hiệu năng tăng 300 lần.

Nghĩa là, với những kết quả phải qua các thao tác phức tạp và tốn thời gian mới truy vấn được, nếu xác định rằng về sau chúng không thay đổi nhiều nhưng có nhiều request đọc, thì chỉ cần đưa kết quả truy vấn vào cache và đọc trực tiếp từ cache trong những lần sau.

#### High concurrency

MySQL là một database khá nặng, vốn dĩ không được thiết kế để xử lý high concurrency; dù vẫn có thể xử lý high concurrency nhưng bản thân nó không hỗ trợ tốt. MySQL triển khai trên một máy, đạt `2000QPS` là bắt đầu dễ báo động.

Vì vậy, nếu hệ thống của bạn nhận 10.000 request mỗi giây vào giờ cao điểm thì một MySQL chạy trên một máy chắc chắn sẽ sập. Lúc này bạn chỉ có thể dùng cache, đưa nhiều dữ liệu vào cache thay vì MySQL. Chức năng của cache đơn giản, nói trắng ra chỉ là thao tác dạng `key-value`; một máy dễ dàng xử lý hàng chục nghìn, thậm chí hơn một trăm nghìn request mỗi giây, nên hỗ trợ high concurrency rất dễ dàng. Khả năng xử lý request đồng thời của một máy gấp hàng chục lần MySQL chạy trên một máy.

> Cache hoạt động trên bộ nhớ; bản thân bộ nhớ vốn hỗ trợ high concurrency.

### Sau khi dùng cache, có thể dẫn đến những hậu quả không mong muốn nào?

Một số vấn đề về cache thường gặp:

-   [Cache và database không nhất quán khi ghi kép](./redis-consistence.md)
-   [Cache avalanche, cache penetration và cache breakdown](./redis-caching-avalanche-and-caching-penetration.md)
-   [Cạnh tranh khi truy cập cache đồng thời](./redis-cas.md)

Nhấp vào liên kết để xem trực tiếp các vấn đề liên quan đến cache và giải pháp tương ứng.
