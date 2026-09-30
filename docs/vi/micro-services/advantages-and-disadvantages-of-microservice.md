# Ưu điểm và hạn chế của kiến trúc microservice

## Phát triển ứng dụng đơn khối

Giả sử bạn chuẩn bị phát triển một phần mềm điều phối taxi để cạnh tranh với Uber và Hailo. Sau các cuộc họp ban đầu và phân tích yêu cầu, bạn có thể bắt đầu dự án mới bằng cách tạo thủ công hoặc dùng trình tạo dựa trên Rails, Spring Boot, Play hay Maven. Ứng dụng có kiến trúc lục giác theo mô-đun như sơ đồ dưới đây:

![monolithic-application-architecture-diagram](./images/monolithic-application-architecture-diagram.png)

Lõi ứng dụng là logic nghiệp vụ, được triển khai bởi các mô-đun định nghĩa dịch vụ, đối tượng miền và sự kiện. Xung quanh phần lõi là các adapter giao tiếp với thế giới bên ngoài. Adapter gồm các thành phần truy cập cơ sở dữ liệu, thành phần gửi và xử lý thông điệp, các mô-đun web cung cấp quyền truy cập qua API hoặc giao diện người dùng, v.v.

Dù logic cũng được chia theo mô-đun, cuối cùng ứng dụng vẫn được đóng gói và triển khai thành ứng dụng đơn khối. Định dạng cụ thể phụ thuộc vào ngôn ngữ và framework của ứng dụng. Ví dụ, nhiều ứng dụng Java được đóng gói thành WAR để triển khai trên Tomcat hoặc Jetty; một số ứng dụng Java khác được đóng gói thành JAR tự chứa; Rails và Node.js thì được đóng gói thành cây thư mục phân cấp.

Phong cách phát triển ứng dụng này rất phổ biến vì IDE và các công cụ khác giỏi hỗ trợ phát triển ứng dụng đơn giản; loại ứng dụng này cũng dễ gỡ lỗi: chỉ cần chạy ứng dụng rồi dùng Selenium kết nối giao diện người dùng là có thể kiểm thử từ đầu đến cuối. Ứng dụng đơn khối cũng dễ triển khai: chỉ cần sao chép gói ứng dụng lên máy chủ, rồi chạy nhiều bản sao phía sau bộ cân bằng tải để dễ dàng mở rộng ứng dụng. Trong giai đoạn đầu, loại ứng dụng này hoạt động rất tốt.

## Hạn chế của ứng dụng đơn khối

Đáng tiếc là phương pháp đơn giản này có những hạn chế lớn. Một ứng dụng đơn giản dần lớn lên theo thời gian. Trong mỗi sprint, nhóm phát triển phải xử lý các “story” mới và viết thêm nhiều mã. Sau vài năm, ứng dụng nhỏ và đơn giản ban đầu có thể trở thành một con quái vật khổng lồ. Tôi xin nêu một ví dụ: gần đây tôi trao đổi với một nhà phát triển đang viết công cụ phân tích quan hệ phụ thuộc giữa các tệp JAR trong ứng dụng của họ, vốn có hàng triệu dòng mã. Tôi tin chắc mã này chính là một con quái vật mà nhiều nhà phát triển đã cùng tạo ra qua nhiều năm nỗ lực.

Một khi ứng dụng đã trở thành con quái vật lớn và phức tạp thì nhóm phát triển chắc chắn sẽ rất khổ sở. Phát triển và triển khai linh hoạt đều trở nên khó khăn; vấn đề chính là ứng dụng quá phức tạp khiến một nhà phát triển riêng lẻ không thể hiểu hết. Vì vậy, việc sửa lỗi và thêm chức năng mới cho đúng trở nên rất khó và tốn thời gian. Tinh thần của nhóm cũng đi xuống. Nếu mã khó hiểu thì không thể sửa đổi chính xác, và cuối cùng ứng dụng trở thành một mớ hỗn độn khổng lồ, không thể hiểu nổi.

Ứng dụng đơn khối cũng làm giảm tốc độ phát triển. Ứng dụng càng lớn thì thời gian khởi động càng lâu. Ví dụ, một khảo sát gần đây cho thấy đôi khi ứng dụng khởi động mất hơn 12 phút. Tôi cũng nghe nói có những ứng dụng cần đến 40 phút để khởi động. Nếu nhà phát triển phải thường xuyên khởi động lại ứng dụng thì phần lớn thời gian sẽ dành cho việc chờ đợi, làm giảm mạnh năng suất.

