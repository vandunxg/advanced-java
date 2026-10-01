# Tổng quan về việc chuyển đổi sang microservice

Việc chuyển ứng dụng đơn khối sang kiến trúc microservice là một quá trình hiện đại hóa gồm nhiều bước, khá giống những gì nhiều thế hệ nhà phát triển đã thực hiện; trên thực tế, khi chuyển đổi, chúng ta có thể tái sử dụng một số ý tưởng.

Một chiến lược là không viết lại mã theo kiểu “big bang” (chỉ nên dùng cách viết lại khi bạn đang xây dựng lại một ứng dụng hoàn toàn mới dựa trên microservice). Viết lại mã nghe có vẻ hay, nhưng trên thực tế đầy rủi ro và cuối cùng có thể thất bại, như Martin Fowler từng nói:

> “Một bản viết lại kiểu Big Bang chỉ bảo đảm một điều: một vụ Big Bang!”

Thay vào đó, nên áp dụng chiến lược chuyển đổi ứng dụng đơn khối từng bước: dần dần xây dựng ứng dụng mới bằng microservice và tích hợp với ứng dụng đơn khối cũ. Theo thời gian, tỷ trọng của ứng dụng đơn khối trong toàn bộ kiến trúc sẽ giảm dần cho đến khi biến mất hoặc trở thành một phần của kiến trúc microservice. Chiến lược này hơi giống việc giới hạn tốc độ ở mức 70 dặm/giờ trên đường cao tốc trong khi bảo dưỡng xe: tuy có thách thức nhưng rủi ro thấp hơn nhiều so với viết lại toàn bộ.

Martin Fowler gọi chiến lược hiện đại hóa này là ứng dụng Strangler (bóp nghẹt); tên gọi bắt nguồn từ dây leo bóp nghẹt trong rừng mưa nhiệt đới, còn được gọi là strangler fig (cây đa bóp nghẹt). Để vươn lên đỉnh rừng, dây leo bóp nghẹt quấn quanh cây lớn; sau một thời gian, cây chết và chỉ còn lại dây leo có hình dáng của cây. Mô hình ứng dụng này cũng tương tự: phát triển ứng dụng microservice mới xung quanh ứng dụng truyền thống để ứng dụng truyền thống dần rời khỏi hệ thống.

Hãy cùng xem các chiến lược khả thi khác.

## Chiến lược 1 — Dừng đào

Định luật Cái hố (Law of Holes) nói rằng khi đã tự đào mình xuống hố thì nên dừng đào. Đây là lời khuyên tốt nhất khi ứng dụng đơn khối không còn quản lý được. Nói cách khác, cần ngăn ứng dụng đơn khối tiếp tục phình to; khi phát triển chức năng mới, không nên thêm mã mới vào ứng dụng đơn khối cũ. Cách tốt nhất là xây dựng chức năng mới thành microservice độc lập. Như hình dưới đây:

![1](../../micro-services/images/Law-of-Holes.png)

Ngoài dịch vụ mới và ứng dụng truyền thống, còn có hai thành phần. Thứ nhất là bộ định tuyến yêu cầu, chịu trách nhiệm xử lý yêu cầu đầu vào (HTTP), hơi giống API Gateway đã nói ở trên. Bộ định tuyến gửi yêu cầu chức năng mới đến dịch vụ mới được phát triển, còn yêu cầu truyền thống vẫn chuyển đến ứng dụng đơn khối.

Thành phần còn lại là mã kết dính (glue code), tích hợp microservice với ứng dụng đơn khối. Microservice hiếm khi hoạt động độc lập và thường cần truy cập dữ liệu của ứng dụng đơn khối. Mã kết dính có thể nằm trong ứng dụng đơn khối, microservice hoặc cả hai; nó chịu trách nhiệm tích hợp dữ liệu. Microservice đọc và ghi dữ liệu của ứng dụng đơn khối thông qua mã kết dính.

Có ba cách để microservice truy cập dữ liệu của ứng dụng đơn khối:

-   Dùng API từ xa do ứng dụng đơn khối cung cấp
-   Truy cập trực tiếp cơ sở dữ liệu của ứng dụng đơn khối
-   Tự duy trì một bản sao dữ liệu được đồng bộ từ ứng dụng đơn khối

Mã kết dính còn được gọi là lớp anti-corruption (anti-corruption layer), vì nó bảo vệ mô hình miền mới của microservice khỏi bị mô hình miền của ứng dụng đơn khối cũ làm ô nhiễm. Mã kết dính cung cấp chức năng chuyển đổi giữa hai mô hình này. Thuật ngữ anti-corruption layer lần đầu xuất hiện trong cuốn sách nên đọc _Domain Driven Design_ của Eric Evans, sau đó được chắt lọc thành một sách trắng. Xây dựng lớp anti-corruption có thể không được xem là việc quan trọng, nhưng đây là phần cần thiết để tránh rơi vào vũng lầy đơn khối.

