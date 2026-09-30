# Mô tả về kiến trúc microservice

> Bản dịch từ bài viết [Microservices](https://martinfowler.com/articles/microservices.html) trên trang của [Martin Fowler](https://martinfowler.com/). Bài viết khá dài, cần kiên nhẫn đọc. <br> Trình độ của tôi còn hạn chế; nếu có chỗ chưa phù hợp, mong mọi người góp ý chỉnh sửa. Xin cảm ơn.

Trong vài năm gần đây xuất hiện thuật ngữ “kiến trúc microservice”, mô tả một phương pháp cụ thể để thiết kế ứng dụng phần mềm thành một tập hợp các dịch vụ có thể triển khai độc lập. Dù phong cách kiến trúc này chưa có định nghĩa chính xác, các tổ chức áp dụng nó quanh năng lực nghiệp vụ, triển khai tự động, endpoint thông minh và quyền kiểm soát phân tán đối với ngôn ngữ và dữ liệu vẫn có một số đặc điểm chung.

“Microservice” — thêm một thuật ngữ mới nữa trên con phố kiến trúc phần mềm đông đúc. Dù phản ứng tự nhiên là nhìn nó bằng ánh mắt hoài nghi, thuật ngữ này mô tả một phong cách hệ thống phần mềm ngày càng hấp dẫn. Trong vài năm qua, chúng tôi đã thấy nhiều dự án áp dụng phong cách này và kết quả đến nay đều tích cực; đến mức nó trở thành phong cách mặc định mà nhiều đồng nghiệp của chúng tôi tại ThoughtWorks chọn khi xây dựng ứng dụng doanh nghiệp. Tuy nhiên, đáng tiếc là chưa có nhiều thông tin khái quát về phong cách microservice và cách triển khai nó.

Nói ngắn gọn, phong cách kiến trúc microservice[1] là cách phát triển một ứng dụng đơn lẻ thành một tập hợp dịch vụ nhỏ; mỗi dịch vụ chạy trong tiến trình riêng và giao tiếp bằng cơ chế nhẹ (thường là REST API qua HTTP). Các dịch vụ được xây dựng quanh chức năng nghiệp vụ và có thể triển khai độc lập thông qua cơ chế triển khai hoàn toàn tự động. Các dịch vụ dùng một lượng quản lý tập trung tối thiểu, có thể được viết bằng các ngôn ngữ lập trình khác nhau và dùng các công nghệ lưu trữ dữ liệu khác nhau.

Trước khi giải thích phong cách microservice, sẽ hữu ích nếu so sánh nó với phong cách đơn khối (monolithic): ứng dụng đơn khối được xây dựng như một đơn vị duy nhất. Ứng dụng doanh nghiệp thường gồm ba phần: giao diện người dùng phía client (gồm các trang HTML và JavaScript chạy trong trình duyệt trên máy người dùng), hệ thống cơ sở dữ liệu (gồm nhiều bảng, thường được quản lý trong cơ sở dữ liệu quan hệ) và ứng dụng phía máy chủ. Ứng dụng phía máy chủ xử lý yêu cầu HTTP, thực hiện một số logic, truy xuất và cập nhật dữ liệu trong cơ sở dữ liệu, rồi chọn dữ liệu và đưa vào khung nhìn HTML để gửi đến trình duyệt. Ứng dụng phía máy chủ này là một khối thống nhất — một tệp thực thi logic[2]. Mọi thay đổi đối với hệ thống đều cần xây dựng và triển khai phiên bản mới của ứng dụng phía máy chủ.

Máy chủ đơn khối là cách tự nhiên để xây dựng loại hệ thống này. Toàn bộ logic xử lý một yêu cầu chạy trong một tiến trình, cho phép bạn chia ứng dụng thành lớp, hàm và namespace bằng các tính năng cơ bản của ngôn ngữ. Cần lưu ý rằng bạn có thể chạy và kiểm thử ứng dụng trên máy tính của nhà phát triển, đồng thời dùng pipeline triển khai để bảo đảm các thay đổi được kiểm thử phù hợp và đưa lên môi trường production. Có thể mở rộng toàn bộ khối theo chiều ngang bằng cách chạy nhiều instance phía sau bộ cân bằng tải.

Ứng dụng đơn khối có thể thành công, nhưng ngày càng nhiều người không hài lòng với chúng — đặc biệt khi triển khai thêm ứng dụng lên đám mây. Chu kỳ thay đổi bị gắn chặt với nhau: dù chỉ thay đổi một phần nhỏ của ứng dụng cũng cần xây dựng lại và triển khai toàn bộ khối. Theo thời gian, thường khó duy trì cấu trúc mô-đun tốt và càng khó bảo đảm một thay đổi chỉ ảnh hưởng đến một mô-đun. Khi mở rộng hệ thống, buộc phải mở rộng toàn bộ ứng dụng thay vì chỉ mở rộng những phần cần thêm tài nguyên.

![sketch](./images/sketch.png)

Những bất mãn này dẫn đến phong cách kiến trúc microservice: xây dựng ứng dụng thành một tập hợp dịch vụ. Ngoài việc mỗi dịch vụ có thể triển khai và mở rộng độc lập, mỗi dịch vụ còn tạo ra ranh giới mô-đun chặt chẽ; thậm chí các dịch vụ khác nhau có thể được viết bằng ngôn ngữ lập trình khác nhau và do các nhóm khác nhau quản lý.

Chúng tôi không cho rằng phong cách microservice là mới mẻ hay sáng tạo; nguồn gốc của nó ít nhất có thể truy ngược đến các nguyên tắc thiết kế của Unix. Tuy vậy, chúng tôi cho rằng chưa đủ nhiều người cân nhắc kiến trúc microservice, trong khi việc phát triển nhiều phần mềm sẽ tốt hơn nếu áp dụng nó.

## Đặc điểm của kiến trúc microservice

Dù không thể nói phong cách kiến trúc microservice có một định nghĩa chính thức, chúng tôi có thể thử mô tả một số đặc điểm chung mà theo chúng tôi thường có trong các kiến trúc mang nhãn này. Cũng như mọi định nghĩa khái quát đặc điểm chung khác, không phải kiến trúc microservice nào cũng có đủ tất cả đặc điểm, nhưng chúng tôi kỳ vọng phần lớn kiến trúc microservice có đa số đặc điểm. Dù các tác giả chúng tôi luôn là thành viên tích cực của cộng đồng khá lỏng lẻo này, mục đích ở đây chỉ là mô tả những gì cả hai đã thấy trong công việc của mình và các nhóm mà chúng tôi biết. Xin nhấn mạnh rằng chúng tôi không đặt ra một bộ định nghĩa nào.

### Thành phần hóa thông qua dịch vụ

Từ khi tham gia ngành phần mềm, chúng tôi luôn muốn xây dựng hệ thống bằng cách tích hợp các thành phần, giống như cách các vật thể trong thế giới vật lý được cấu tạo. Trong vài thập kỷ qua, chúng ta đã thấy các thư viện phần mềm công khai của hầu hết nền tảng ngôn ngữ phát triển vượt bậc.

Khi nói về thành phần, ta gặp một vấn đề khó định nghĩa: thành phần là gì? Theo định nghĩa của chúng tôi, thành phần là một đơn vị phần mềm có thể được thay thế và nâng cấp độc lập.

Kiến trúc microservice cũng dùng thư viện phần mềm, nhưng cách chính để thành phần hóa phần mềm là chia ứng dụng thành nhiều dịch vụ. Chúng tôi định nghĩa thư viện là thành phần được liên kết vào chương trình và được gọi bằng lời gọi hàm trong bộ nhớ; còn dịch vụ là thành phần chạy ngoài tiến trình, giao tiếp bằng cơ chế như yêu cầu dịch vụ web hoặc lời gọi thủ tục từ xa. (Điều này khác với khái niệm đối tượng dịch vụ trong nhiều chương trình hướng đối tượng.[3])

Một lý do chính để dùng dịch vụ thay vì thư viện làm thành phần là dịch vụ có thể triển khai độc lập. Nếu ứng dụng[4] gồm nhiều thư viện trong một tiến trình duy nhất thì mọi thay đổi ở bất kỳ thành phần nào đều khiến phải triển khai lại toàn bộ ứng dụng. Nhưng nếu ứng dụng được chia thành nhiều dịch vụ thì chỉ cần triển khai lại dịch vụ đã thay đổi. Dĩ nhiên, điều này không phải lúc nào cũng tuyệt đối: thay đổi một số giao diện dịch vụ có thể đòi hỏi phối hợp sửa đổi nhiều dịch vụ. Tuy nhiên, mục tiêu của kiến trúc microservice tốt là giảm thiểu các thay đổi phối hợp này bằng ranh giới dịch vụ gắn kết chặt và cơ chế phát triển giao thức dịch vụ.

Một hệ quả khác của việc dùng dịch vụ làm thành phần là giao diện thành phần được xác định rõ hơn. Phần lớn ngôn ngữ không có cơ chế tốt để định nghĩa giao diện được công bố một cách tường minh. Thường chỉ có tài liệu và quy tắc để ngăn client phá vỡ tính đóng gói của thành phần, dẫn đến các thành phần bị ghép nối quá chặt. Dùng cơ chế lời gọi từ xa tường minh giúp dịch vụ tránh tình trạng này dễ hơn.

Cách dùng dịch vụ như vậy thực sự có một số nhược điểm. Lời gọi từ xa tốn kém hơn lời gọi trong tiến trình; API từ xa cần được thiết kế với độ hạt lớn hơn, điều này thường khiến chúng khó sử dụng hơn. Nếu cần thay đổi cách phân chia trách nhiệm giữa các thành phần thì thay đổi hành vi thành phần sẽ khó thực hiện hơn khi phải vượt qua ranh giới tiến trình.

Có thể gần đúng xem mỗi dịch vụ tương ứng với một tiến trình lúc chạy, nhưng đây chỉ là phép gần đúng. Một dịch vụ có thể gồm nhiều tiến trình luôn được phát triển và triển khai cùng nhau, chẳng hạn tiến trình ứng dụng và cơ sở dữ liệu chỉ được dịch vụ đó sử dụng.

### Tổ chức quanh năng lực nghiệp vụ

Khi chia một ứng dụng lớn thành nhiều phần, ban quản lý thường tập trung vào khía cạnh kỹ thuật, dẫn đến việc chia nhóm theo giao diện người dùng, logic phía máy chủ và cơ sở dữ liệu. Khi các nhóm được chia theo cách này, ngay cả một thay đổi đơn giản cũng có thể kéo theo thời gian và ngân sách cho dự án liên nhóm. Một nhóm thông minh sẽ tìm cách tối ưu tình hình này — “chọn phương án ít tệ hơn trong hai điều xấu”: chỉ đưa logic vào bất kỳ ứng dụng nào mà họ có thể tiếp cận. Nói cách khác, logic hiện diện ở khắp nơi. Đây là một ví dụ về Định luật Conway[5].

> Bất kỳ tổ chức nào thiết kế một hệ thống (theo nghĩa rộng) đều sẽ tạo ra một thiết kế có cấu trúc là bản sao cấu trúc giao tiếp của chính tổ chức đó.<br> — Melvin Conway, 1967

![conways-law](./images/conways-law.png)

Microservice chia hệ thống theo cách khác: chia thành nhiều dịch vụ xoay quanh chức năng nghiệp vụ. Các dịch vụ triển khai nhiều phần mềm cho lĩnh vực nghiệp vụ đó, bao gồm giao diện người dùng, lưu trữ bền vững và mọi hoạt động cộng tác bên ngoài. Vì vậy, nhóm là nhóm đa chức năng, có đủ kỹ năng cần thiết để phát triển: trải nghiệm người dùng, cơ sở dữ liệu và quản lý dự án.

![PreferFunctionalStaffOrganization](./images/PreferFunctionalStaffOrganization.png)

Một công ty được tổ chức theo cách này là [www.comparethemarket.com](http://www.comparethemarket.com/). Các nhóm đa chức năng chịu trách nhiệm xây dựng và vận hành từng sản phẩm; mỗi sản phẩm được chia thành nhiều dịch vụ độc lập, giao tiếp với nhau qua bus thông điệp.

Ứng dụng đơn khối lớn cũng có thể được mô-đun hóa xoay quanh chức năng nghiệp vụ, dù đây không phải trường hợp phổ biến. Dĩ nhiên, chúng tôi khuyến khích các nhóm lớn xây dựng hệ thống đơn khối chia thành các nhóm nhỏ theo ngành nghiệp vụ. Vấn đề chính mà chúng tôi thấy là các nhóm thường được tổ chức quanh quá nhiều ngữ cảnh. Nếu một khối đơn lẻ vượt qua ranh giới mô-đun thì từng thành viên nhóm khó có thể ghi nhớ tất cả trong trí nhớ ngắn hạn. Ngoài ra, chúng tôi thấy dây chuyền mô-đun hóa đòi hỏi rất nhiều quy tắc để thực thi. Sự phân tách rõ ràng hơn mà các thành phần dịch vụ yêu cầu giúp duy trì ranh giới giữa các nhóm dễ dàng hơn.

### Sản phẩm, không phải dự án

Phần lớn công việc phát triển ứng dụng mà chúng tôi thấy được thực hiện theo mô hình dự án: mục tiêu là bàn giao một phần mềm, rồi công việc kết thúc. Sau khi hoàn tất, phần mềm được bàn giao cho tổ chức bảo trì và nhóm dự án xây dựng nó cũng giải tán.

Những người ủng hộ microservice thường tránh mô hình này và cho rằng nhóm nên chịu trách nhiệm về toàn bộ vòng đời của sản phẩm. Một ý tưởng thường được nhắc đến là khái niệm [“bạn xây dựng, bạn vận hành”](https://queue.acm.org/detail.cfm?id=1142065) của Amazon: nhóm phát triển chịu toàn bộ trách nhiệm với phần mềm trong môi trường production. Nhờ vậy, nhà phát triển thường xuyên thấy phần mềm của họ hoạt động ra sao trong production và gắn kết hơn với người dùng, vì họ phải đảm nhận ít nhất một phần công việc hỗ trợ.

Tư duy sản phẩm gắn chặt với năng lực nghiệp vụ. Cần tập trung liên tục vào cách phần mềm giúp người dùng cải thiện năng lực nghiệp vụ, thay vì xem phần mềm như một tập hợp chức năng cần hoàn thành.

Không có lý do gì khiến cách tiếp cận này không thể dùng cho ứng dụng đơn lẻ, nhưng kích thước dịch vụ nhỏ hơn giúp tạo mối liên hệ cá nhân giữa nhà phát triển dịch vụ và người dùng dễ dàng hơn.

### Endpoint thông minh và đường ống đơn giản

Khi thiết lập giao tiếp giữa các tiến trình khác nhau, chúng tôi đã thấy nhiều sản phẩm và phương pháp nhấn mạnh việc đưa nhiều tính năng thông minh vào chính cơ chế giao tiếp. Một ví dụ điển hình là Enterprise Service Bus (ESB); các sản phẩm ESB thường có những công cụ phức tạp để định tuyến thông điệp, điều phối, chuyển đổi và áp dụng quy tắc nghiệp vụ.

Cộng đồng microservice thường chọn một cách tiếp cận khác: endpoint thông minh và đường ống đơn giản. Mục tiêu của ứng dụng xây dựng bằng microservice là liên kết lỏng nhất có thể và gắn kết cao nhất có thể — mỗi dịch vụ có logic miền riêng, hành vi giống các bộ lọc theo tư tưởng Unix cổ điển: nhận yêu cầu, áp dụng logic phù hợp và tạo phản hồi. Dùng giao thức đơn giản theo phong cách REST để điều phối chúng, thay vì giao thức phức tạp như WS-Choreography hoặc BPEL, hay điều phối thông qua một công cụ trung tâm.

Hai giao thức được dùng phổ biến nhất là yêu cầu-phản hồi HTTP với API tài nguyên và truyền thông điệp nhẹ[8]. Cách diễn đạt hay nhất cho giao thức thứ nhất là:

> Là chính web, chứ không ẩn sau web.<br> —[Ian Robinson](http://www.amazon.com/gp/product/0596805829?ie=UTF8&tag=martinfowlerc-20&linkCode=as2&camp=1789&creative=9325&creativeASIN=0596805829)

Các quy tắc và giao thức mà nhóm microservice sử dụng chính là những quy tắc và giao thức tạo nên World Wide Web (và ở mức độ rộng hơn là Unix). Từ góc nhìn của nhà phát triển và nhân viên vận hành, tài nguyên được dùng phổ biến thường có thể dễ dàng cache.

Cách phổ biến thứ hai là truyền thông điệp qua bus thông điệp nhẹ. Hạ tầng được chọn thường là hạ tầng “đơn giản” (ở đây đơn giản có nghĩa là chỉ làm nhiệm vụ định tuyến thông điệp) — một triển khai đơn giản như RabbitMQ hoặc ZeroMQ chỉ cung cấp cấu trúc trao đổi bất đồng bộ đáng tin cậy. Các tính năng thông minh vẫn nằm trong dịch vụ, tại từng endpoint tạo và tiêu thụ nhiều thông điệp.

Trong ứng dụng đơn khối, các thành phần chạy trong cùng tiến trình và giao tiếp bằng lời gọi phương thức hoặc hàm. Vấn đề lớn nhất khi chuyển đơn khối thành microservice là thay đổi mô hình giao tiếp. Một cách chuyển đổi ngây thơ là đổi lời gọi phương thức trong bộ nhớ thành RPC; kết quả là giao tiếp thường xuyên và hiệu năng kém. Thay vào đó, cần dùng giao tiếp hạt lớn để thay cho giao tiếp hạt mịn.

### Quản trị phi tập trung

Một hệ quả của quản trị tập trung là xu hướng chuẩn hóa một nền tảng công nghệ duy nhất. Kinh nghiệm cho thấy cách này đang thu hẹp lựa chọn — không phải vấn đề nào cũng là đinh, và không phải công cụ nào cũng là búa. Chúng tôi thích dùng đúng công cụ cho công việc; ở một mức độ nào đó, ứng dụng đơn khối ít khi có thể tận dụng ưu điểm của nhiều ngôn ngữ.

Tách các thành phần của đơn khối thành dịch vụ cho phép mỗi dịch vụ tự chọn cách xây dựng. Muốn dùng Node.js để phát triển một trang báo cáo đơn giản ư? Cứ làm đi. Muốn dùng C++ để triển khai một thành phần gần thời gian thực, đặc biệt tinh gọn ư? Tuyệt. Muốn chuyển sang một kiểu cơ sở dữ liệu khác phù hợp hơn với thao tác đọc dữ liệu của thành phần ư? Chúng ta có công nghệ để tái xây dựng nó.

Dĩ nhiên, bạn có thể làm điều gì đó không có nghĩa là bạn nên làm — nhưng việc chia hệ thống theo cách này đem lại lựa chọn.

Khi xây dựng microservice, các nhóm cũng thích có nhiều cách khác nhau để đạt mục tiêu. Họ thích ý tưởng tạo ra công cụ hữu ích hơn là viết tiêu chuẩn trên giấy, để nhà phát triển khác có thể dùng các công cụ đó giải quyết vấn đề tương tự. Đôi khi những công cụ này được chia sẻ với cộng đồng rộng hơn sau khi tích lũy kinh nghiệm triển khai, nhưng không nhất thiết hoàn toàn theo mô hình mã nguồn mở nội bộ. Giờ đây git và github đã trở thành lựa chọn thực tế cho hệ thống quản lý phiên bản, việc mở mã nguồn nội bộ cũng ngày càng phổ biến.

Netflix là một ví dụ điển hình tuân theo tư tưởng này. Cụ thể, chia sẻ mã đã được kiểm chứng qua thực tế dưới dạng thư viện hữu ích khuyến khích các nhà phát triển khác giải quyết vấn đề tương tự theo cách tương tự, đồng thời vẫn mở đường cho các phương pháp khác nhau. Thư viện dùng chung thường tập trung vào các vấn đề phổ biến như lưu trữ dữ liệu, giao tiếp giữa các tiến trình và tự động hóa hạ tầng — nội dung chúng ta sẽ thảo luận sâu hơn tiếp theo.

Cộng đồng microservice đặc biệt không thích chi phí quản trị. Điều này không có nghĩa cộng đồng không coi trọng hợp đồng dịch vụ. Ngược lại, họ có nhiều hợp đồng hơn. Chỉ là họ tìm những cách khác để quản lý các hợp đồng này. Các mẫu như [Tolerant Reader](https://martinfowler.com/bliki/TolerantReader.html) và [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html) thường được dùng trong microservice. Những mẫu này hỗ trợ hợp đồng dịch vụ phát triển độc lập. Thực thi hợp đồng hướng người tiêu dùng như một phần của quá trình build giúp tăng độ tin cậy và cung cấp phản hồi nhanh hơn về việc dịch vụ có hoạt động hay không. Thực tế, chúng tôi biết một nhóm ở Australia dùng mẫu hợp đồng hướng người tiêu dùng để thúc đẩy xây dựng nghiệp vụ mới. Họ dùng công cụ đơn giản để định nghĩa hợp đồng dịch vụ. Hợp đồng trở thành một phần của quy trình build tự động, ngay cả khi mã của dịch vụ mới chưa được viết. Dịch vụ chỉ được tạo ra khi đáp ứng hợp đồng — đây là cách tinh tế để tránh tình huống “YAGNI”[9] khi xây dựng phần mềm mới. Các kỹ thuật và công cụ phát triển quanh cách này giảm sự phụ thuộc tạm thời giữa các dịch vụ, hạn chế nhu cầu quản lý hợp đồng tập trung.

Có lẽ đỉnh cao của quản trị phi tập trung là ý tưởng build it/run it nổi tiếng của Amazon. Nhóm phải chịu trách nhiệm về mọi khía cạnh của phần mềm mình xây dựng, bao gồm vận hành 24/7. Mức phân quyền trách nhiệm này chắc chắn không theo thông lệ, nhưng chúng tôi thấy ngày càng nhiều công ty giao thêm trách nhiệm cho nhóm phát triển. Netflix là một công ty khác áp dụng ý tưởng này[11]. Bị máy nhắn tin đánh thức lúc 3 giờ sáng chắc chắn tạo động lực mạnh để chú ý đến chất lượng khi viết mã. Đây là một số suy nghĩ về việc rời xa mô hình quản trị tập trung truyền thống hết mức có thể.

### Quản lý dữ liệu phi tập trung

Quản lý dữ liệu phi tập trung thể hiện theo nhiều cách khác nhau. Ở mức trừu tượng nhất, nó có nghĩa là các hệ thống có thể có những mô hình khái niệm khác nhau về thế giới. Khi tích hợp một doanh nghiệp lớn, góc nhìn khách hàng của bộ phận bán hàng sẽ khác góc nhìn hỗ trợ; đây là vấn đề phổ biến. Một số khía cạnh có trong góc nhìn bán hàng có thể không xuất hiện trong góc nhìn hỗ trợ. Hai góc nhìn có thể thực sự có các thuộc tính khác nhau và (tệ hơn) các thuộc tính chung nhưng có ý nghĩa hơi khác nhau.

Vấn đề này thường thấy giữa các ứng dụng, nhưng cũng có thể xảy ra bên trong một ứng dụng, đặc biệt khi ứng dụng được chia thành các thành phần riêng biệt. Một cách suy nghĩ hữu ích là khái niệm Thiết kế hướng miền (Domain-Driven Design, DDD) về [bounded context](http://martinfowler.com/bliki/BoundedContext.html) (ngữ cảnh được giới hạn). DDD chia miền phức tạp thành nhiều ngữ cảnh được giới hạn và lập bản đồ quan hệ giữa chúng. Quy trình này hữu ích cho cả kiến trúc đơn khối lẫn microservice, nhưng ranh giới dịch vụ có mối liên hệ tự nhiên với ranh giới ngữ cảnh; điều đó giúp làm rõ và tăng cường sự tách biệt như đã mô tả trong phần năng lực nghiệp vụ.

Cũng như việc phi tập trung hóa quyết định về mô hình khái niệm, microservice phi tập trung hóa quyết định lưu trữ dữ liệu. Trong khi ứng dụng đơn khối thường thích một cơ sở dữ liệu logic duy nhất để lưu trữ bền vững, doanh nghiệp thường muốn nhiều ứng dụng cùng dùng một cơ sở dữ liệu chung — các quyết định này bị chi phối bởi mô hình cấp phép thương mại của nhà cung cấp. Microservice thiên về để mỗi dịch vụ quản lý cơ sở dữ liệu riêng, có thể là instance riêng của cùng một công nghệ cơ sở dữ liệu hoặc một hệ thống cơ sở dữ liệu hoàn toàn khác — đây được gọi là [polyglot persistence](https://martinfowler.com/bliki/PolyglotPersistence.html) (lưu trữ đa mô hình). Có thể dùng lưu trữ đa mô hình trong ứng dụng đơn khối, nhưng cách này thường thấy hơn trong ứng dụng chia thành dịch vụ.

![decentralised-data](./images/decentralised-data.png)

Việc phân tán trách nhiệm đối với dữ liệu giữa các microservice ảnh hưởng đến cách quản lý cập nhật. Phương pháp phổ biến để xử lý cập nhật là dùng giao dịch nhằm bảo đảm nhất quán khi cập nhật nhiều tài nguyên. Phương pháp này thường được dùng trong đơn khối.

Dùng giao dịch theo cách này giúp duy trì tính nhất quán nhưng tạo ra sự liên kết tạm thời đáng kể, điều này gây vấn đề khi trải rộng qua nhiều dịch vụ. Giao dịch phân tán nổi tiếng là khó triển khai, vì vậy kiến trúc microservice nhấn mạnh [phối hợp giữa dịch vụ mà không dùng giao dịch](http://www.eaipatterns.com/ramblings/18_starbucks.html), chấp nhận rằng tính nhất quán có thể chỉ đạt được cuối cùng và cần nhận thức rõ về cách xử lý vấn đề bằng thao tác bù trừ.

Với nhiều nhóm phát triển, lựa chọn quản lý sự không nhất quán theo cách này là thách thức mới, nhưng thường phù hợp với thực tiễn nghiệp vụ. Nghiệp vụ thường chấp nhận một mức độ không nhất quán nhất định để phản hồi yêu cầu nhanh hơn, đồng thời có một số loại quy trình đảo ngược để xử lý lỗi. Sự đánh đổi này đáng giá miễn là chi phí sửa lỗi thấp hơn chi phí mất nghiệp vụ nếu đòi hỏi tính nhất quán cao hơn.

### Tự động hóa hạ tầng

Công nghệ tự động hóa hạ tầng đã thay đổi đáng kể trong vài năm qua — đặc biệt là sự phát triển của cloud và AWS giúp giảm độ phức tạp vận hành khi xây dựng, triển khai và chạy microservice.

Nhiều sản phẩm hoặc hệ thống được xây dựng bằng microservice là kết quả của các nhóm có nhiều kinh nghiệm về phân phối liên tục và tích hợp liên tục. Các nhóm xây dựng phần mềm theo cách này sử dụng rộng rãi công nghệ tự động hóa hạ tầng, như pipeline xây dựng được minh họa dưới đây.

![basic-pipeline](./images/basic-pipeline.png)

Vì đây không phải bài viết về phân phối liên tục, ở đây chúng tôi chỉ tập trung vào một vài đặc điểm chính của nó. Chúng tôi muốn có độ tin cậy cao nhất có thể rằng phần mềm hoạt động bình thường, vì vậy thực hiện nhiều **kiểm thử tự động**. Muốn phần mềm đạt trạng thái “Promotion” để được “đẩy lên” pipeline nghĩa là phần mềm phải được **triển khai tự động** trong từng môi trường mới.

Ứng dụng đơn khối có thể dễ dàng đi qua các môi trường này để xây dựng, kiểm thử và phát hành. Thực tế cho thấy một khi đã đầu tư tự động hóa quy trình sản xuất tổng thể cho đơn khối thì việc triển khai thêm ứng dụng dường như không đáng sợ nữa. Hãy nhớ rằng một mục tiêu của phân phối liên tục là làm cho công việc “triển khai” trở nên “nhàm chán”; vì vậy, dù có một hay ba ứng dụng, miễn là triển khai vẫn “nhàm chán” thì không có gì đáng lo[12].

Một lĩnh vực khác mà chúng tôi thấy các nhóm đầu tư nhiều vào tự động hóa hạ tầng là quản lý microservice trong môi trường production. So với nhận định ở trên (miễn triển khai nhàm chán) thì đơn khối và microservice không khác nhau nhiều, nhưng môi trường chạy của từng lần triển khai có thể rất khác nhau.

![micro-deployment](./images/micro-deployment.png)

### Thiết kế để sẵn sàng cho lỗi

Dùng dịch vụ làm thành phần kéo theo yêu cầu phải thiết kế ứng dụng để chịu được lỗi dịch vụ. Nếu nhà cung cấp dịch vụ không khả dụng thì mọi lời gọi dịch vụ đều có thể thất bại; bên gọi phải phản hồi một cách uyển chuyển nhất có thể. So với thiết kế đơn khối, đây là một nhược điểm vì tạo thêm độ phức tạp để xử lý. Kết quả là nhóm microservice thường xuyên xem xét lỗi dịch vụ ảnh hưởng đến trải nghiệm người dùng như thế nào. [Simian Army](https://github.com/Netflix/SimianArmy) của Netflix có thể làm cho một dịch vụ, thậm chí cả trung tâm dữ liệu, gặp sự cố ngay trong ngày làm việc để kiểm tra khả năng phục hồi và giám sát của ứng dụng.

Hầu hết đội vận hành sẽ phấn khích đến run lên trước kiểu kiểm thử tự động trong production này, chẳng khác gì trước một kỳ nghỉ dài cuối tuần. Điều này không có nghĩa phong cách đơn khối không thể xây dựng hệ thống giám sát tiên tiến — chỉ là theo kinh nghiệm của chúng tôi, cách này không phổ biến ở hệ thống đơn khối.

Vì dịch vụ có thể gặp lỗi bất cứ lúc nào nên điều tối quan trọng là phát hiện lỗi nhanh chóng và tự động khôi phục dịch vụ khi có thể. Ứng dụng microservice đặc biệt chú trọng giám sát ứng dụng theo thời gian thực, chẳng hạn kiểm tra các yếu tố kiến trúc (cơ sở dữ liệu nhận bao nhiêu yêu cầu mỗi giây) và chỉ số liên quan đến nghiệp vụ (ví dụ mỗi phút nhận được bao nhiêu đơn hàng). Giám sát ngữ nghĩa có thể cung cấp cảnh báo sớm khi vấn đề xuất hiện để nhóm phát triển theo dõi và điều tra.

Điều này đặc biệt quan trọng với kiến trúc microservice vì cách tiếp cận ưu tiên điều phối và viết sự kiện có thể tạo ra những tình huống bất thường. Dù nhiều chuyên gia có thẩm quyền nhìn nhận tích cực về giá trị của hành vi phát sinh, thực tế “hành vi phát sinh” đôi khi cũng có thể là điều xấu. Giám sát rất quan trọng để nhanh chóng phát hiện hành vi phát sinh không mong muốn và khắc phục.

Hệ thống đơn khối cũng có thể triển khai giám sát minh bạch như microservice — trên thực tế, chúng cũng nên làm như vậy. Khác biệt là cần biết khi nào các dịch vụ chạy ở những tiến trình khác nhau bị mất kết nối; tính minh bạch này ít hữu ích hơn với các thư viện trong cùng một tiến trình.

Nhóm microservice muốn thấy giám sát và ghi log phức tạp cho từng dịch vụ, chẳng hạn dashboard hiển thị trạng thái “đang chạy/dừng” cùng nhiều chỉ số vận hành và nghiệp vụ. Thông tin chi tiết về trạng thái circuit breaker, thông lượng hiện tại và độ trễ cũng là những ví dụ chúng tôi thường gặp trong công việc.

### Thiết kế tiến hóa

Người làm microservice thường có nền tảng về thiết kế tiến hóa và xem việc chia dịch vụ là một công cụ bổ sung giúp nhà phát triển kiểm soát thay đổi trong ứng dụng mà không làm chậm tốc độ thay đổi. Kiểm soát thay đổi không nhất thiết có nghĩa là giảm thay đổi — với thái độ và công cụ phù hợp, có thể thực hiện thay đổi phần mềm thường xuyên, nhanh chóng và được kiểm soát tốt.

Mỗi khi tìm cách chia hệ thống phần mềm thành các thành phần, bạn phải quyết định cách chia — nguyên tắc nào dùng để phân tách ứng dụng? Đặc tính then chốt của thành phần là khả năng thay thế và nâng cấp độc lập[13]; điều đó có nghĩa là chúng ta tìm các điểm mà ta có thể tưởng tượng việc viết lại thành phần mà không ảnh hưởng đến các thành phần cộng tác với nó. Trên thực tế, nhiều nhóm microservice còn đi xa hơn khi chủ động kỳ vọng nhiều dịch vụ sẽ bị loại bỏ thay vì phát triển lâu dài.

Trang web Guardian là một ví dụ tốt về ứng dụng được thiết kế và xây dựng dưới dạng đơn khối nhưng vẫn tiến hóa theo hướng microservice. Hệ thống đơn khối ban đầu vẫn là lõi của trang web, nhưng họ thích thêm chức năng mới bằng cách xây dựng một số API microservice. Cách này đặc biệt thuận tiện với chức năng chỉ tồn tại tạm thời, chẳng hạn trang riêng về một sự kiện thể thao. Phần này của trang web có thể được kết hợp nhanh bằng ngôn ngữ phát triển nhanh và bị xóa ngay khi sự kiện kết thúc. Chúng tôi từng thấy cách tiếp cận tương tự tại các tổ chức tài chính: thêm dịch vụ mới để nắm bắt cơ hội thị trường rồi loại bỏ sau vài tháng hoặc thậm chí vài tuần.

Sự nhấn mạnh vào khả năng thay thế này là trường hợp cụ thể của nguyên tắc thiết kế mô-đun tổng quát: hiện thực hóa mô-đun hóa dựa trên mô hình thay đổi[14]. Mọi người đều muốn đặt những thứ thay đổi cùng lúc vào một mô-đun; mô-đun hệ thống ít thay đổi nên tách khỏi phần đang thay đổi nhiều. Nếu liên tục phải thay đổi hai dịch vụ cùng nhau thì đó là dấu hiệu cho thấy nên hợp nhất chúng.

Đưa các thành phần vào dịch vụ tạo cơ hội cho kế hoạch phát hành chi tiết hơn. Với đơn khối, mọi thay đổi đều cần xây dựng và triển khai lại toàn bộ ứng dụng. Còn với microservice, chỉ cần triển khai lại dịch vụ đã sửa đổi. Điều này giúp đơn giản hóa và tăng tốc quá trình phát hành. Nhược điểm là cần lo rằng thay đổi ở một dịch vụ có thể làm hỏng bên tiêu thụ dịch vụ đó. Cách tích hợp truyền thống là dùng quản lý phiên bản để giải quyết vấn đề, nhưng trong thế giới microservice, xu hướng là chỉ dùng quản lý phiên bản như biện pháp cuối cùng. Có thể tránh nhiều phiên bản bằng cách thiết kế dịch vụ sao cho dung nạp được thay đổi từ nhà cung cấp dịch vụ nhiều nhất có thể.

## Microservice có phải tương lai không?

Mục đích chính khi viết bài này là giải thích những ý tưởng và nguyên tắc chính của microservice. Khi dành thời gian thực hiện việc đó, chúng tôi nhận thấy rõ phong cách kiến trúc microservice là một ý tưởng quan trọng — đáng được cân nhắc nghiêm túc khi phát triển hệ thống doanh nghiệp. Gần đây chúng tôi dùng cách này để xây dựng một số hệ thống và biết rằng các nhóm khác cũng ủng hộ phong cách này.

Chúng tôi biết đến những người tiên phong đã góp phần tạo nên phong cách kiến trúc này, bao gồm Amazon, Netflix, báo Guardian của Anh, Trung tâm Dịch vụ Số của Chính phủ Anh, realestate.com.au, Forward và comparethemarket.com. Các hội nghị công nghệ năm 2013 tràn ngập ví dụ về những công ty đang chuyển sang mô hình có thể được xem là microservice, trong đó có Travis CI. Ngoài ra, nhiều tổ chức đã làm những việc mà chúng tôi gọi là microservice từ lâu nhưng không dùng tên gọi này. (Thông thường cách làm đó được gắn nhãn SOA — dù như đã nói, SOA có nhiều hình thức mâu thuẫn lẫn nhau.[15])

Tuy nhiên, dù có những trải nghiệm tích cực này, chúng tôi không khẳng định microservice chắc chắn là hướng phát triển tương lai của kiến trúc phần mềm. Dù trải nghiệm của chúng tôi đến nay tích cực hơn so với ứng dụng tổng thể, chúng tôi nhận thức rằng chưa có đủ thời gian để đưa ra đánh giá đầy đủ và toàn diện.

Thông thường, tác động thực sự của quyết định kiến trúc chỉ bộc lộ sau vài năm. Chúng tôi từng thấy một số dự án do các nhóm giỏi thực hiện với mong muốn mạnh mẽ về mô-đun hóa, nhưng cuối cùng vẫn tạo thành kiến trúc đơn khối và tiếp tục xuống cấp trong vài năm. Nhiều người cho rằng microservice ít có khả năng xuống cấp như vậy vì ranh giới dịch vụ rõ ràng và khó bị tùy tiện phá vỡ. Tuy nhiên, nếu không chứng kiến đủ nhiều hệ thống phát triển trong thời gian dài, chúng tôi không thể thực sự đánh giá kiến trúc microservice trưởng thành ra sao.

Có lý do khiến một số người cho rằng microservice có thể khó trưởng thành. Thành công của bất kỳ công việc thành phần hóa nào đều phụ thuộc vào mức độ phù hợp giữa phần mềm và thành phần. Xác định chính xác ranh giới của một thành phần nên nằm ở đâu là việc khó. Thiết kế tiến hóa thừa nhận việc định vị ranh giới chính xác là khó, nên tập trung làm cho ranh giới dễ tái cấu trúc. Nhưng khi các thành phần trở thành dịch vụ giao tiếp từ xa, tái cấu trúc khó hơn nhiều so với lời gọi giữa các thư viện phần mềm trong cùng một tiến trình. Di chuyển mã qua ranh giới dịch vụ trở nên khó khăn. Mọi thay đổi giao diện cần được phối hợp giữa các bên tham gia. Cần bổ sung các tầng tương thích ngược. Việc kiểm thử cũng phức tạp hơn.

Một vấn đề khác là nếu các thành phần không kết hợp gọn gàng thành một hệ thống thì toàn bộ công việc chỉ chuyển độ phức tạp bên trong thành phần sang kết nối giữa các thành phần. Hậu quả không chỉ là chuyển vị trí của độ phức tạp; nó còn đẩy độ phức tạp sang các ranh giới không còn tường minh và khó kiểm soát. Khi quan sát một thành phần nhỏ, đơn giản, người ta dễ nghĩ rằng mọi thứ đã tốt hơn, nhưng lại bỏ qua các kết nối lộn xộn giữa các dịch vụ.

Cuối cùng là yếu tố kỹ năng của nhóm. Công nghệ mới thường được các nhóm có chuyên môn kỹ thuật cao hơn áp dụng. Một công nghệ hiệu quả hơn với nhóm rất giỏi chưa chắc phù hợp với nhóm có kỹ năng thấp hơn một chút. Chúng tôi đã thấy nhiều trường hợp nhóm có kỹ năng thấp hơn tạo ra kiến trúc đơn khối lộn xộn. Điều gì xảy ra khi sự lộn xộn đó nằm trong microservice? Cần thời gian để quan sát. Một nhóm yếu sẽ luôn xây dựng một hệ thống yếu — trong trường hợp này, khó có thể nói microservice giảm sự lộn xộn hay làm mọi thứ tệ hơn.

Một lập luận hợp lý mà chúng tôi nghe được là không nên bắt đầu bằng kiến trúc microservice; thay vào đó, hãy bắt đầu với kiến trúc tổng thể, giữ các mô-đun hóa và chỉ tách thành microservice khi khối tổng thể gặp vấn đề. (Lời khuyên này chưa lý tưởng vì giao diện trong tiến trình tốt thường không phải giao diện dịch vụ tốt.)

Vì vậy, chúng tôi viết bài này với sự lạc quan thận trọng. Đến nay đã thấy đủ nhiều phong cách microservice để cho rằng đây có thể là một con đường đáng theo đuổi. Chúng tôi không biết cuối cùng sẽ đi đến đâu, nhưng một trong những thách thức của phát triển phần mềm là phải đưa ra quyết định dựa trên thông tin chưa hoàn hảo mà mình hiện có.

## Chú thích

1: Thuật ngữ “microservice” được thảo luận tại một hội thảo dành cho kiến trúc sư phần mềm gần Venice vào tháng 5 năm 2011 để mô tả một phong cách kiến trúc chung mà những người tham dự gần đây đang tìm hiểu. Tháng 5 năm 2012, cùng nhóm này quyết định “microservices” là tên gọi phù hợp nhất. James trình bày một số ý tưởng này dưới dạng nghiên cứu tình huống vào tháng 3 năm 2012 tại hội nghị 33rd Degree ở Krakow trong bài [Microservices - Java, the Unix Way](http://2012.33degree.org/talk/show/67), Fred George cũng trình bày vào [khoảng thời gian đó](http://www.slideshare.net/fredgeorge/micro-service-architecure). Adrian Cockcroft tại Netflix mô tả cách tiếp cận này là “SOA hạt mịn” và tiên phong áp dụng phong cách này ở quy mô web, cùng nhiều người khác được nhắc đến trong bài — Joe Walnes, Dan North, Evan Botcher và Graham Tackley.

2: Cộng đồng Unix đã dùng thuật ngữ monolith từ lâu. Thuật ngữ này xuất hiện trong [The Art of Unix Programming](https://www.amazon.com/gp/product/B003U2T5BA?ie=UTF8&tag=martinfowlerc-20&linkCode=as2&camp=1789&creative=9325&creativeASIN=B003U2T5BA) để mô tả các hệ thống phát triển quá lớn.

3: Nhiều nhà thiết kế hướng đối tượng, trong đó có chúng tôi, dùng thuật ngữ service object theo nghĩa trong [Domain-Driven Design](https://www.amazon.com/gp/product/0321125215?ie=UTF8&tag=martinfowlerc-20&linkCode=as2&camp=1789&creative=9325&creativeASIN=0321125215) để chỉ đối tượng thực hiện một quy trình quan trọng không gắn với một thực thể. Khái niệm này khác với cách dùng “service” trong bài viết. Đáng tiếc, service có cả hai nghĩa và chúng ta phải chấp nhận hiện tượng đa nghĩa đó.

4: Chúng tôi xem [ứng dụng là một cấu trúc xã hội](https://martinfowler.com/bliki/ApplicationBoundary.html), kết hợp một cơ sở mã, một nhóm chức năng và một nguồn kinh phí.

5: Có thể tìm bài viết gốc trên trang của Melvyn Conway [tại đây](http://www.melconway.com/Home/Committees_Paper.html).

6: Chúng tôi không thể không nhắc đến câu nói của Jim Webber rằng ESB là viết tắt của [“Egregious Spaghetti Box”](http://www.infoq.com/presentations/soa-without-esb).

7: Netflix nói rõ mối liên hệ này — cho đến gần đây họ còn gọi phong cách kiến trúc của mình là SOA hạt mịn.

8: Khi quy mô đạt cực lớn, các tổ chức thường chuyển sang giao thức nhị phân — chẳng hạn [protobufs](https://code.google.com/p/protobuf/). Hệ thống dùng các giao thức này vẫn có đặc điểm endpoint thông minh, đường ống đơn giản — và đánh đổi tính minh bạch để lấy khả năng mở rộng. Phần lớn website và chắc chắn đại đa số doanh nghiệp không cần đánh đổi này; tính minh bạch có thể mang lại lợi ích lớn.

9: “YAGNI” hay “You Aren't Going To Need It” (Bạn sẽ không cần đến nó) là một [nguyên tắc XP](http://c2.com/cgi/wiki?YouArentGonnaNeedIt), khuyên không thêm chức năng cho đến khi biết chắc mình cần chúng.

10: Thật không hoàn toàn trung thực nếu chúng tôi nói đơn khối chỉ dùng một ngôn ngữ — để xây dựng hệ thống cho web ngày nay, có lẽ bạn cần biết JavaScript và XHTML, CSS, ngôn ngữ phía máy chủ mà bạn chọn, SQL và một phương ngữ ORM. Khó có thể gọi là một ngôn ngữ duy nhất, nhưng bạn hiểu ý chúng tôi.

11: Adrian Cockcroft đặc biệt nhắc đến “developer self-service” và “Developers run what they wrote” (sic) trong [bài thuyết trình xuất sắc này](http://www.slideshare.net/adrianco/flowcon-added-to-for-cmg-keynote-talk-on-how-speed-wins-and-how-netflix-is-doing-continuous-delivery) tại Flowcon vào tháng 11 năm 2013.

12: Chúng tôi không hoàn toàn trung thực ở đây. Rõ ràng triển khai nhiều dịch vụ với cấu trúc liên kết phức tạp hơn khó hơn triển khai một đơn khối. May mắn là các mẫu thiết kế giúp giảm độ phức tạp này — dù vẫn phải đầu tư vào công cụ.

13: Thực tế, Dan North gọi phong cách này là _Replaceable Component Architecture_ (Kiến trúc Thành phần Có thể Thay thế) thay vì microservices. Vì tên này chỉ nói đến một phần các đặc điểm nên chúng tôi thích dùng tên gọi sau hơn.

14: Kent Beck nêu đây là một trong những nguyên tắc thiết kế của ông trong [Implementation Patterns](https://www.amazon.com/gp/product/0321413091?ie=UTF8&tag=martinfowlerc-20&linkCode=as2&camp=1789&creative=9325&creativeASIN=0321413091).

15: Và SOA khó có thể là gốc rễ duy nhất của lịch sử này. Tôi nhớ khi thuật ngữ SOA xuất hiện vào đầu thế kỷ này, mọi người đã nói “chúng tôi làm việc này nhiều năm rồi”. Một lập luận cho rằng phong cách này bắt nguồn từ cách các chương trình COBOL giao tiếp qua tệp dữ liệu trong những ngày đầu của điện toán doanh nghiệp. Theo hướng khác, có thể lập luận rằng microservice cũng giống mô hình lập trình Erlang, nhưng được áp dụng vào bối cảnh ứng dụng doanh nghiệp.
