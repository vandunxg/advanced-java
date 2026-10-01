# Chọn chiến lược triển khai microservice

## Lời nói đầu

Triển khai ứng dụng đơn khối nghĩa là chạy nhiều bản sao của một ứng dụng lớn; thông thường cung cấp một số máy chủ (N) — máy vật lý hoặc máy ảo — để chạy một số instance ứng dụng (M). Triển khai ứng dụng đơn khối không hoàn toàn đơn giản, nhưng chắc chắn dễ hơn triển khai ứng dụng microservice.

Một ứng dụng microservice gồm hàng trăm dịch vụ, mỗi dịch vụ có thể được viết bằng ngôn ngữ và framework khác nhau. Mỗi dịch vụ là một ứng dụng riêng, có thể có yêu cầu riêng về triển khai, tài nguyên, mở rộng và giám sát. Ví dụ, có thể chạy một số instance dịch vụ tùy theo nhu cầu; ngoài ra, mỗi instance cần tài nguyên CPU, bộ nhớ và I/O riêng. Dù đã phức tạp, thách thức lớn hơn là phải triển khai dịch vụ nhanh chóng, đáng tin cậy và tiết kiệm chi phí.

Có một số mô hình triển khai microservice. Trước tiên, hãy thảo luận mô hình nhiều instance dịch vụ trên mỗi máy chủ.

## Mô hình nhiều instance dịch vụ trên một máy chủ

Một cách triển khai microservice là mô hình nhiều instance dịch vụ trên một máy chủ. Theo mô hình này, cần cung cấp một số máy vật lý hoặc máy ảo, mỗi máy chạy nhiều instance dịch vụ. Trong nhiều trường hợp, đây là phương pháp triển khai ứng dụng truyền thống. Mỗi instance dịch vụ chạy trên một hoặc nhiều cổng well-known của máy chủ; có thể xem máy chủ là pet.

Sơ đồ dưới đây minh họa kiến trúc này:

![deployment-strategy-1](../../micro-services/images/deployment-strategy-1.png)

Mô hình này có một số tham số; một tham số cho biết mỗi instance dịch vụ gồm bao nhiêu tiến trình. Ví dụ, cần triển khai một instance dịch vụ Java thành ứng dụng web trên Apache Tomcat Server. Một instance dịch vụ Node.js có thể gồm một tiến trình cha và một số tiến trình con.

Một tham số khác xác định có bao nhiêu instance dịch vụ chạy trong cùng một nhóm tiến trình. Ví dụ, có thể chạy nhiều ứng dụng web Java trên cùng Apache Tomcat Server, hoặc chạy nhiều instance bundle OSGI trong cùng một container OSGI.

Mô hình nhiều instance dịch vụ trên một máy chủ có cả ưu điểm lẫn nhược điểm. Ưu điểm chính là sử dụng tài nguyên hiệu quả. Nhiều instance dịch vụ dùng chung máy chủ và hệ điều hành; nếu một nhóm tiến trình chạy nhiều instance dịch vụ thì hiệu quả có thể cao hơn, chẳng hạn nhiều ứng dụng web dùng chung một Apache Tomcat Server và JVM.

Một ưu điểm khác là triển khai instance dịch vụ nhanh. Chỉ cần sao chép dịch vụ lên máy chủ rồi khởi động. Nếu dịch vụ được viết bằng Java thì chỉ cần sao chép tệp JAR hoặc WAR. Với ngôn ngữ khác, chẳng hạn Node.js hoặc Ruby, cần sao chép mã nguồn. Như vậy, tải mạng thấp.

Do không có quá nhiều tải, dịch vụ khởi động nhanh. Nếu dịch vụ là tiến trình tự chứa thì chỉ cần khởi động; nếu không, khi instance dịch vụ chạy trong một nhóm tiến trình dạng container thì cần triển khai động vào container hoặc khởi động lại container.

Ngoài những ưu điểm trên, mô hình nhiều instance dịch vụ trên một máy chủ cũng có nhược điểm. Một nhược điểm chính là mức độ cô lập giữa các instance dịch vụ rất thấp hoặc không có, trừ khi mỗi instance là một tiến trình độc lập. Nếu muốn giám sát chính xác mức sử dụng tài nguyên của từng instance thì không thể giới hạn tài nguyên sử dụng của mỗi instance. Vì vậy, một instance dịch vụ lỗi có thể chiếm hết bộ nhớ hoặc CPU của máy chủ.