Triển khai chức năng mới dưới dạng microservice nhẹ có nhiều ưu điểm, chẳng hạn có thể ngăn ứng dụng đơn khối trở nên khó quản lý hơn. Bản thân microservice có thể được phát triển, triển khai và mở rộng độc lập. Áp dụng kiến trúc microservice cũng đem lại trải nghiệm khác cho nhà phát triển.

Tuy nhiên, cách này không giải quyết vấn đề nội tại nào của ứng dụng đơn khối; muốn giải quyết chúng cần thay đổi sâu bên trong ứng dụng đơn khối. Hãy xem chiến lược thực hiện việc đó.

## Chiến lược 2 — Tách frontend và backend

Một chiến lược để giảm độ phức tạp của ứng dụng đơn khối là tách tầng trình bày khỏi logic nghiệp vụ và tầng truy cập dữ liệu. Một ứng dụng doanh nghiệp điển hình có ít nhất ba thành phần khác nhau:

1. Tầng trình bày — xử lý yêu cầu HTTP, phản hồi yêu cầu REST API hoặc cung cấp giao diện đồ họa dựa trên HTML. Với ứng dụng có giao diện người dùng phức tạp, tầng trình bày thường là một phần quan trọng của mã.

2. Tầng nghiệp vụ — phần lõi ứng dụng thực hiện logic nghiệp vụ.

3. Tầng truy cập dữ liệu — truy cập các thành phần hạ tầng như cơ sở dữ liệu và message broker.

Giữa tầng trình bày và tầng nghiệp vụ/truy cập dữ liệu có sự tách biệt rõ ràng. Tầng nghiệp vụ cung cấp các API hạt lớn (coarse-grained), bao quát một số khía cạnh và chứa các thành phần logic nghiệp vụ. API là ranh giới tự nhiên để tách nghiệp vụ của ứng dụng đơn khối thành hai ứng dụng nhỏ hơn: một ứng dụng tầng trình bày, ứng dụng còn lại chứa logic nghiệp vụ và truy cập dữ liệu. Sau khi tách, ứng dụng logic ở tầng trình bày gọi từ xa ứng dụng logic nghiệp vụ. Hình dưới đây cho thấy kiến trúc trước và sau khi chuyển đổi:

![2](../../micro-services/images/Before-and-after-migration.png)

Tách ứng dụng đơn khối theo cách này có hai lợi ích. Thứ nhất, hai phần ứng dụng có thể được phát triển, triển khai và mở rộng độc lập; đặc biệt, nó cho phép nhà phát triển tầng trình bày nhanh chóng đưa ra lựa chọn về giao diện người dùng và thực hiện A/B testing. Thứ hai, một số API từ xa có thể được microservice gọi.

Tuy nhiên, đây chỉ là giải pháp một phần. Có thể một hoặc cả hai phần ứng dụng vẫn không thể quản lý được, do đó cần chiến lược thứ ba để loại bỏ phần kiến trúc đơn khối còn lại.

## Chiến lược 3 — Trích xuất dịch vụ

Chiến lược chuyển đổi thứ ba là trích xuất một số mô-đun từ ứng dụng đơn khối để biến chúng thành microservice độc lập. Mỗi khi trích xuất một mô-đun thành microservice, ứng dụng đơn khối sẽ đơn giản hơn một chút. Sau khi chuyển đổi đủ nhiều mô-đun, bản thân ứng dụng đơn khối sẽ không còn là vấn đề: nó sẽ biến mất hoặc trở nên đơn giản đến mức chỉ còn là một dịch vụ.

### Sắp xếp thứ tự mô-đun cần chuyển thành microservice

Một ứng dụng đơn khối lớn, phức tạp gồm hàng chục hoặc hàng trăm mô-đun; mỗi mô-đun đều có thể được trích xuất. Quyết định mô-đun nào được trích xuất đầu tiên thường là một thách thức. Thông thường, tốt nhất nên bắt đầu từ mô-đun dễ trích xuất nhất để nhà phát triển tích lũy đủ kinh nghiệm; kinh nghiệm này mang lại lợi ích lớn cho công việc mô-đun hóa về sau.

