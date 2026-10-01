# Cách sử dụng cache

## Câu hỏi phỏng vấn

Cache được sử dụng như thế nào trong dự án? Tại sao cần dùng cache? Dùng cache không đúng cách có thể dẫn đến hậu quả gì?

## Phân tích suy nghĩ của người phỏng vấn

Đây là câu hỏi mà các công ty Internet luôn hỏi. Nếu một người còn chưa hiểu rõ về cache thì đúng là khá ngượng.

Khi hỏi về cache, câu hỏi đầu tiên chắc chắn là cache được dùng ở đâu trong dự án của bạn, tại sao cần dùng, không dùng có được không, và sau khi dùng có thể gây ra hậu quả không mong muốn nào?

Người phỏng vấn muốn xem bạn có suy nghĩ về bản chất của cache hay không. Nếu bạn chỉ dùng bừa mà không thể đưa ra lời giải thích hợp lý, người phỏng vấn chắc chắn sẽ có ấn tượng không tốt và nghĩ rằng bình thường bạn ít suy nghĩ, chỉ biết làm việc được giao.

## Phân tích câu hỏi phỏng vấn

### Cache được sử dụng như thế nào trong dự án?

Câu này cần trả lời dựa trên nghiệp vụ của chính dự án bạn.

### Tại sao cần dùng cache?

Cache chủ yếu có hai mục đích: **hiệu năng cao**, **high concurrency**.

#### Hiệu năng cao

Giả sử có một tình huống như sau: một request đến, bạn thực hiện đủ loại thao tác phức tạp trên MySQL và mất 600ms mới truy vấn được kết quả. Nhưng kết quả này có thể sẽ không thay đổi trong vài giờ tiếp theo, hoặc nếu thay đổi thì cũng không cần thông báo ngay cho người dùng. Vậy phải làm sao?

Dùng cache. Đưa kết quả tốn 600ms mới truy vấn được vào cache, mỗi key tương ứng một value. Lần sau có người truy vấn thì không cần mất 600ms thao tác trên MySQL nữa; chỉ cần dùng key lấy value trực tiếp từ cache, mất 2ms là xong. Hiệu năng tăng 300 lần.

Nghĩa là với những kết quả cần thao tác phức tạp và mất thời gian mới truy vấn được, có thể xác định rằng sau đó chúng ít thay đổi nhưng có nhiều request đọc, hãy đưa kết quả truy vấn vào cache rồi đọc trực tiếp từ cache trong những lần sau.

#### High concurrency

MySQL là database nặng, vốn không được thiết kế để xử lý high concurrency; dù vẫn có thể làm được nhưng khả năng hỗ trợ sẵn không tốt. MySQL đơn máy bắt đầu dễ báo động khi đạt khoảng `2000QPS`.

Vì vậy nếu hệ thống của bạn nhận 10.000 request mỗi giây vào giờ cao điểm thì một MySQL đơn máy chắc chắn sẽ sập. Lúc này bạn chỉ có thể dùng cache, đưa nhiều dữ liệu vào cache thay vì MySQL. Chức năng cache đơn giản, nói trắng ra là thao tác dạng `key-value`; một máy dễ dàng xử lý hàng chục nghìn, thậm chí hơn một trăm nghìn request đồng thời mỗi giây, hỗ trợ high concurrency rất dễ. Lượng request đồng thời một máy xử lý được gấp hàng chục lần MySQL đơn máy.

> Cache sử dụng bộ nhớ; bản thân bộ nhớ hỗ trợ high concurrency.

### Sau khi dùng cache có thể dẫn đến hậu quả không mong muốn nào?

Một số vấn đề về cache thường gặp:

-   [Cache và database ghi kép không nhất quán](./redis-consistence.md)
-   [Cache avalanche, cache penetration và cache breakdown](./redis-caching-avalanche-and-caching-penetration.md)
-   [Cạnh tranh đồng thời trên cache](./redis-cas.md)

Nhấp vào liên kết để xem trực tiếp các vấn đề liên quan đến cache và giải pháp.
