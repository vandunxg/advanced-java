# Làm thế nào để bảo đảm thứ tự các yêu cầu trên giao diện dịch vụ phân tán?

## Câu hỏi phỏng vấn

Làm thế nào để bảo đảm thứ tự các yêu cầu trên giao diện dịch vụ phân tán?

## Phân tích góc nhìn của người phỏng vấn

Thứ tự gọi các giao diện trong hệ thống phân tán cũng là một vấn đề. Thông thường không cần bảo đảm thứ tự, nhưng **đôi khi** thực sự cần bảo đảm **thứ tự nghiêm ngặt**. Lấy ví dụ: dịch vụ A gọi dịch vụ B, chèn trước rồi xóa sau. Hai yêu cầu được gửi đi và đến các máy khác nhau; vì một số lý do, yêu cầu chèn có thể xử lý chậm hơn khiến yêu cầu xóa được thực hiện trước. Lúc đó chưa có dữ liệu nên thao tác xóa không có tác dụng; sau đó yêu cầu chèn đến và dữ liệu được chèn vào — thật khó xử.

Lẽ ra phải là “chèn trước -> xóa sau”, dữ liệu đó phải biến mất; nhưng hiện tại lại thành “xóa trước -> chèn sau”, nên dữ liệu vẫn còn. Cuối cùng bạn sẽ chẳng hiểu nổi vì sao lại như vậy.

Vì vậy, đây đều là những vấn đề rất thường gặp trong hệ thống phân tán.

## Phân tích câu hỏi phỏng vấn

Trước tiên, nhìn chung tôi khuyên bạn nên thiết kế hệ thống từ góc độ logic nghiệp vụ sao cho không cần bảo đảm thứ tự như vậy. Bởi vì một khi đưa vào cơ chế bảo đảm thứ tự, chẳng hạn **khóa phân tán**, sẽ **làm tăng độ phức tạp của hệ thống**, đồng thời dẫn đến **hiệu năng thấp**, tạo áp lực quá lớn lên dữ liệu nóng và kéo theo nhiều vấn đề khác.

Dưới đây là phương án chúng tôi từng dùng. Nói đơn giản, trước hết dùng chiến lược cân bằng tải consistent hash của Dubbo để phân phối mọi yêu cầu ứng với một order id đến cùng một máy. Tiếp đó, vì trên máy đó các yêu cầu vẫn có thể được thực thi đồng thời bằng nhiều luồng, cần đưa ngay các yêu cầu ứng với order id đó vào một **hàng đợi trong bộ nhớ** và buộc chúng xếp hàng, qua đó bảo đảm thứ tự.

![distributed-system-request-sequence](../../distributed-system/images/distributed-system-request-sequence.png)

Tuy nhiên, cách này kéo theo nhiều vấn đề khác. Chẳng hạn, nếu số yêu cầu của một đơn hàng quá lớn đến mức khiến một máy trở thành **điểm nóng** thì phải làm sao? Giải quyết các vấn đề này lại đòi hỏi thêm hàng loạt giải pháp kỹ thuật phức tạp... Trước đây những vấn đề loại này từng khiến chúng tôi rất đau đầu, vậy tôi vẫn khuyên điều gì?

Tốt nhất là xem liệu có thể gộp thao tác chèn và xóa của cùng một đơn hàng như ví dụ trên thành một thao tác duy nhất, chẳng hạn chỉ thực hiện thao tác xóa hoặc một thao tác nào khác, để tránh phát sinh vấn đề này.