Ngoài ra, ứng dụng đơn khối phức tạp và khổng lồ không phù hợp với phát triển liên tục. Hiện nay, các ứng dụng SaaS thường thay đổi nhiều lần mỗi ngày, điều này rất khó thực hiện với mô hình ứng dụng đơn khối. Tác động của những thay đổi này cũng không được hiểu rõ, vì vậy phải thực hiện nhiều kiểm thử thủ công. Do đó, triển khai liên tục cũng trở nên rất khó khăn.

Khi các mô-đun trong ứng dụng đơn khối cạnh tranh tài nguyên, việc mở rộng rất khó. Chẳng hạn, một mô-đun thực hiện logic cần nhiều CPU thì nên chạy trên các instance AWS EC2 Compute Optimized, trong khi mô-đun cơ sở dữ liệu cần nhiều bộ nhớ phù hợp hơn với EC2 Memory-optimized. Nhưng vì các mô-đun được triển khai cùng nhau nên phải thỏa hiệp khi lựa chọn phần cứng.

Một vấn đề khác của ứng dụng đơn khối là độ tin cậy. Vì mọi mô-đun chạy trong cùng một tiến trình, chỉ một lỗi trong một mô-đun, chẳng hạn rò rỉ bộ nhớ, cũng có thể làm sập cả tiến trình. Ngoài ra, vì tất cả instance ứng dụng đều giống nhau nên lỗi này có thể ảnh hưởng đến độ tin cậy của toàn bộ ứng dụng.

Cuối cùng, ứng dụng đơn khối khiến việc áp dụng kiến trúc và ngôn ngữ mới trở nên rất khó. Ví dụ, hãy tưởng tượng bạn có hai triệu dòng mã viết bằng framework XYZ. Nếu muốn chuyển sang framework ABC thì thời gian và chi phí đều rất lớn, dù framework ABC tốt hơn. Đây là khoảng cách không thể vượt qua, và bạn buộc phải chấp nhận lựa chọn ban đầu.

Tóm lại: ban đầu bạn có một ứng dụng nghiệp vụ cốt lõi rất thành công; về sau nó trở thành một con quái vật khổng lồ, khó hiểu. Vì sử dụng công nghệ lỗi thời, kém hiệu quả nên rất khó tuyển được nhà phát triển tiềm năng. Ứng dụng không thể mở rộng, độ tin cậy thấp, cuối cùng không thể tiếp tục phát triển và triển khai linh hoạt.

Vậy giải quyết như thế nào?

## Kiến trúc microservice — xử lý sự phức tạp

Nhiều công ty như Amazon, eBay và Netflix đã giải quyết các vấn đề trên bằng cách áp dụng mô hình kiến trúc microservice. Ý tưởng không phải là phát triển một ứng dụng đơn khối khổng lồ, mà là chia ứng dụng thành các microservice nhỏ có kết nối với nhau.

Một microservice thường hoàn thành một chức năng cụ thể, chẳng hạn quản lý đơn hàng, quản lý khách hàng, v.v. Mỗi microservice là một ứng dụng lục giác nhỏ, có logic nghiệp vụ và adapter riêng. Một số microservice còn công bố API để các microservice khác và ứng dụng phía client sử dụng. Một số microservice khác triển khai giao diện người dùng web; khi chạy, mỗi instance có thể là máy ảo trên đám mây hoặc container Docker.

Ví dụ, hệ thống đã mô tả ở trên có thể được phân rã như sau:

![deal-with-complex things-1](./images/deal-with-complex-things-1.png)

Mỗi vùng chức năng của ứng dụng được triển khai bằng microservice. Ngoài ra, ứng dụng web được tách thành một loạt ứng dụng web đơn giản (chẳng hạn một ứng dụng cho hành khách, một ứng dụng cho tài xế taxi). Việc tách này giúp triển khai dễ hơn cho các nhóm người dùng, thiết bị và trường hợp sử dụng đặc thù khác nhau.

Mỗi dịch vụ phía sau cung cấp một REST API; nhiều dịch vụ cũng sử dụng API do các dịch vụ khác cung cấp. Chẳng hạn, dịch vụ quản lý tài xế dùng dịch vụ thông báo để báo cho tài xế về một nhu cầu tiềm năng. Dịch vụ giao diện người dùng kích hoạt các dịch vụ khác để cập nhật trang web. Tất cả dịch vụ giao tiếp bất đồng bộ dựa trên thông điệp. Cơ chế bên trong microservice sẽ được thảo luận trong các bài tiếp theo.

