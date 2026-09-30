# Định lý CAP trong hệ thống phân tán

## Ý nghĩa của P trong định lý CAP của hệ thống phân tán

Trước đây, khi đọc định lý CAP, tác giả từng rất băn khoăn. Định nghĩa định lý CAP nói rằng trong hệ thống phân tán chỉ có thể thỏa mãn hai trong ba thuộc tính, tức là có tồn tại hệ thống CA phân tán. Tác giả đã đọc nhiều bài viết về CAP trên mạng; tuy các bài giải thích P rất khác nhau, tổng kết lại thì phần lớn đều cho rằng P là không thể thiếu, nghĩa là hệ thống phân tán chỉ có thể là AP hoặc CP. Lý thuyết này mâu thuẫn với cách hiểu trước đây của tôi (có hệ thống CA phân tán), nên tôi mới thấy băn khoăn.

> Định lý này bắt nguồn từ một phỏng đoán do nhà khoa học máy tính Eric Brewer thuộc Đại học California, Berkeley đưa ra tại Hội thảo Nguyên lý Tính toán Phân tán (PODC) năm 2000. Năm 2002, Seth Gilbert và Nancy Lynch tại Viện Công nghệ Massachusetts (MIT) công bố chứng minh cho phỏng đoán của Brewer, đưa nó trở thành một định lý.

### Định lý CAP (CAP theorem) là gì?

Trong khoa học máy tính lý thuyết, định lý CAP (CAP theorem), còn được gọi là định lý Brewer (Brewer's theorem), chỉ ra rằng một hệ thống tính toán phân tán không thể đồng thời thỏa mãn cả ba thuộc tính sau:

-   Tính nhất quán (Consistency) (tương đương mọi nút đều truy cập cùng một bản sao dữ liệu mới nhất)
-   Tính sẵn sàng (Availability) (mọi yêu cầu đều nhận được phản hồi không lỗi, nhưng dữ liệu nhận được không được bảo đảm là mới nhất)
-   Khả năng chịu phân vùng (Partition tolerance) (xét trên thực tế, phân vùng tương đương với yêu cầu giới hạn thời gian truyền thông. Nếu hệ thống không thể đạt được tính nhất quán dữ liệu trong thời hạn đó thì có nghĩa là đã xảy ra phân vùng; hệ thống phải chọn C hoặc A cho thao tác hiện tại.)

### Khả năng chịu phân vùng (Partition tolerance)

Cách đơn giản nhất để hiểu lý thuyết CAP là hình dung hai nút nằm ở hai phía của một phân vùng. Cho phép ít nhất một nút cập nhật trạng thái sẽ khiến dữ liệu không nhất quán, tức mất thuộc tính C. Nếu để bảo đảm tính nhất quán dữ liệu mà đặt nút ở một phía của phân vùng thành không khả dụng thì lại mất thuộc tính A. Chỉ khi hai nút có thể giao tiếp với nhau thì mới có thể vừa bảo đảm C vừa bảo đảm A; điều này đồng nghĩa mất thuộc tính P.

-   P là khả năng chịu phân vùng; khi xảy ra phân vùng cần có khả năng chịu lỗi, tức là chọn giữa A và C. Nếu hệ thống phân tán không xảy ra phân vùng (không xuất hiện tình trạng không nhất quán hoặc không khả dụng) thì bản thân nó không bị phân vùng; nếu không có phân vùng thì cũng không cần khả năng chịu phân vùng P.
-   Dù hệ thống tôi thiết kế là AP hay CP, nếu không xảy ra tình trạng không nhất quán và không khả dụng thì hệ thống đang ở trạng thái CA.
-   P chỉ thể hiện khi có tình huống phân vùng.

> Nguồn bài viết: [Định lý CAP trên Wikipedia](https://zh.wikipedia.org/wiki/CAP%E5%AE%9A%E7%90%86)

## So sánh một số khung CAP phổ biến

| Khung      | Thuộc tính |
| --------- | ---- |
| Eureka    | AP   |
| Zookeeper | CP   |
| Consul    | CP   |

### Eureka

> Eureka bảo đảm tính sẵn sàng và đạt được tính nhất quán cuối cùng.

Tất cả các nút Eureka ngang hàng và có cùng dữ liệu; các Eureka cũng có thể đăng ký chéo lẫn nhau.  
Eureka client dùng bộ cân bằng tải vòng tròn tích hợp sẵn để đăng ký, với một khoảng thời gian kiểm tra: chỉ khi không nhận được heartbeat trong một khoảng thời gian nhất định thì thông tin đăng ký của nút mới bị xóa. Nếu client phát hiện Eureka hiện tại không khả dụng thì sẽ chuyển sang nút khác; nếu tất cả Eureka đều dừng thì Eureka client dùng dữ liệu gần nhất làm cache cục bộ. Vì vậy, mỗi thiết kế trên đều cho thấy nó không có đặc tính `nhất quán`.

Lưu ý: Do đặc tính AP của Eureka và cơ chế đồng bộ theo khoảng thời gian giữa các yêu cầu, khi cập nhật dịch vụ thường cần dùng API của Eureka để đặt trạng thái dịch vụ hiện tại thành `offline`, rồi chờ qua 2 chu kỳ đồng bộ mới khởi động lại. Như vậy có thể bảo đảm nút đang cập nhật không ảnh hưởng đến toàn hệ thống.

### Zookeeper

> Tính nhất quán mạnh

Khi bầu leader, Zookeeper sẽ dừng cung cấp dịch vụ; chỉ có thể hoạt động trở lại sau khi bầu leader thành công, và thời gian bầu khá dài. Bên trong dùng cơ chế bỏ phiếu bầu chọn paxos, chỉ khi nhận được hơn một nửa số phiếu mới trở thành leader, nếu không thì bỏ phiếu lại. Vì vậy khi triển khai, tốt nhất nên có ít nhất 3 nút cụm và số lượng là số lẻ (nhưng ai có thể bảo đảm rằng sau khi hỏng thì số nút còn lại vẫn là số lẻ?). Kiểm tra sức khỏe Zookeeper thường dùng kết nối TCP dài hạn; khi mạng nội bộ chập chờn hoặc nút tương ứng bị chặn, hệ thống cũng trở nên không khả dụng, đây vẫn là một rủi ro đáng kể.

### Consul

Giống Zookeeper, dữ liệu của Consul theo CP.

Khi đăng ký với Consul, chỉ coi đăng ký là thành công nếu hơn một nửa số nút ghi thành công; khi leader dừng, toàn bộ Consul không khả dụng trong thời gian bầu chọn lại, nhờ đó bảo đảm tính nhất quán mạnh nhưng phải hy sinh tính sẵn sàng.  
Nhiều bài blog nói Consul thuộc AP; tài liệu chính thức đã xác nhận cơ chế của nó là CP. Nguồn chính thức: https://developer.hashicorp.com/consul/docs/concept/consensus
