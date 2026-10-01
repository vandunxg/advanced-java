# Quản lý dữ liệu hướng sự kiện cho microservice

## 1.1 Microservice và vấn đề quản lý dữ liệu phân tán

Ứng dụng đơn khối thường có một cơ sở dữ liệu quan hệ, nhờ đó ứng dụng có thể dùng giao dịch ACID với một số đặc tính quan trọng:

1. Tính nguyên tử – mọi thay đổi đều có tính nguyên tử;
2. Tính nhất quán – trạng thái cơ sở dữ liệu luôn nhất quán;
3. Tính cô lập – dù giao dịch chạy đồng thời, kết quả vẫn giống như chạy tuần tự;
4. Tính bền vững – khi giao dịch đã commit thì không thể rollback.

Nhờ những đặc tính trên, có thể đơn giản hóa ứng dụng như sau: bắt đầu một giao dịch, thay đổi (chèn, xóa, cập nhật) nhiều hàng rồi commit giao dịch.

Một lợi ích khác của cơ sở dữ liệu quan hệ là hỗ trợ SQL (ngôn ngữ truy vấn mạnh, khai báo và dựa trên phép biến đổi bảng). Người dùng có thể dễ dàng kết hợp dữ liệu từ nhiều bảng bằng truy vấn; bộ lập lịch truy vấn RDBMS sẽ quyết định cách triển khai tối ưu. Người dùng không cần lo về các vấn đề tầng thấp như cách truy cập cơ sở dữ liệu. Ngoài ra, vì toàn bộ dữ liệu ứng dụng nằm trong một cơ sở dữ liệu nên rất dễ truy vấn.

Tuy nhiên, với kiến trúc microservice, việc truy cập dữ liệu trở nên phức tạp vì dữ liệu thuộc quyền riêng của từng microservice và chỉ có thể truy cập thông qua API. Đóng gói quyền truy cập dữ liệu theo cách này giúp các microservice liên kết lỏng và độc lập với nhau. Nếu nhiều dịch vụ cùng truy cập một dữ liệu thì schema sẽ ghi nhận thời gian truy cập và cần được phối hợp giữa tất cả các dịch vụ.

Hơn nữa, các microservice khác nhau thường dùng cơ sở dữ liệu khác nhau. Ứng dụng có thể tạo ra nhiều loại dữ liệu khác nhau; cơ sở dữ liệu quan hệ không phải lúc nào cũng là lựa chọn tốt nhất. Trong một số trường hợp, cơ sở dữ liệu NoSQL có thể cung cấp mô hình dữ liệu tiện dụng hơn, hiệu năng và khả năng mở rộng tốt hơn. Ví dụ, ứng dụng tạo và truy vấn chuỗi có thể dùng công cụ tìm kiếm ký tự như Elasticsearch. Tương tự, ứng dụng tạo dữ liệu đồ thị xã hội có thể dùng cơ sở dữ liệu đồ thị như Neo4j. Vì vậy, ứng dụng dựa trên microservice thường kết hợp cơ sở dữ liệu SQL và NoSQL; phương pháp này được gọi là polyglot persistence.

Kiến trúc phân vùng và polyglot persistence có nhiều lợi ích khi lưu trữ dữ liệu, bao gồm liên kết lỏng giữa các dịch vụ, hiệu năng và khả năng mở rộng tốt hơn. Tuy nhiên, chúng cũng tạo ra những thách thức trong quản lý dữ liệu phân tán.

Thách thức thứ nhất là làm thế nào hoàn thành một giao dịch đồng thời duy trì tính nhất quán dữ liệu giữa nhiều dịch vụ. Lấy một cửa hàng B2B trực tuyến làm ví dụ. Dịch vụ khách hàng quản lý nhiều thông tin của khách hàng, chẳng hạn hạn mức tín dụng. Dịch vụ đơn hàng quản lý đơn hàng và cần xác thực rằng đơn hàng mới không vượt quá hạn mức tín dụng của khách hàng. Trong ứng dụng đơn khối, dịch vụ đơn hàng chỉ cần dùng giao dịch ACID để kiểm tra tín dụng khả dụng và tạo đơn hàng.