Nhiều instance dịch vụ trong cùng một tiến trình không được cô lập. Ví dụ, tất cả instance có thể dùng chung một JVM heap. Một instance dịch vụ lỗi có thể dễ dàng gây ảnh hưởng xấu đến các dịch vụ khác trong cùng tiến trình; thậm chí có thể không giám sát được mức sử dụng tài nguyên của từng instance.

Một vấn đề nghiêm trọng khác là đội vận hành phải nắm rõ các bước triển khai chi tiết. Các dịch vụ có thể được viết bằng ngôn ngữ và framework khác nhau nên đội phát triển chắc chắn có nhiều điều cần trao đổi với đội vận hành. Độ phức tạp tăng lên cũng làm tăng khả năng xảy ra lỗi trong quá trình triển khai.

Có thể thấy, dù quen thuộc, mô hình nhiều instance dịch vụ trên một máy chủ vẫn có nhiều nhược điểm nghiêm trọng. Hãy xem có cách triển khai microservice nào khác tránh được những vấn đề này không.

## Mô hình một instance dịch vụ trên một máy chủ

Một cách khác để triển khai microservice là mô hình một instance dịch vụ trên một máy chủ. Theo mô hình này, mỗi instance dịch vụ trên từng máy chủ đều độc lập. Có hai cách triển khai khác nhau: một instance trên mỗi máy ảo và một instance trên mỗi container.

### Mô hình một instance trên mỗi máy ảo

Với mô hình một instance trên mỗi máy ảo, thông thường đóng gói dịch vụ thành ảnh máy ảo, chẳng hạn một Amazon EC2 AMI. Mỗi instance dịch vụ là một VM (ví dụ, một instance EC2) được khởi chạy từ ảnh này. Sơ đồ dưới đây minh họa kiến trúc này:

![deployment-strategy-2](../../micro-services/images/deployment-strategy-2.png)

Netflix dùng kiến trúc này để triển khai dịch vụ truyền phát video. Netflix dùng Aminator để đóng gói từng dịch vụ thành một EC2 AMI. Mỗi instance dịch vụ đang chạy là một instance EC2.

Có nhiều công cụ để tạo VM của riêng bạn. Có thể cấu hình dịch vụ tích hợp liên tục (CI), chẳng hạn Jenkins, để Aminator đóng gói dịch vụ thành EC2 AMI. packer.io là một lựa chọn khác để tự động tạo ảnh máy ảo. Không như Aminator, công cụ này hỗ trợ nhiều công nghệ ảo hóa như EC2, DigitalOcean, VirtualBox và VMware.

Công ty Boxfuse có cách sáng tạo để tạo ảnh máy ảo và khắc phục các nhược điểm sau. Boxfuse đóng gói ứng dụng Java thành ảnh máy ảo tối thiểu; ảnh được tạo nhanh, khởi động nhanh và bảo mật hơn vì chỉ để lộ một số ít giao diện dịch vụ ra bên ngoài.

Công ty CloudNative có ứng dụng SaaS Bakery để tạo EC2 AMI. Sau khi kiến trúc microservice của người dùng vượt qua kiểm thử, họ có thể cấu hình máy chủ CI của mình để kích hoạt Bakery. Bakery sẽ đóng gói dịch vụ thành AMI. Dùng ứng dụng SaaS như Bakery nghĩa là người dùng không cần tốn thời gian thiết lập kiến trúc tự tạo AMI.

Mô hình một instance dịch vụ trên mỗi máy ảo có nhiều ưu điểm. Ưu điểm chính của VM là mỗi instance dịch vụ chạy hoàn toàn độc lập, có CPU và bộ nhớ riêng, không bị các dịch vụ khác chiếm dụng.

Một lợi ích khác là người dùng có thể dùng kiến trúc đám mây hoàn thiện như AWS cung cấp; các dịch vụ đám mây có nhiều chức năng hữu ích như cân bằng tải và khả năng mở rộng.

Một lợi ích nữa là công nghệ hiện thực dịch vụ được đóng gói thành một đơn vị độc lập. Khi dịch vụ đã được đóng gói thành VM thì nó trở thành một hộp đen. API quản lý VM trở thành API triển khai dịch vụ, nhờ đó triển khai rất đơn giản và đáng tin cậy.