Một số REST API cũng được cung cấp cho ứng dụng di động mà hành khách và tài xế sử dụng. Các ứng dụng này không truy cập trực tiếp vào dịch vụ phía sau mà truyền thông điệp trung gian qua API Gateway. API Gateway chịu trách nhiệm cân bằng tải, cache, kiểm soát truy cập, giám sát tính phí API và nhiều tác vụ khác; có thể dễ dàng triển khai bằng NGINX. Các bài viết sau sẽ giới thiệu API Gateway.

![deal-with-complex-things-2](./images/deal-with-complex-things-2.png)

Trong sơ đồ trên, mô hình kiến trúc microservice tương ứng với trục Y của Scale Cube mở rộng, mô hình mở rộng ba chiều được mô tả trong sách *The Art of Scalability*. Hai trục mở rộng còn lại: trục X gồm nhiều bản sao ứng dụng chạy phía sau bộ cân bằng tải; trục Z định tuyến yêu cầu đến dịch vụ liên quan.

Về cơ bản, có thể biểu diễn ứng dụng theo ba chiều trên; trục Y biểu thị việc chia ứng dụng thành microservice. Khi chạy, trục X biểu thị nhiều instance chạy phía sau bộ cân bằng tải để cung cấp thông lượng. Một số ứng dụng vẫn có thể phân vùng dịch vụ theo trục Z. Hình bên dưới minh họa cách triển khai dịch vụ quản lý chuyến đi trên Docker chạy trên AWS EC2.

![deal-with-complex-things-3](./images/deal-with-complex-things-3.png)

Khi chạy, dịch vụ quản lý chuyến đi gồm nhiều instance dịch vụ. Mỗi instance là một container Docker. Để bảo đảm tính sẵn sàng cao, các container này thường chạy trên nhiều máy ảo đám mây. Phía trước các instance dịch vụ là một tầng cân bằng tải như NGINX, chịu trách nhiệm phân phối yêu cầu giữa các instance. Bộ cân bằng tải đồng thời xử lý các yêu cầu khác, chẳng hạn cache, kiểm soát quyền, thống kê và giám sát API.

Mô hình kiến trúc microservice làm thay đổi sâu sắc mối quan hệ giữa ứng dụng và cơ sở dữ liệu. **Khác với mô hình truyền thống, trong đó nhiều dịch vụ dùng chung một cơ sở dữ liệu, kiến trúc microservice có cơ sở dữ liệu riêng cho từng dịch vụ**. Ý tưởng này cũng ảnh hưởng đến mô hình dữ liệu doanh nghiệp. Mô hình này đồng nghĩa với việc có nhiều bản sao dữ liệu; tuy nhiên, nếu muốn tận dụng lợi ích của microservice thì mỗi dịch vụ phải có cơ sở dữ liệu riêng, vì kiến trúc này đòi hỏi sự liên kết lỏng. Hình bên dưới minh họa kiến trúc cơ sở dữ liệu của ứng dụng ví dụ.

![deal-with-complex-things-4](./images/deal-with-complex-things-4.png)

Mỗi loại dịch vụ có cơ sở dữ liệu riêng; ngoài ra, mỗi dịch vụ có thể chọn loại cơ sở dữ liệu phù hợp nhất với mình. Cách này còn được gọi là kiến trúc nhất quán đa ngôn ngữ. Chẳng hạn, quản lý tài xế (xác định tài xế nào ở gần hành khách hơn) phải dùng cơ sở dữ liệu hỗ trợ truy vấn thông tin địa lý.

Thoạt nhìn, mô hình kiến trúc microservice có vẻ giống SOA vì cả hai đều gồm nhiều dịch vụ. Nhưng có thể nhìn vấn đề theo cách khác: mô hình kiến trúc microservice là SOA không bao gồm dịch vụ Web (WS-) và dịch vụ ESB. Ứng dụng microservice ưu tiên giao thức đơn giản, nhẹ như REST thay vì WS-, đồng thời tránh dùng ESB và các chức năng tương tự bên trong microservice. Mô hình kiến trúc microservice cũng bác bỏ các khái niệm SOA như canonical schema.

## Lợi ích của kiến trúc microservice