Ngược lại, trong kiến trúc microservice, bảng đơn hàng và bảng khách hàng lần lượt là bảng riêng của dịch vụ tương ứng, như hình dưới đây:

![service table](../../micro-services/images/Private-table-of-the-corresponding-service.png)

Dịch vụ đơn hàng không thể truy cập trực tiếp bảng khách hàng, chỉ có thể truy cập thông qua API do dịch vụ khách hàng cung cấp. Dịch vụ đơn hàng cũng có thể dùng giao dịch phân tán, tức cơ chế commit hai giai đoạn (2PC) quen thuộc. Tuy nhiên, 2PC hiện không phải lựa chọn phù hợp cho ứng dụng. Theo lý thuyết CAP, cần lựa chọn giữa tính sẵn sàng (availability) và tính nhất quán ACID (consistency); thông thường tính sẵn sàng là lựa chọn tốt hơn. Nhưng nhiều công nghệ hiện đại, chẳng hạn nhiều cơ sở dữ liệu NoSQL, không hỗ trợ 2PC. Duy trì tính nhất quán dữ liệu giữa dịch vụ và cơ sở dữ liệu là yêu cầu căn bản nên cần tìm giải pháp khác.

Thách thức thứ hai là làm thế nào tìm kiếm dữ liệu từ nhiều dịch vụ. Ví dụ, hãy tưởng tượng ứng dụng cần hiển thị khách hàng và đơn hàng của họ. Nếu dịch vụ đơn hàng cung cấp API nhận thông tin đơn hàng của người dùng thì ứng dụng có thể kết hợp dữ liệu bằng thao tác join ở tầng ứng dụng. Ứng dụng lấy thông tin người dùng từ dịch vụ người dùng và đơn hàng của người dùng từ dịch vụ đơn hàng. Giả sử dịch vụ đơn hàng chỉ hỗ trợ truy vấn đơn hàng bằng khóa chính (có thể do nó dùng cơ sở dữ liệu NoSQL chỉ hỗ trợ tra cứu theo khóa chính), thì không có cách thích hợp nào để lấy dữ liệu cần thiết.

## 1.2 Kiến trúc hướng sự kiện

Với nhiều ứng dụng, giải pháp là dùng kiến trúc hướng sự kiện (event-driven architecture). Trong kiến trúc này, khi xảy ra một việc quan trọng, microservice sẽ phát một sự kiện, chẳng hạn cập nhật một thực thể nghiệp vụ. Khi microservice đăng ký các sự kiện nhận được một sự kiện, nó có thể cập nhật thực thể nghiệp vụ của mình và có thể phát sinh thêm sự kiện.

Có thể dùng sự kiện để triển khai giao dịch nghiệp vụ xuyên nhiều dịch vụ. Giao dịch thường gồm một chuỗi bước; mỗi bước do một microservice cập nhật thực thể nghiệp vụ và phát một sự kiện để kích hoạt bước tiếp theo. Hình dưới đây minh họa cách dùng hướng sự kiện để kiểm tra tín dụng khả dụng khi tạo đơn hàng; các microservice trao đổi sự kiện thông qua message broker.

1. Dịch vụ đơn hàng tạo một Order ở trạng thái NEW và phát sự kiện “Order Created Event” (Sự kiện tạo đơn hàng).

![Order-Created-Event](../../micro-services/images/Order-Created-Event.png)

2. Dịch vụ khách hàng tiêu thụ sự kiện Order Created Event, giữ chỗ tín dụng cho đơn hàng này rồi phát sự kiện “Credit Reserved Event” (Sự kiện giữ chỗ tín dụng).

![Credit-Reserved-Event](../../micro-services/images/Credit-Reserved-Event.png)

3. Dịch vụ đơn hàng tiêu thụ sự kiện Credit Reserved Event và đổi trạng thái đơn hàng thành OPEN.

![Status-is-OPEN](../../micro-services/images/Status-is-OPEN.png)

Trong tình huống phức tạp hơn có thể có thêm nhiều bước, chẳng hạn giữ chỗ tồn kho đồng thời với kiểm tra tín dụng khách hàng.

