# Thiết kế một hệ thống high concurrency như thế nào?

## Câu hỏi phỏng vấn

Thiết kế một hệ thống high concurrency như thế nào?

## Phân tích suy nghĩ của người phỏng vấn

Nói thật, nếu người phỏng vấn hỏi câu này thì bạn phải dốc hết sức để trả lời. Vì sao? Vì bạn có thấy JD tuyển dụng của nhiều công ty hiện nay thường ghi ưu tiên ứng viên có kinh nghiệm high concurrency không?

Nếu bạn thực sự có năng lực, từng làm hệ thống high concurrency trong công ty Internet, thì việc nhận offer gần như dễ như lấy đồ trong túi, không có vấn đề gì. Người phỏng vấn cũng chắc chắn sẽ không hỏi bạn câu này, nếu không thì người đó thật ngốc.

Giả sử bạn từng làm hệ thống high concurrency ở một công ty thương mại điện tử nổi tiếng, có hàng trăm triệu người dùng, lưu lượng hàng chục tỷ lượt mỗi ngày, concurrency giờ cao điểm lên đến hàng chục nghìn, thậm chí hàng trăm nghìn. Khi đó người ta chắc chắn sẽ hỏi kỹ về kiến trúc hệ thống của bạn: hệ thống có kiến trúc gì, triển khai ra sao, bao nhiêu máy, dùng cache thế nào, dùng MQ thế nào, dùng database thế nào. Họ muốn tìm hiểu sâu cách bạn xử lý high concurrency.

Người thực sự từng làm high concurrency đều biết kiến trúc hệ thống tách rời nghiệp vụ chỉ là lý thuyết suông. Trong tình huống nghiệp vụ phức tạp và high concurrency thực tế, kiến trúc hệ thống chắc chắn không đơn giản đến vậy; liệu chỉ dùng Redis và MQ là giải quyết được sao? Dĩ nhiên không. Khi kết hợp kiến trúc hệ thống thực tế với nghiệp vụ, nó phức tạp hơn nhiều lần so với cái gọi là “kiến trúc high concurrency” đơn giản này.

Nếu người phỏng vấn hỏi bạn cách thiết kế một hệ thống high concurrency thì rất tiếc, **chắc chắn là vì bạn chưa từng thực sự làm hệ thống high concurrency**. Họ nhìn CV của bạn và thấy không có gì nổi bật, có vẻ cũng bình thường, nên hỏi xem bạn thiết kế một hệ thống high concurrency như thế nào. Thực ra bản chất là muốn xem bạn có tự nghiên cứu và tích lũy kiến thức không.

Tất nhiên tốt nhất là tuyển một người thực sự từng làm high concurrency, nhưng những người như vậy hiếm và khó tuyển. Vì vậy phương án tiếp theo có thể là tuyển một người đã tự nghiên cứu; dù sao vẫn tốt hơn người không biết gì!

Vì thế lúc này bạn cần có một màn thể hiện cá nhân, trình bày tất cả kiến thức về high concurrency của mình!

## Phân tích câu hỏi phỏng vấn

Nếu muốn hiểu câu hỏi về high concurrency thì cần bắt đầu từ nguồn gốc của high concurrency: vì sao có high concurrency? Vì sao high concurrency lại ghê gớm đến vậy?

Nói đơn giản, ban đầu hệ thống nào cũng kết nối đến database, nhưng cần biết rằng khi database chịu khoảng hai, ba nghìn lượt đồng thời mỗi giây thì gần như không chịu nổi nữa. Vì vậy nhiều công ty lúc đầu có kỹ thuật khá đơn giản, nhưng nghiệp vụ phát triển quá nhanh nên đôi khi hệ thống không chịu nổi tải và bị sập.

Dĩ nhiên hệ thống sẽ sập, sao lại không? Nếu database đột ngột phải chịu 5000/8000 hoặc thậm chí hơn mười nghìn lượt đồng thời mỗi giây thì chắc chắn sẽ sập, vì chẳng hạn MySQL vốn không chịu nổi concurrency cao như vậy.

Vì sao high concurrency lại ghê gớm đến vậy? Vì ngày càng nhiều người dùng Internet; nhiều app, website và hệ thống phải xử lý request high concurrency, có thể giờ cao điểm vài nghìn request mỗi giây là bình thường. Nếu là dịp Double 11 chẳng hạn thì concurrency có thể lên đến hàng chục nghìn hoặc hàng trăm nghìn mỗi giây.

Vậy phải làm sao với concurrency cao như thế và nghiệp vụ vốn đã phức tạp? Người thực sự giỏi chắc chắn là người từng làm kiến trúc high concurrency trong hệ thống nghiệp vụ phức tạp. Nhưng nếu bạn chưa làm, tôi sẽ chỉ cách trả lời câu hỏi này:

Có thể chia thành 6 điểm sau:

-   Tách hệ thống
-   Cache
-   MQ
-   Sharding database và table
-   Read/write separation
-   ElasticSearch

![high-concurrency-system-design](../../high-concurrency/images/high-concurrency-system-design.png)

### Tách hệ thống