Mô hình một instance trên mỗi máy ảo cũng có nhược điểm. Một nhược điểm là sử dụng tài nguyên không hiệu quả. Mỗi instance dịch vụ chiếm tài nguyên của cả VM, bao gồm hệ điều hành. Hơn nữa, trong một môi trường IaaS công cộng điển hình, tài nguyên VM được chuẩn hóa và có thể không được sử dụng hết.

Ngoài ra, IaaS công cộng tính phí theo VM bất kể VM có bận hay không. Ví dụ, AWS cung cấp chức năng tự động mở rộng nhưng không phản hồi đủ nhanh đối với các ứng dụng theo nhu cầu, khiến người dùng phải triển khai thêm VM và tăng chi phí triển khai.

Một nhược điểm khác là triển khai phiên bản dịch vụ mới chậm. Ảnh VM có kích thước lớn nên tạo chậm; vì cùng lý do, khởi tạo VM cũng chậm và hệ điều hành cần thời gian để khởi động. Tuy nhiên, điều này không phải lúc nào cũng đúng; một số VM nhẹ như VM tạo bằng Boxfuse khởi động khá nhanh.

Nhược điểm thứ ba là đội vận hành phải thực hiện nhiều việc tùy chỉnh. Trừ khi dùng công cụ như Boxfuse để giảm đáng kể công sức tạo và quản lý VM, nếu không sẽ tốn nhiều thời gian cho những công việc ít liên quan đến nghiệp vụ cốt lõi.

Bây giờ hãy xem một cách triển khai microservice khác vẫn có đặc điểm của VM nhưng nhẹ hơn.

## Mô hình một instance dịch vụ trên mỗi container

Theo mô hình này, mỗi instance dịch vụ chạy trong một container riêng. Container là cơ chế ảo hóa ở cấp hệ điều hành. Một container gồm một số tiến trình chạy trong sandbox. Nhìn từ góc độ tiến trình, chúng có namespace và hệ thống tệp gốc riêng; có thể giới hạn bộ nhớ và CPU của container. Một số container còn giới hạn I/O. Các công nghệ container này bao gồm Docker và Solaris Zones.

Sơ đồ dưới đây minh họa mô hình này:

![deployment-strategy-3](../../micro-services/images/deployment-strategy-3.png)

Theo mô hình này, cần đóng gói dịch vụ thành ảnh container. Ảnh container là một hệ thống tệp chứa các thư viện và ứng dụng cần thiết để chạy dịch vụ. Một số ảnh container gồm toàn bộ hệ thống tệp gốc Linux, số khác thì nhẹ hơn. Ví dụ, để triển khai dịch vụ Java, cần tạo ảnh container có môi trường chạy Java, có thể cả máy chủ Apache Tomcat, cùng ứng dụng Java đã biên dịch.

Sau khi đóng gói dịch vụ thành ảnh container, cần khởi chạy một số container. Thông thường nhiều container chạy trên một máy vật lý hoặc máy ảo. Có thể cần hệ thống quản lý cụm như k8s hoặc Marathon để quản lý container. Hệ thống quản lý cụm xem máy chủ là một nhóm tài nguyên và quyết định lập lịch container lên máy nào dựa trên nhu cầu tài nguyên của từng container.

Mô hình một instance dịch vụ trên mỗi container cũng có ưu và nhược điểm. Ưu điểm của container khá giống với VM: các instance dịch vụ hoàn toàn độc lập, dễ giám sát tài nguyên tiêu thụ của từng container. Giống VM, container dùng công nghệ cô lập để triển khai dịch vụ. API quản lý container cũng có thể dùng làm API quản lý dịch vụ.

Tuy nhiên, khác VM, container là công nghệ nhẹ. Ảnh container được tạo nhanh; chẳng hạn, trên máy tính xách tay, đóng gói ứng dụng Spring Boot thành ảnh container chỉ mất 5 giây. Vì không cần cơ chế khởi động hệ điều hành nên container cũng khởi động nhanh. Khi container khởi động, dịch vụ nền cũng chạy.

Dùng container cũng có một số nhược điểm. Dù kiến trúc container phát triển nhanh, nó vẫn chưa hoàn thiện bằng kiến trúc VM. Ngoài ra, vì các container dùng chung nhân hệ điều hành host nên không an toàn bằng VM.