Căn cứ vào việc (a) mỗi dịch vụ cập nhật cơ sở dữ liệu của mình một cách nguyên tử và phát sự kiện, sau đó (b) message broker bảo đảm sự kiện được gửi ít nhất một lần, giao dịch nghiệp vụ có thể được thực hiện xuyên nhiều dịch vụ (giao dịch này không phải giao dịch ACID). Mô hình này cung cấp tính nhất quán yếu, chẳng hạn tính nhất quán cuối cùng (eventual consistency). Loại giao dịch này được gọi là mô hình BASE.

Cũng có thể dùng sự kiện để duy trì các materialized view chứa dữ liệu đã pre-join (pre-join) của nhiều microservice. Dịch vụ duy trì view này đăng ký các sự kiện liên quan rồi cập nhật view. Ví dụ, dịch vụ cập nhật view đơn hàng khách hàng (duy trì view đơn hàng của khách hàng) sẽ đăng ký sự kiện do dịch vụ khách hàng và dịch vụ đơn hàng phát ra.

![pre-join](../../micro-services/images/pre-join.png)

Khi dịch vụ cập nhật khung nhìn đơn hàng khách hàng nhận được sự kiện khách hàng hoặc đơn hàng, nó sẽ cập nhật tập dữ liệu khung nhìn đó. Có thể dùng cơ sở dữ liệu tài liệu như MongoDB để triển khai khung nhìn đơn hàng khách hàng, lưu một tài liệu cho mỗi người dùng. Dịch vụ truy vấn khung nhìn đơn hàng khách hàng chịu trách nhiệm trả lời truy vấn khách hàng và các đơn hàng gần đây (bằng cách truy vấn tập dữ liệu khung nhìn đơn hàng khách hàng).

Kiến trúc hướng sự kiện có cả ưu điểm lẫn nhược điểm. Kiến trúc này cho phép giao dịch trải dài qua nhiều dịch vụ và cung cấp tính nhất quán cuối cùng; đồng thời giúp ứng dụng duy trì một khung nhìn tổng hợp cuối cùng. Nhược điểm là mô hình lập trình phức tạp hơn mô hình giao dịch ACID: để khôi phục khi tầng ứng dụng thất bại, cần triển khai giao dịch bù trừ, chẳng hạn nếu kiểm tra tín dụng không thành công thì phải hủy đơn hàng. Ngoài ra, ứng dụng phải xử lý dữ liệu không nhất quán vì thay đổi do giao dịch đang chạy tạm thời (in-flight) có thể nhìn thấy được; dữ liệu cũng có thể không nhất quán khi ứng dụng đọc khung nhìn cuối cùng chưa được cập nhật. Một nhược điểm khác là bên đăng ký phải phát hiện và bỏ qua sự kiện dư thừa.

## 1.3 Thao tác nguyên tử (Achieving Atomicity)

Kiến trúc hướng sự kiện còn gặp vấn đề về tính nguyên tử giữa thao tác cập nhật cơ sở dữ liệu và phát sự kiện. Ví dụ, dịch vụ đơn hàng phải chèn một hàng vào bảng ORDER rồi phát sự kiện Order Created; hai thao tác này cần có tính nguyên tử. Nếu dịch vụ gặp sự cố sau khi cập nhật cơ sở dữ liệu nhưng trước khi phát sự kiện thì hệ thống sẽ ở trạng thái không nhất quán. Cách tiêu chuẩn để bảo đảm tính nguyên tử là dùng giao dịch phân tán gồm cơ sở dữ liệu và message broker. Tuy nhiên, theo lý thuyết CAP đã mô tả ở trên, đây không phải điều chúng ta muốn dùng.

### 1.3.1 Phát sự kiện bằng giao dịch cục bộ

Một cách đạt tính nguyên tử là dùng quy trình nhiều bước chỉ gồm các giao dịch cục bộ để phát sự kiện. Bí quyết là có một bảng EVENT, đóng vai trò danh sách thông điệp trong cơ sở dữ liệu lưu thực thể nghiệp vụ. Ứng dụng bắt đầu một giao dịch cơ sở dữ liệu (cục bộ), cập nhật trạng thái thực thể nghiệp vụ, chèn một sự kiện vào bảng EVENT rồi commit giao dịch đó. Một tiến trình hoặc luồng ứng dụng riêng sẽ truy vấn bảng EVENT, phát sự kiện đến message broker, sau đó dùng giao dịch cục bộ đánh dấu sự kiện đã được phát, như hình dưới đây:

![multi-step process](../../micro-services/images/multi-step-process.png)

Dịch vụ đơn hàng chèn một hàng vào bảng ORDER rồi chèn sự kiện Order Created vào bảng EVENT. Luồng hoặc tiến trình phát sự kiện truy vấn bảng EVENT để lấy những sự kiện chưa được phát, gửi chúng đi rồi cập nhật bảng EVENT để đánh dấu sự kiện đã được phát.

Phương pháp này cũng có cả ưu và nhược điểm. Ưu điểm là có thể bảo đảm phát sự kiện mà không phụ thuộc vào 2PC; ứng dụng phát sự kiện ở tầng nghiệp vụ mà không cần suy luận xem chuyện gì đã xảy ra. Nhược điểm là nhà phát triển phải nhớ phát sự kiện nên có thể xảy ra lỗi. Phương pháp này cũng là thách thức đối với một số ứng dụng dùng cơ sở dữ liệu NoSQL vì bản thân NoSQL có khả năng giao dịch và truy vấn hạn chế.

Phương pháp này dùng giao dịch cục bộ của ứng dụng để cập nhật trạng thái và phát sự kiện nên không cần 2PC. Bây giờ hãy xem một cách khác để cập nhật trạng thái ứng dụng đơn giản nhằm đạt tính nguyên tử.

### 1.3.2 Khai thác nhật ký giao dịch cơ sở dữ liệu

Một cách khác để đạt tính nguyên tử khi luồng hoặc tiến trình phát sự kiện mà không cần 2PC là khai thác nhật ký giao dịch hoặc nhật ký commit của cơ sở dữ liệu. Ứng dụng cập nhật cơ sở dữ liệu và tạo thay đổi trong nhật ký giao dịch; tiến trình hoặc luồng khai thác nhật ký giao dịch đọc các nhật ký này rồi xuất bản chúng lên message broker. Như hình dưới đây:

![No-2PC-required](../../micro-services/images/No-2PC-required.png)

Một ví dụ về phương pháp này là dự án LinkedIn Databus. Databus khai thác nhật ký giao dịch Oracle và phát sự kiện dựa trên những thay đổi; LinkedIn dùng Databus để bảo đảm tính nhất quán giữa các bản ghi trong hệ thống.

Một ví dụ khác là cơ chế streams của AWS DynamoDB, một cơ sở dữ liệu NoSQL được quản lý. Luồng DynamoDB gồm những thay đổi của bảng cơ sở dữ liệu trong 24 giờ qua theo thứ tự thời gian (thao tác tạo, cập nhật và xóa). Ứng dụng có thể đọc các thay đổi này từ luồng rồi phát chúng dưới dạng sự kiện.

Khai thác nhật ký giao dịch cũng có cả ưu và nhược điểm. Ưu điểm là bảo đảm mỗi lần cập nhật đều phát sự kiện mà không phụ thuộc vào 2PC. Việc khai thác nhật ký giao dịch có thể được đơn giản hóa bằng cách tách việc phát sự kiện khỏi logic nghiệp vụ ứng dụng. Nhược điểm chính là nhật ký giao dịch có định dạng khác nhau tùy cơ sở dữ liệu, thậm chí khác nhau giữa các phiên bản của cùng một cơ sở dữ liệu; ngoài ra, rất khó chuyển các bản ghi cập nhật ở tầng thấp trong nhật ký giao dịch thành sự kiện nghiệp vụ ở tầng cao.

Phương pháp khai thác nhật ký giao dịch cho phép ứng dụng cập nhật cơ sở dữ liệu trực tiếp mà không cần 2PC can thiệp. Tiếp theo, hãy xem một phương pháp hoàn toàn khác: không cần cập nhật mà chỉ dựa trên sự kiện.

### 1.3.3 Dùng event sourcing