Chia một hệ thống thành nhiều subsystem, dùng Dubbo. Sau đó mỗi hệ thống kết nối với một database; như vậy ban đầu chỉ có một database, giờ có nhiều database, chẳng phải cũng có thể chịu high concurrency sao?

### Cache

Bắt buộc phải dùng cache. Phần lớn tình huống high concurrency đều là **đọc nhiều, ghi ít**; khi đó có thể ghi dữ liệu vào cả database và cache, rồi phần lớn thao tác đọc lấy từ cache. Dù sao Redis cũng dễ dàng chịu được hàng chục nghìn lượt đồng thời trên một máy. Vì vậy, hãy cân nhắc trong dự án của bạn **các tình huống đọc chịu phần lớn request thì dùng cache thế nào để xử lý high concurrency**.

### MQ

Bắt buộc phải dùng MQ. Có thể vẫn có tình huống ghi high concurrency; chẳng hạn một thao tác nghiệp vụ phải truy cập database hàng chục lần để thêm, xóa, sửa, rồi lại thêm, xóa, sửa — thật quá đáng. High concurrency chắc chắn sẽ làm hệ thống sập. Nếu dùng Redis để xử lý ghi thì cũng không được; đó là cache, dữ liệu có thể bị LRU xóa bất cứ lúc nào, định dạng dữ liệu cũng rất đơn giản và không hỗ trợ transaction. Vì vậy vẫn phải dùng MySQL. Vậy phải làm sao? Dùng MQ: đẩy nhiều request ghi vào MQ, xếp hàng xử lý dần, **hệ thống phía sau tiêu thụ rồi ghi từ từ**, giữ mức ghi trong phạm vi MySQL chịu được. Vì vậy cần cân nhắc trong các tình huống nghiệp vụ ghi phức tạp của dự án cách dùng MQ để ghi bất đồng bộ và tăng concurrency. Một MQ trên một máy chịu hàng chục nghìn lượt đồng thời cũng ổn; nội dung này đã được nói riêng trước đó.

### Sharding database và table

Cuối cùng, database có thể vẫn phải đáp ứng yêu cầu high concurrency. Được rồi, vậy hãy chia một database thành nhiều database để nhiều database chịu concurrency cao hơn; sau đó **chia một table thành nhiều table**, giữ lượng dữ liệu mỗi table ít hơn để nâng cao hiệu năng thực thi SQL.

### Read/write separation

Read/write separation: phần lớn thời gian database có thể đọc nhiều, ghi ít; không cần tập trung mọi request vào một database. Có thể thiết lập kiến trúc primary-replica, **ghi vào primary database**, **đọc từ replica database** để tách đọc ghi. Khi **lưu lượng đọc quá lớn**, có thể **thêm nhiều replica database hơn**.

### ElasticSearch

Elasticsearch, viết tắt es, là hệ thống phân tán và có thể mở rộng dễ dàng; tính phân tán tự nhiên giúp nó chịu high concurrency vì có thể thêm máy để gánh concurrency cao hơn. Có thể cân nhắc dùng es để xử lý một số truy vấn và thao tác thống kê tương đối đơn giản, cũng như một số thao tác full-text search.

Sáu điểm trên về cơ bản là những việc hệ thống high concurrency chắc chắn cần làm. Hãy suy nghĩ kỹ và liên hệ với kiến thức đã trình bày trước đó; khi đó bạn có thể trình bày một cách có hệ thống về phần này và các vấn đề cần lưu ý trong từng phần. Những nội dung đó đều đã nói trước đó; bạn có thể trình bày để thể hiện mình đã tích lũy kiến thức.

Nói thật, điểm thực sự quan trọng không phải là hiểu một số kỹ thuật hoặc biết đại khái hệ thống high concurrency trông như thế nào. Trong hệ thống nghiệp vụ phức tạp thực tế, thực hiện high concurrency phức tạp hơn những điểm kể trên hàng chục đến hàng trăm lần. Bạn cần cân nhắc: phần nào cần sharding database/table, phần nào không; join giữa database/table đơn lẻ và sharding database/table thế nào; dữ liệu nào cần đặt vào cache và cần cache dữ liệu gì mới chịu được request high concurrency. Bạn cần phân tích hệ thống nghiệp vụ phức tạp rồi từng bước đưa các thay đổi kiến trúc high concurrency vào hệ thống. Quá trình này cực kỳ phức tạp; nếu đã làm một lần và làm tốt thì bạn sẽ rất có giá trị trên thị trường lao động.

Thực ra điều phần lớn công ty thực sự coi trọng không phải là bạn nắm được một số kiến thức kiến trúc cơ bản hay một số kỹ thuật trong kiến trúc high concurrency như RocketMQ, Kafka, Redis, Elasticsearch. Dù đã hiểu phần high concurrency, bạn vẫn chỉ thuộc nhóm nhân lực thứ yếu. Đối với một hệ thống phân tán phức tạp có hàng trăm nghìn dòng code, kinh nghiệm của người đã từng xây dựng, thiết kế và thực hành kiến trúc high concurrency qua từng bước là vô cùng đáng quý.
