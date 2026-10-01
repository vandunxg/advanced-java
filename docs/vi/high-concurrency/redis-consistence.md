# Vấn đề nhất quán giữa cache và database

## Câu hỏi phỏng vấn

Làm thế nào để đảm bảo tính nhất quán khi ghi đồng thời vào cache và database?

## Phân tích suy nghĩ của người phỏng vấn

Chỉ cần dùng cache, bạn có thể phải lưu trữ và ghi dữ liệu đồng thời vào cache lẫn database. Đã ghi vào cả hai nơi thì chắc chắn sẽ phát sinh vấn đề nhất quán dữ liệu. Vậy bạn giải quyết vấn đề nhất quán như thế nào?

## Phân tích câu hỏi phỏng vấn

Nói chung, nếu chấp nhận cache đôi lúc không nhất quán với database trong một khoảng thời gian ngắn, tức hệ thống của bạn **không yêu cầu nghiêm ngặt** “cache + database” phải luôn nhất quán, thì tốt nhất đừng dùng phương án này: **tuần tự hóa request đọc và ghi**, đưa chúng vào một **hàng đợi trong bộ nhớ**.

Tuần tự hóa có thể đảm bảo không xảy ra trạng thái không nhất quán, nhưng cũng làm thông lượng hệ thống giảm mạnh; cần dùng số máy gấp vài lần bình thường để xử lý một request trên môi trường production.

### Cache Aside Pattern

Mô hình đọc ghi cache + database kinh điển nhất là Cache Aside Pattern.

-   Khi đọc, trước tiên đọc cache; nếu cache không có thì đọc database, sau đó đưa dữ liệu vào cache và trả về response.
-   Khi cập nhật, **cập nhật database trước, sau đó xóa cache**.

**Tại sao xóa cache thay vì cập nhật cache?**

Lý do rất đơn giản: trong nhiều trường hợp, đặc biệt ở những tình huống cache phức tạp, giá trị trong cache không chỉ là giá trị lấy trực tiếp từ database.

Ví dụ, có thể bạn cập nhật một trường trong một bảng, nhưng cache tương ứng cần truy vấn dữ liệu ở hai bảng khác rồi tính toán mới có được giá trị mới nhất.

Ngoài ra, đôi khi chi phí cập nhật cache rất cao. Có phải mỗi lần sửa database đều nhất thiết phải cập nhật cache tương ứng không? Có thể có tình huống như vậy, nhưng với **tình huống tính toán dữ liệu cache phức tạp** thì không hẳn. Nếu bạn thường xuyên sửa nhiều bảng liên quan đến một cache thì cache cũng sẽ được cập nhật thường xuyên. Nhưng vấn đề là **cache đó có thường xuyên được truy cập không?**

Lấy ví dụ, các trường trong những bảng liên quan đến một cache bị sửa 20 lần, thậm chí 100 lần trong một phút; khi đó cache cũng bị cập nhật 20 hoặc 100 lần. Nhưng cache này chỉ được đọc một lần trong một phút, nghĩa là có **rất nhiều dữ liệu lạnh**. Thực tế, nếu chỉ xóa cache thì trong một phút cache chỉ cần được tính lại một lần, giúp giảm đáng kể chi phí. **Chỉ tính cache khi có sử dụng.**

Thực ra, xóa cache thay vì cập nhật cache là tư tưởng tính toán lazy: không phải lần nào cũng thực hiện lại phép tính phức tạp, bất kể có dùng đến hay không; để đến khi cần dùng mới tính lại. MyBatis và Hibernate đều có tư tưởng lazy loading. Khi truy vấn một phòng ban, phòng ban có danh sách nhân viên, không cần mỗi lần truy vấn phòng ban đều lấy cả dữ liệu của 1000 nhân viên. Trong 80% trường hợp, khi truy vấn phòng ban, chỉ cần thông tin của phòng ban. Trước tiên truy vấn phòng ban; nếu cần truy cập danh sách nhân viên thì lúc đó mới truy vấn 1000 nhân viên từ database.

### Vấn đề cache không nhất quán cơ bản nhất và cách giải quyết

Vấn đề: cập nhật database trước, sau đó xóa cache. Nếu xóa cache thất bại thì database chứa dữ liệu mới, còn cache chứa dữ liệu cũ, khiến dữ liệu không nhất quán.

![redis-junior-inconsistent](./images/redis-junior-inconsistent.png)

Hướng giải quyết 1: xóa cache trước, sau đó cập nhật database. Nếu cập nhật database thất bại thì database chứa dữ liệu cũ, cache trống nên dữ liệu không bị không nhất quán. Vì cache không có dữ liệu khi đọc nên sẽ đọc dữ liệu cũ từ database rồi cập nhật vào cache.

Hướng giải quyết 2: xóa kép có độ trễ. Vẫn cập nhật database trước rồi xóa cache; điểm khác duy nhất là thực hiện lại thao tác xóa sau đó một khoảng thời gian, chẳng hạn sau 5 giây.