Mô hình kiến trúc microservice có nhiều lợi ích. Trước hết, chia ứng dụng đơn khối khổng lồ thành nhiều dịch vụ giúp giải quyết vấn đề phức tạp. Trong khi chức năng không thay đổi, ứng dụng được chia thành nhiều nhánh hoặc dịch vụ có thể quản lý được. Mỗi dịch vụ có ranh giới được xác định rõ bằng API dựa trên RPC hoặc thông điệp. Mô hình kiến trúc microservice cung cấp giải pháp mô-đun hóa cho các chức năng khó triển khai theo cách viết mã đơn khối; nhờ vậy, từng dịch vụ dễ phát triển, dễ hiểu và dễ bảo trì.

Thứ hai, kiến trúc này cho phép mỗi dịch vụ có một nhóm phát triển chuyên trách. Nhà phát triển được tự do lựa chọn công nghệ để phát triển và cung cấp dịch vụ API. Tất nhiên, nhiều công ty cố tránh tình trạng hỗn loạn bằng cách chỉ đưa ra một số lựa chọn công nghệ. Tuy vậy, sự tự do này có nghĩa là nhà phát triển không buộc phải dùng công nghệ lỗi thời được chọn từ khi dự án bắt đầu; họ có thể chọn công nghệ hiện tại. Thậm chí, vì các dịch vụ tương đối đơn giản nên viết lại mã cũ bằng công nghệ hiện tại cũng không quá khó.

Thứ ba, trong mô hình kiến trúc microservice, mỗi microservice được triển khai độc lập. Nhà phát triển không còn phải điều phối việc triển khai các dịch vụ khác để tránh ảnh hưởng đến dịch vụ của mình. Thay đổi này có thể tăng tốc triển khai. Nhóm giao diện người dùng có thể dùng kiểm thử A/B và triển khai thay đổi nhanh chóng. Mô hình kiến trúc microservice giúp triển khai liên tục trở thành khả thi.

Cuối cùng, mô hình kiến trúc microservice cho phép mở rộng từng dịch vụ độc lập. Có thể triển khai quy mô đáp ứng nhu cầu dựa trên kích thước của từng dịch vụ. Thậm chí có thể dùng phần cứng phù hợp hơn với yêu cầu tài nguyên của dịch vụ. Ví dụ, có thể triển khai dịch vụ cần nhiều CPU trên các instance EC2 Compute Optimized, còn dịch vụ cơ sở dữ liệu cần nhiều bộ nhớ trên các instance EC2 memory-optimized.

## Hạn chế của kiến trúc microservice

Fred Brooks đã viết cách đây 30 năm: “there are no silver bullets” (không có viên đạn bạc). Cũng như mọi công nghệ khác, kiến trúc microservice có những hạn chế. Một hạn chế liên quan đến chính tên gọi của nó: “microservice” nhấn mạnh kích thước dịch vụ. Trên thực tế, có nhà phát triển cổ súy xây dựng các nhóm dịch vụ lớn hơn một chút, từ 10–100 LOC. Dù dịch vụ nhỏ hấp dẫn hơn, đừng quên đó chỉ là lựa chọn cuối cùng chứ không phải mục tiêu cuối. Mục tiêu của microservice là chia ứng dụng hiệu quả để phát triển và triển khai linh hoạt.

Một hạn chế chính khác là ứng dụng microservice là hệ thống phân tán, vì vậy có độ phức tạp vốn có. Nhà phát triển cần chọn giữa RPC và truyền thông điệp, đồng thời triển khai cơ chế giao tiếp giữa các tiến trình. Hơn nữa, họ phải viết mã xử lý các lỗi cục bộ, chẳng hạn việc truyền thông điệp quá chậm hoặc không khả dụng. Điều này không hẳn là quá khó, nhưng phức tạp hơn so với phương thức ở cấp ngôn ngữ hoặc lời gọi tiến trình trong ứng dụng đơn khối.

Một thách thức khác của microservice đến từ kiến trúc cơ sở dữ liệu phân vùng. Trong giao dịch thương mại, thường cần cập nhật đồng thời dữ liệu cho nhiều phân hệ nghiệp vụ. Loại giao dịch này dễ thực hiện trong ứng dụng đơn khối vì chỉ có một cơ sở dữ liệu. Trong ứng dụng microservice, cần cập nhật các cơ sở dữ liệu khác nhau mà những dịch vụ khác nhau sử dụng. Giao dịch phân tán chưa chắc là lựa chọn tốt, không chỉ vì lý thuyết CAP mà còn vì các cơ sở dữ liệu NoSQL có khả năng mở rộng cao và middleware truyền thông điệp hiện nay không hỗ trợ yêu cầu này. Cuối cùng, bạn buộc phải dùng phương pháp nhất quán cuối cùng, làm tăng yêu cầu và thách thức đối với nhà phát triển.