Công nghệ container cũng đòi hỏi nhiều công việc tùy chỉnh để quản lý ảnh container. Trừ khi dùng các dịch vụ như Google Container Engine hoặc Amazon EC2 Container Service (ECS), nếu không người dùng phải đồng thời quản lý cả kiến trúc container và kiến trúc VM.

Thứ ba, container thường được triển khai trên hạ tầng tính phí theo VM; hiển nhiên khách hàng cũng phải chịu thêm chi phí triển khai để đáp ứng tải tăng lên.

Điều thú vị là ranh giới giữa container và VM ngày càng mờ đi. Như đã nói, VM của Boxfuse được tạo và khởi động nhanh; công nghệ Clear Container hướng đến tạo VM nhẹ. Công nghệ của công ty unikernel cũng thu hút sự chú ý; gần đây Docker đã mua lại Unikernel.

Ngoài ra, công nghệ triển khai serverless tránh được các nhược điểm của container và VM nêu trên, đồng thời thu hút ngày càng nhiều sự chú ý. Hãy cùng xem.

## Triển khai serverless

AWS Lambda là một ví dụ về công nghệ triển khai serverless, hỗ trợ dịch vụ Java, Node.js và Python. Chỉ cần đóng gói dịch vụ thành tệp ZIP rồi tải lên AWS Lambda để triển khai. Có thể cung cấp metadata, bao gồm tên hàm xử lý yêu cầu dịch vụ (một sự kiện). AWS Lambda tự động chạy số lượng microservice cần thiết để xử lý yêu cầu, và chỉ tính phí theo thời gian chạy cùng lượng bộ nhớ sử dụng. Tất nhiên, chi tiết quyết định thành bại và AWS Lambda cũng có giới hạn. Nhưng việc không cần lo lắng về bất kỳ khía cạnh nào của máy chủ, máy ảo hay container là điều rất hấp dẫn.

Hàm Lambda là dịch vụ phi trạng thái. Thông thường, hàm xử lý yêu cầu bằng cách được kích hoạt bởi dịch vụ AWS. Ví dụ, khi một ảnh được tải lên S3 bucket, sự kiện đó kích hoạt hàm Lambda; hàm này có thể chèn một bản ghi vào bảng ảnh DynamoDB, xuất bản một thông điệp lên luồng Kinesis và kích hoạt thao tác xử lý ảnh. Hàm Lambda cũng có thể được kích hoạt bởi dịch vụ web bên thứ ba.

Có bốn cách kích hoạt hàm Lambda:

-   Trực tiếp, bằng yêu cầu dịch vụ web
-   Tự động, phản hồi sự kiện do AWS S3, DynamoDB, Kinesis hoặc Simple Email Service tạo ra
-   Tự động, thông qua AWS API Gateway để xử lý yêu cầu HTTP do client của ứng dụng gửi
-   Theo lịch, phản hồi theo cron — tương tự bộ hẹn giờ

Có thể thấy AWS Lambda là một cách triển khai microservice rất thuận tiện. Cách tính phí theo yêu cầu có nghĩa là người dùng chỉ phải trả cho tải xử lý nghiệp vụ của mình; ngoài ra, vì không cần quan tâm đến hạ tầng nên người dùng chỉ cần phát triển ứng dụng.

Tuy nhiên, vẫn có khá nhiều giới hạn. Không nên dùng để triển khai dịch vụ chạy lâu dài, chẳng hạn tiêu thụ thông điệp được chuyển tiếp từ broker bên thứ ba. Yêu cầu phải hoàn tất trong 300 giây; dịch vụ phải phi trạng thái vì về lý thuyết AWS Lambda tạo instance riêng cho từng yêu cầu; cần dùng một ngôn ngữ được hỗ trợ; dịch vụ phải khởi động nhanh, nếu không sẽ bị dừng do timeout.
Triển khai ứng dụng microservice cũng là một thách thức. Có hàng trăm, hàng nghìn dịch vụ được viết bằng nhiều ngôn ngữ và framework khác nhau. Mỗi dịch vụ là một ứng dụng nhỏ, có yêu cầu riêng về triển khai, tài nguyên, mở rộng và giám sát. Có một số mô hình triển khai microservice, bao gồm một instance trên mỗi VM và một instance trên mỗi container. Một lựa chọn khác là AWS Lambda, một phương pháp serverless.