```java
public void set(key, value) {
    putToDb(key, value);
    deleteFromRedis(key);

    // ... a few seconds later
    deleteFromRedis(key);
}
```

Có thể chọn nhiều cách để thực hiện thao tác xóa, chẳng hạn: 1. Dùng `DelayQueue`, có nguy cơ mất bản cập nhật khi tiến trình JVM kết thúc; 2. Đưa vào `MQ`, nhưng độ phức tạp khi viết code sẽ tăng. Tóm lại, cần cân nhắc các yếu tố khác nhau để thiết kế và chọn giải pháp hợp lý nhất.

### Phân tích vấn đề không nhất quán dữ liệu phức tạp hơn

Dữ liệu thay đổi: cache bị xóa trước, rồi chương trình chuẩn bị sửa database nhưng chưa sửa xong. Một request đến, đọc cache thấy trống nên truy vấn database, **đọc được dữ liệu cũ trước khi sửa** rồi đưa dữ liệu đó vào cache. Sau đó chương trình thay đổi dữ liệu hoàn tất việc sửa database. Thế là dữ liệu trong database và cache không giống nhau...

**Tại sao vấn đề này lại xuất hiện trong tình huống high concurrency với hàng trăm triệu lượt truy cập?**

Vấn đề này chỉ có thể xảy ra khi cùng một dữ liệu được đọc và ghi đồng thời. Thực ra, nếu tải đồng thời thấp, đặc biệt số lượt đọc đồng thời thấp — lượng truy cập chỉ 10.000 lần mỗi ngày — thì tình huống không nhất quán vừa mô tả sẽ rất hiếm xảy ra. Nhưng nếu có hàng trăm triệu lượt truy cập mỗi ngày và hàng chục nghìn lượt đọc đồng thời mỗi giây, thì chỉ cần có request cập nhật dữ liệu là **có thể xảy ra tình trạng database và cache không nhất quán như trên**.

**Giải pháp như sau:**

Khi cập nhật dữ liệu, định tuyến thao tác theo **định danh duy nhất của dữ liệu**, rồi gửi vào hàng đợi bên trong JVM. Khi đọc dữ liệu, nếu thấy dữ liệu không có trong cache thì thực hiện lại thao tác “đọc dữ liệu + cập nhật cache”; định tuyến theo định danh duy nhất rồi cũng gửi thao tác vào cùng hàng đợi bên trong JVM.

Mỗi hàng đợi tương ứng với một worker thread. Mỗi worker thread lấy các thao tác tương ứng theo thứ tự **tuần tự**, rồi thực hiện từng thao tác. Khi thao tác thay đổi dữ liệu xóa cache rồi cập nhật database nhưng chưa hoàn tất, nếu lúc đó có request đọc mà không tìm thấy cache thì có thể gửi yêu cầu cập nhật cache vào hàng đợi. Yêu cầu sẽ chờ trong hàng đợi và request đọc đồng bộ đợi đến khi cache được cập nhật xong.

Ở đây có một **điểm tối ưu**: thực ra **đưa nhiều yêu cầu cập nhật cache vào cùng một hàng đợi nối tiếp nhau là vô ích**. Vì vậy có thể lọc: nếu hàng đợi đã có một yêu cầu cập nhật cache thì không cần thêm yêu cầu cập nhật khác, chỉ cần chờ yêu cầu đang có hoàn thành.

Worker thread tương ứng với hàng đợi sẽ hoàn tất thao tác sửa database trước, rồi mới thực hiện thao tác tiếp theo là cập nhật cache. Lúc này nó đọc giá trị mới nhất từ database rồi ghi vào cache.

Nếu request còn trong thời gian chờ cho phép, nó liên tục kiểm tra và trả về ngay khi lấy được dữ liệu. Nếu request chờ quá thời gian quy định thì lần này đọc trực tiếp giá trị hiện tại từ database.

Trong tình huống high concurrency, cần lưu ý các vấn đề sau với giải pháp này:

-   Request đọc bị chặn trong thời gian dài

Do request đọc được bất đồng bộ hóa ở mức độ nhẹ, nhất định phải chú ý đến timeout khi đọc; mọi request đọc phải trả về trong giới hạn thời gian timeout.

Rủi ro lớn nhất của giải pháp là **việc cập nhật dữ liệu có thể diễn ra thường xuyên**, khiến nhiều thao tác cập nhật bị dồn trong hàng đợi, rồi **nhiều request đọc bị timeout**, cuối cùng làm nhiều request chuyển thẳng sang database. Nhất thiết phải mô phỏng kiểm thử gần giống thực tế để xem tần suất cập nhật dữ liệu ra sao.

