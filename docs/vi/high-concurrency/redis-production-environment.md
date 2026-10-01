# Phương án triển khai Redis trong môi trường production

## Câu hỏi phỏng vấn

Redis được triển khai như thế nào trong môi trường production?

## Phân tích tâm lý của người phỏng vấn

Người phỏng vấn muốn xem bạn có hiểu kiến trúc triển khai cụm Redis production của công ty hay không. Nếu không hiểu thì đúng là bạn đã thiếu trách nhiệm: Redis của bạn dùng kiến trúc primary-replica hay kiến trúc cluster? Dùng phương án cluster nào? Có đảm bảo high availability không? Có bật cơ chế persistence để đảm bảo có thể khôi phục dữ liệu không? Redis trên production được cấp bao nhiêu GB bộ nhớ? Đã đặt những tham số nào? Sau khi kiểm thử tải, cụm Redis của bạn chịu được bao nhiêu QPS?

Bạn phải nắm rõ những điều này; nếu không thì đúng là bạn chưa suy nghĩ kỹ.

## Phân tích câu hỏi phỏng vấn

Redis cluster gồm 10 máy: 5 máy triển khai Redis primary instance, 5 máy còn lại triển khai Redis replica instance; mỗi primary instance có một replica. 5 node cung cấp dịch vụ đọc/ghi cho bên ngoài. QPS đọc/ghi cao điểm của mỗi node có thể đạt 50.000 request mỗi giây; 5 máy tối đa xử lý 250.000 request đọc/ghi mỗi giây.

Cấu hình máy ra sao? Bộ nhớ 32G + CPU 8 core + đĩa 1T; nhưng tiến trình Redis được cấp 10g bộ nhớ. Nói chung trong môi trường production, bộ nhớ Redis tốt nhất không nên vượt quá 10g; vượt quá 10g có thể phát sinh vấn đề.

5 máy cung cấp dịch vụ đọc/ghi có tổng cộng 50g bộ nhớ.

Vì mỗi primary instance đều có một replica nên hệ thống có high availability. Nếu bất kỳ primary instance nào bị sập thì quá trình failover tự động diễn ra; Redis replica instance sẽ tự động trở thành primary instance và tiếp tục cung cấp dịch vụ đọc/ghi.

Dữ liệu bạn ghi vào bộ nhớ là gì? Kích thước mỗi mục dữ liệu bao nhiêu? Dữ liệu sản phẩm, mỗi mục dữ liệu 10kb. 100 mục dữ liệu là 1mb; 100.000 mục dữ liệu là 1g. Có 2 triệu mục dữ liệu sản phẩm thường trú trong bộ nhớ, chiếm 20g bộ nhớ, chưa đến 50% tổng bộ nhớ. Hiện tại, vào giờ cao điểm có khoảng 3500 request mỗi giây.

Thực ra ở các công ty lớn thường có team hạ tầng phụ trách vận hành cụm cache.
