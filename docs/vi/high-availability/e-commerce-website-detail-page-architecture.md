# Kiến trúc hệ thống trang chi tiết sản phẩm của website thương mại điện tử

## Kiến trúc hệ thống trang chi tiết sản phẩm của website thương mại điện tử nhỏ

Website thương mại điện tử nhỏ dùng phương pháp tĩnh hóa toàn bộ trang để hiển thị nội dung. Cơ sở dữ liệu lưu tất cả thông tin sản phẩm; hệ thống tĩnh hóa trang đưa dữ liệu vào template tĩnh, tạo thành trang đã tĩnh hóa rồi đẩy lên máy chủ Nginx. Khi người dùng duyệt trang web, hệ thống lấy một trang html đã được tĩnh hóa sẵn và trả về trực tiếp, không cần xử lý logic nghiệp vụ nào.

![e-commerce-website-detail-page-architecture-1](../../high-availability/images/e-commerce-website-detail-page-architecture-1.png)

Sau đây là một Demo đơn giản về template trang.

```html
<html>
    <body>
        商品名称：#{productName}<br />
        商品价格：#{productPrice}<br />
        商品描述：#{productDesc}
    </body>
</html>
```

**Ưu điểm** của cách làm này là mỗi lần người dùng truy cập một trang, hệ thống không cần tương tác với cơ sở dữ liệu, cũng không cần thực thi bất kỳ đoạn code nào; chỉ cần trả về một trang html là đủ, nên tốc độ và hiệu năng rất cao.

Với website nhỏ, số lượng trang ít nên cách này rất thiết thực và đơn giản. Trong Java có thể dùng velocity, freemarker, thymeleaf, v.v.; sau đó xây dựng một hệ thống quản lý nội dung trang cms. Khi template thay đổi, có thể nhấn nút hoặc để hệ thống tự động kết xuất lại toàn bộ.

**Nhược điểm** là cách này chỉ phù hợp với một số website nhỏ, chẳng hạn quy mô từ vài chục đến vài chục nghìn trang. Với website thương mại điện tử lớn có hàng trăm triệu trang, nếu mỗi lần template trang thay đổi mà đều phải tĩnh hóa lại toàn bộ số trang đó thì có khả thi không? Nếu mỗi lần kết xuất mất vài ngày, toàn bộ website sẽ ngừng hoạt động.

## Kiến trúc trang chi tiết sản phẩm của website thương mại điện tử lớn

Trong thiết kế hệ thống trang chi tiết sản phẩm của website thương mại điện tử lớn, khi dữ liệu sản phẩm thay đổi, hệ thống sẽ đưa thông điệp thay đổi vào message queue (MQ). Khi **dịch vụ cache** tiêu thụ thông điệp này từ message queue, nó nhận biết dữ liệu đã thay đổi, gọi API của dịch vụ dữ liệu để lấy dữ liệu sau khi cập nhật, sau đó đẩy dữ liệu đã tổng hợp vào redis. Dữ liệu cache cục bộ của Nginx có thời hạn nhất định, chẳng hạn 10 phút. Khi dữ liệu hết hạn, Nginx sẽ lấy dữ liệu cache mới nhất từ redis và lưu vào cache cục bộ của mình.

Khi người dùng duyệt trang web, dữ liệu cục bộ của Nginx được kết xuất động vào template html cục bộ rồi trả về cho người dùng.

![e-commerce-website-detail-page-architecture-2](../../high-availability/images/e-commerce-website-detail-page-architecture-2.png)

Cách này không nhanh bằng việc trả về trực tiếp trang html, nhưng vì dữ liệu nằm trong cache cục bộ nên vẫn rất nhanh. Chi phí hiệu năng chủ yếu là kết xuất động một trang html. Nếu template html thay đổi, không cần tĩnh hóa lại tất cả các trang, cũng không cần gửi request nên không phát sinh chi phí request mạng; chỉ cần kết xuất dữ liệu vào template html mới nhất rồi phản hồi.

Với kiến trúc này, chúng ta cần **đảm bảo high availability của hệ thống**.

Nếu lưu lượng truy cập hệ thống cao, cache cục bộ của Nginx hết hạn và cache trong redis cũng bị thuật toán LRU dọn sạch, lượng request tới dịch vụ sản phẩm từ dịch vụ cache sẽ tăng cao. Nhưng nếu lúc đó API của dịch vụ sản phẩm gặp sự cố và các lần gọi bị chậm, toàn bộ thread của dịch vụ cache đều bị các lần gọi API dịch vụ sản phẩm chiếm hết. Mỗi thread sẽ bị treo lâu khi gọi API này; các request tiếp theo cũng bị kẹt tại đó. Khi ấy, dịch vụ cache không còn đủ thread để gọi API của một số dịch vụ khác, khiến nhiều trang chi tiết sản phẩm không thể hiển thị bình thường.

Đây chính là hiện tượng tài nguyên của dịch vụ cache bị cạn kiệt do API dịch vụ sản phẩm gặp sự cố.