Một điểm nữa là một hàng đợi có thể chứa các thao tác cập nhật nhiều mục dữ liệu. Vì vậy cần kiểm thử theo tình hình nghiệp vụ; có thể phải **triển khai nhiều service**, mỗi service xử lý một phần thao tác cập nhật dữ liệu. Nếu hàng đợi trong bộ nhớ tích tụ 100 thao tác sửa tồn kho cho các sản phẩm khác nhau, mỗi thao tác sửa tồn kho mất 10ms thì request đọc của sản phẩm cuối cùng có thể phải đợi 10 \* 100 = 1000ms = 1s mới lấy được dữ liệu; khi đó sẽ dẫn đến **request đọc bị chặn lâu**.

Nhất định phải kiểm thử tải dựa trên tình hình vận hành thực tế của hệ thống nghiệp vụ và mô phỏng môi trường production để xem vào thời điểm bận nhất hàng đợi trong bộ nhớ có thể tích tụ bao nhiêu thao tác cập nhật, khiến request đọc tương ứng với thao tác cập nhật cuối cùng phải chờ bao lâu. Nếu request đọc cần trả về trong 200ms, sau khi tính toán, ngay cả lúc bận nhất chỉ có 10 thao tác cập nhật bị dồn lại và phải chờ tối đa 200ms thì vẫn có thể chấp nhận.

**Nếu số thao tác cập nhật có thể tích tụ trong một hàng đợi bộ nhớ quá nhiều**, thì cần **bổ sung máy**, để mỗi máy chạy ít service instance hơn và mỗi hàng đợi trong bộ nhớ tích tụ ít thao tác cập nhật hơn.

Theo kinh nghiệm từ các dự án trước, tần suất ghi dữ liệu thường thấp. Vì vậy trên thực tế, số thao tác cập nhật bị dồn trong hàng đợi thường không nhiều. Với các dự án kiến trúc cache phục vụ high concurrency khi đọc, request ghi thường rất ít; QPS vài trăm mỗi giây đã là khá tốt.

Hãy **ước tính sơ bộ thực tế**.

Nếu có 500 thao tác ghi trong một giây, chia thành 5 khoảng thời gian, mỗi 200ms có 100 thao tác ghi; đưa chúng vào 20 hàng đợi bộ nhớ thì mỗi hàng đợi có thể chỉ tồn 5 thao tác ghi. Sau khi kiểm thử hiệu năng, mỗi thao tác ghi thường hoàn tất trong khoảng 20ms. Khi đó request đọc dữ liệu của mỗi hàng đợi chỉ phải chờ một lúc và chắc chắn có thể trả về trong vòng 200ms.

Qua phép tính sơ bộ trên, ta biết một máy hỗ trợ write QPS vài trăm là không vấn đề. Nếu write QPS tăng gấp 10 lần thì tăng số máy lên 10 lần, mỗi máy vẫn dùng 20 hàng đợi.

-   Lượng request đọc đồng thời quá cao

Ở đây cũng phải kiểm thử tải để đảm bảo nếu tình huống trên xảy ra đúng lúc thì còn xử lý được rủi ro: đột nhiên nhiều request đọc bị treo vài chục millisecond trên service. Cần xác định service có chịu nổi không và cần bao nhiêu máy để chịu được mức đỉnh cao nhất.

Tuy nhiên, không phải tất cả dữ liệu đều được cập nhật cùng lúc và cache cũng không hết hạn cùng lúc. Vì vậy mỗi lần có thể chỉ một số ít cache dữ liệu hết hạn; lượng request đọc tương ứng đến cùng lúc có lẽ cũng không quá lớn.

-   Định tuyến request khi triển khai nhiều service instance

Có thể service được triển khai thành nhiều instance; khi đó phải **đảm bảo** các request thực hiện thao tác cập nhật dữ liệu và cập nhật cache đều được máy chủ Nginx **định tuyến đến cùng một service instance**.

Ví dụ, tất cả request đọc ghi của cùng một sản phẩm đều được định tuyến đến cùng một máy. Có thể tự triển khai định tuyến service giữa các máy dựa trên hash của một tham số request nào đó, hoặc dùng chức năng định tuyến hash của Nginx, v.v.

-   Vấn đề định tuyến sản phẩm hot dẫn đến request bị lệch

Nếu request đọc ghi của một sản phẩm nào đó đặc biệt cao và đều bị gửi đến cùng một hàng đợi trên cùng một máy, máy đó có thể chịu tải quá lớn. Vì chỉ khi dữ liệu sản phẩm được cập nhật thì cache mới bị xóa, sau đó mới phát sinh đọc ghi đồng thời; do đó cần dựa vào hệ thống nghiệp vụ để đánh giá. Nếu tần suất cập nhật không quá cao thì ảnh hưởng của vấn đề này không lớn, nhưng quả thật tải của một số máy có thể cao hơn.

---

Thảo luận chi tiết về câu hỏi phỏng vấn này xem tại [#54](https://github.com/doocs/advanced-java/issues/54).