Chuyển đổi mô-đun thành microservice thường tốn nhiều thời gian; có thể sắp xếp thứ tự dựa trên mức độ lợi ích. Thông thường, bắt đầu từ các mô-đun thay đổi thường xuyên mang lại lợi ích lớn nhất. Khi một mô-đun đã chuyển thành microservice, có thể phát triển và triển khai nó như mô-đun độc lập, nhờ đó tăng tốc quá trình phát triển.

Một tiêu chí sắp xếp khác là trích xuất trước các mô-đun tiêu thụ nhiều tài nguyên. Ví dụ, trích xuất cơ sở dữ liệu in-memory thành microservice sẽ rất hữu ích vì có thể triển khai trên máy chủ có nhiều bộ nhớ. Tương tự, trích xuất ứng dụng thuật toán nhạy với tài nguyên tính toán cũng rất có lợi; có thể triển khai dịch vụ đó trên máy chủ có nhiều CPU. Chuyển mô-đun tiêu tốn tài nguyên thành microservice giúp ứng dụng dễ mở rộng hơn.

Cũng có lợi khi tìm các ranh giới hạt lớn sẵn có để quyết định mô-đun nào nên được trích xuất, vì điều này giúp công việc chuyển đổi dễ dàng và đơn giản hơn. Ví dụ, mô-đun chỉ trao đổi message bất đồng bộ với các ứng dụng khác là một ranh giới rõ ràng; có thể dễ dàng chuyển mô-đun đó thành microservice.

### Cách trích xuất mô-đun

Bước đầu tiên để trích xuất mô-đun là định nghĩa giao diện hạt lớn giữa mô-đun và ứng dụng đơn khối. Vì ứng dụng đơn khối cần dữ liệu từ microservice và ngược lại, giao diện này gần như là API hai chiều. Phát triển API này là thách thức vì cần cân bằng giữa việc quản lý các quan hệ phụ thuộc và mô hình interface hạt mịn; điều này đặc biệt khó với tầng logic nghiệp vụ sử dụng mô hình miền. Vì vậy, thường cần sửa đổi mã để giải quyết vấn đề phụ thuộc, như hình minh họa:

Khi đã hoàn tất giao diện hạt lớn, có thể chuyển mô-đun thành microservice độc lập. Để thực hiện, cần viết mã giúp ứng dụng đơn khối và microservice trao đổi thông tin qua API sử dụng cơ chế giao tiếp giữa các tiến trình (IPC). Hình dưới đây so sánh kiến trúc trước và sau khi chuyển đổi:

![3](../../micro-services/images/30103116_ZCcM.png)

Trong ví dụ này, mô-đun Z, vốn đang sử dụng mô-đun Y, là mô-đun được chọn để trích xuất; các thành phần của Z cũng đang được mô-đun X sử dụng. Bước đầu tiên trong quá trình chuyển đổi là định nghĩa một bộ API hạt lớn. Giao diện thứ nhất là giao diện nội bộ mà mô-đun X sử dụng để kích hoạt mô-đun Z; giao diện thứ hai là giao diện bên ngoài mà mô-đun Z sử dụng để kích hoạt mô-đun Y.

Bước thứ hai là chuyển mô-đun thành dịch vụ độc lập. Mã cho cả giao diện nội bộ lẫn bên ngoài đều dùng cơ chế IPC; thường tích hợp mô-đun Z vào một framework microservice để xử lý các vấn đề trong quá trình chuyển đổi, chẳng hạn service discovery.

Sau khi trích xuất mô-đun, có thể phát triển, triển khai và mở rộng thêm một dịch vụ độc lập với ứng dụng đơn khối và các dịch vụ khác. Có thể viết mã từ đầu để triển khai dịch vụ; trong trường hợp này, mã API tích hợp dịch vụ với ứng dụng đơn khối trở thành lớp anti-corruption, có nhiệm vụ chuyển đổi giữa hai mô hình miền. Mỗi dịch vụ được trích xuất là một bước tiến theo hướng microservice. Theo thời gian, ứng dụng đơn khối ngày càng đơn giản và người dùng có thể bổ sung thêm nhiều microservice độc lập.
Việc hiện đại hóa ứng dụng hiện có thành kiến trúc microservice không nên thực hiện bằng cách viết lại mã từ đầu; thay vào đó, nên chuyển đổi từng bước. Có thể cân nhắc ba chiến lược: triển khai chức năng mới dưới dạng microservice; tách tầng trình bày khỏi tầng logic nghiệp vụ và truy cập dữ liệu; trích xuất các mô-đun hiện có thành microservice. Theo thời gian, số lượng microservice tăng lên và tính linh hoạt cùng hiệu suất của nhóm phát triển được cải thiện đáng kể.