Kiểm thử ứng dụng dựa trên kiến trúc microservice cũng rất phức tạp. Ví dụ, với kiến trúc Spring Boot phổ biến, kiểm thử REST API của ứng dụng web đơn khối rất dễ. Ngược lại, để kiểm thử cùng một dịch vụ, cần khởi động tất cả dịch vụ liên quan (ít nhất phải có các stub của những dịch vụ đó). Xin nhắc lại: đừng đánh giá thấp độ phức tạp do kiến trúc microservice mang lại.

Một thách thức khác là những thay đổi trong ứng dụng theo mô hình kiến trúc microservice có thể lan sang nhiều dịch vụ. Ví dụ, giả sử bạn cần sửa các dịch vụ A, B và C, trong đó A phụ thuộc B và B phụ thuộc C. Trong ứng dụng đơn khối, chỉ cần sửa các mô-đun liên quan, tích hợp thay đổi rồi triển khai. Ngược lại, với mô hình kiến trúc microservice, cần cân nhắc tác động của thay đổi liên quan đến các dịch vụ khác nhau. Chẳng hạn, cần cập nhật dịch vụ C trước, rồi đến B, cuối cùng mới đến A. May mắn là nhiều thay đổi thường chỉ ảnh hưởng đến một dịch vụ; thay đổi cần điều phối nhiều dịch vụ khá hiếm.

Triển khai ứng dụng microservice cũng rất phức tạp. Với ứng dụng phân tán thông thường, chỉ cần triển khai các máy chủ phía sau bộ cân bằng tải phức tạp. Mỗi instance ứng dụng cần cấu hình các dịch vụ hạ tầng như cơ sở dữ liệu và middleware truyền thông điệp. Ngược lại, ứng dụng microservice thường gồm rất nhiều dịch vụ. Theo Adrian Cockcroft, Hailo gồm 160 dịch vụ khác nhau, còn Netflix có khoảng 600 dịch vụ. Mỗi dịch vụ lại có nhiều instance. Điều đó tạo ra rất nhiều thành phần cần cấu hình, triển khai, mở rộng và giám sát. Ngoài ra, còn phải triển khai cơ chế khám phá dịch vụ (sẽ trình bày trong bài sau) để tìm địa chỉ của dịch vụ cần giao tiếp, bao gồm địa chỉ máy chủ và cổng. Các phương pháp truyền thống không thể giải quyết vấn đề phức tạp như vậy. Do đó, triển khai thành công ứng dụng microservice đòi hỏi nhà phát triển kiểm soát tốt quy trình triển khai và tự động hóa ở mức cao.

Một phương pháp tự động hóa là dùng dịch vụ PaaS như Cloud Foundry. PaaS cung cấp cho nhà phát triển cách đơn giản để triển khai và quản lý microservice; các vấn đề trên được đóng gói và giải quyết sẵn. Đồng thời, các chuyên gia hệ thống và mạng cấu hình PaaS có thể dùng thực tiễn tốt nhất và chính sách để đơn giản hóa những vấn đề này. Một cách tự động triển khai ứng dụng microservice khác là tự phát triển hệ thống PaaS cơ bản của riêng mình. Điểm bắt đầu điển hình là dùng giải pháp cụm, chẳng hạn kết hợp Mesos hoặc Kubernetes với Docker. Trong loạt bài sau, chúng ta sẽ xem xét cách dựa trên các phương pháp triển khai phần mềm như NGINX để dễ dàng cung cấp cache, kiểm soát quyền, thống kê và giám sát API ở cấp microservice.

## Tổng kết

Xây dựng ứng dụng phức tạp thực sự rất khó. Kiến trúc đơn khối phù hợp hơn với ứng dụng đơn giản, quy mô nhỏ. Nếu dùng nó để phát triển ứng dụng phức tạp thì sẽ rất tệ. Có thể dùng mô hình kiến trúc microservice để xây dựng ứng dụng phức tạp; tất nhiên mô hình kiến trúc này cũng có những nhược điểm và thách thức riêng.