Event sourcing (nguồn sự kiện) đạt tính nguyên tử mà không cần 2PC bằng một cách tiếp cận hướng sự kiện hoàn toàn khác để bảo đảm tính nhất quán của thực thể nghiệp vụ. Ứng dụng lưu một chuỗi sự kiện thay đổi trạng thái của thực thể nghiệp vụ thay vì lưu trạng thái hiện tại của thực thể. Có thể xây dựng lại trạng thái hiện tại bằng cách phát lại các sự kiện. Mỗi khi thực thể nghiệp vụ thay đổi, một sự kiện mới được thêm vào chuỗi. Vì lưu sự kiện là một thao tác duy nhất nên chắc chắn có tính nguyên tử.

Để hiểu cách event sourcing hoạt động, hãy lấy thực thể đơn hàng làm ví dụ. Theo cách truyền thống, mỗi đơn hàng tương ứng với một hàng trong bảng ORDER, chẳng hạn các mục đơn hàng nằm trong bảng ORDER_LINE_ITEM. Còn theo event sourcing, dịch vụ đơn hàng lưu trạng thái đơn hàng bằng các sự kiện thay đổi trạng thái: đã tạo, đã duyệt, đã giao hàng, đã hủy. Mỗi sự kiện chứa đủ dữ liệu để xây dựng lại trạng thái đơn hàng.

![Event-sourcing](../../micro-services/images/Event-sourcing.png)

Sự kiện được lưu lâu dài trong kho sự kiện, nơi cung cấp API để thêm và lấy sự kiện của thực thể. Kho sự kiện tương tự message broker đã mô tả trước đó, có API để đăng ký nhận sự kiện. Kho sự kiện gửi sự kiện đến tất cả bên đăng ký quan tâm; đây là nền tảng của kiến trúc microservice hướng sự kiện.

Phương pháp event sourcing có nhiều ưu điểm: giải quyết vấn đề then chốt của kiến trúc hướng sự kiện, cho phép phát sự kiện đáng tin cậy mỗi khi trạng thái thay đổi, nhờ đó giải quyết vấn đề nhất quán dữ liệu trong kiến trúc microservice. Ngoài ra, vì lưu sự kiện thay vì đối tượng nên tránh được vấn đề không tương thích giữa mô hình đối tượng và mô hình quan hệ.

Phương pháp event sourcing cung cấp nhật ký thay đổi thực thể nghiệp vụ đáng tin cậy 100%, cho phép truy xuất trạng thái thực thể tại bất kỳ thời điểm nào. Ngoài ra, event sourcing cho phép xây dựng logic nghiệp vụ từ các thực thể nghiệp vụ liên kết lỏng lẻo và trao đổi sự kiện với nhau. Những ưu điểm này giúp việc chuyển ứng dụng đơn khối sang kiến trúc microservice tương đối dễ dàng.

Event sourcing cũng có không ít nhược điểm vì đây là mô hình lập trình khác, ít quen thuộc nên không dễ học lại. Kho sự kiện chỉ hỗ trợ truy vấn thực thể nghiệp vụ bằng khóa chính; cần dùng Command Query Responsibility Segregation (CQRS) để triển khai truy vấn nghiệp vụ. Vì vậy, ứng dụng phải xử lý dữ liệu theo mô hình eventual consistency.

## 1.4 Tổng kết

Trong kiến trúc microservice, mỗi microservice có tập dữ liệu riêng. Các microservice khác nhau có thể dùng cơ sở dữ liệu SQL hoặc NoSQL khác nhau. Dù kiến trúc cơ sở dữ liệu có nhiều ưu điểm, nó cũng tạo ra thách thức trong quản lý dữ liệu phân tán. Thách thức thứ nhất là làm thế nào duy trì tính nhất quán của giao dịch nghiệp vụ giữa nhiều dịch vụ; thách thức thứ hai là làm thế nào lấy dữ liệu nhất quán từ môi trường nhiều dịch vụ.

Giải pháp tốt nhất là dùng kiến trúc hướng sự kiện. Một thách thức ở đây là làm thế nào cập nhật trạng thái và phát sự kiện một cách nguyên tử. Có một số cách giải quyết vấn đề này, bao gồm việc xem cơ sở dữ liệu như một message queue, khai thác nhật ký giao dịch và event sourcing.
