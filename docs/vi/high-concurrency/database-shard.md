# Vì sao cần sharding database và table?

## Câu hỏi phỏng vấn

Vì sao cần sharding database/table (khi thiết kế hệ thống high concurrency thì nên thiết kế tầng database như thế nào)? Bạn đã dùng middleware sharding database/table nào? Mỗi middleware có ưu nhược điểm gì? Cụ thể các bạn tách database theo chiều dọc hoặc chiều ngang như thế nào?

## Phân tích suy nghĩ của người phỏng vấn

Thực ra chủ đề này chắc chắn liên quan đến **high concurrency**, vì sharding database/table luôn nhằm giải quyết hai vấn đề: **đáp ứng high concurrency và lượng dữ liệu lớn**. Hơn nữa, thành thật mà nói, đặc biệt trong phỏng vấn công ty Internet, gần như lúc nào người ta cũng hỏi nội dung này. Đây là vấn đề kỹ thuật rất phổ biến nên không hỏi thì thật không hợp lý; còn nếu bạn không biết thì cũng khó giải thích!

## Phân tích câu hỏi phỏng vấn

### Vì sao cần sharding database/table? (Khi thiết kế hệ thống high concurrency thì nên thiết kế tầng database như thế nào?)

Nói cho rõ, sharding database và sharding table là hai việc khác nhau; đừng nhầm lẫn. Có thể chỉ sharding database mà không sharding table, hoặc chỉ sharding table mà không sharding database.

Trước hết, tôi đưa ra một tình huống.

Giả sử hiện tại chúng ta là một startup nhỏ (hoặc một phòng ban mới thành lập trong một công ty BAT), có 200 nghìn người dùng đăng ký, mỗi ngày có 10 nghìn người dùng hoạt động, mỗi ngày một table có 1000 bản ghi mới và vào giờ cao điểm số request đồng thời tối đa là 10 mỗi giây. Trời ơi, với hệ thống như thế này, tìm một người có vài năm kinh nghiệm rồi thêm vài người mới được đào tạo, làm đơn giản là được.

Không ngờ chúng ta may mắn đến vậy: CEO dẫn dắt công ty bước vào con đường phát triển rộng mở, chỉ vài tháng sau số người dùng đăng ký đã đạt 20 triệu! Mỗi ngày có 1 triệu người dùng hoạt động! Mỗi ngày một table có 100 nghìn bản ghi mới! Giờ cao điểm có tối đa 1000 request mỗi giây! Công ty còn gọi vốn hai vòng, thu về vài trăm triệu nhân dân tệ! Định giá công ty lên đến vài trăm triệu USD! Đây đúng là đà phát triển của một unicorn nhỏ!

Được rồi, mọi người bắt đầu cảm thấy áp lực, vì sao? Mỗi ngày tăng thêm 100 nghìn bản ghi, một tháng tăng 3 triệu bản ghi; table hiện tại đã có vài triệu bản ghi và sắp vượt 10 triệu. Nhưng vẫn còn cố gắng chịu được. Giờ cao điểm có 1000 request; chúng ta triển khai vài máy production và thiết lập load balancing; database chịu 1000 QPS cũng tạm ổn. Nhưng mọi người bắt đầu lo lắng: tiếp theo phải làm sao...

Vài tháng sau nữa, trời ơi, CEO quá giỏi! Số người dùng công ty đã đạt 100 triệu; công ty tiếp tục gọi vốn vài tỷ nhân dân tệ! Định giá công ty lên đến vài tỷ USD, trở thành startup ngôi sao nổi bật nhất trong nước năm nay! Trời ơi, chúng ta thật may mắn.

Nhưng đồng thời chúng ta cũng không may, vì lúc này mỗi ngày có hàng chục triệu người dùng hoạt động, mỗi ngày một table tăng thêm đến 500 nghìn bản ghi và tổng dữ liệu của một table đã lên 20–30 triệu bản ghi! Không chịu nổi nữa! Dung lượng đĩa database liên tục bị dùng hết! Concurrency giờ cao điểm đạt mức đáng kinh ngạc là `5000~8000`! Đừng đùa nữa, anh bạn. Tôi đảm bảo hệ thống của bạn đã sập trước khi có thể chịu được đến mức này!

Được rồi, đến đây chắc bạn đã hiểu sharding database/table là gì. Thực tế, điều này đi theo sự phát triển nghiệp vụ của công ty: nghiệp vụ phát triển càng tốt thì càng nhiều người dùng, lượng dữ liệu và số request càng lớn; một database đơn lẻ chắc chắn không chịu nổi.

#### Sharding table

Ví dụ, một table có hàng chục triệu bản ghi; bạn chắc nó chịu nổi không? Chắc chắn không, **lượng dữ liệu trong một table quá lớn** sẽ ảnh hưởng nghiêm trọng đến **hiệu năng thực thi SQL**; về sau SQL có thể chạy rất chậm. Theo kinh nghiệm của tôi, khi một table đạt vài triệu bản ghi thì hiệu năng đã kém đi tương đối; lúc đó cần sharding table.

Sharding table nghĩa là đưa dữ liệu của một table vào nhiều table, rồi khi truy vấn thì chỉ truy vấn một table. Ví dụ, sharding table theo user id để dữ liệu của mỗi người dùng nằm trong một table. Khi thao tác với một người dùng thì chỉ thao tác trên table đó. Như vậy có thể giữ lượng dữ liệu của mỗi table trong một phạm vi kiểm soát được, chẳng hạn cố định dưới 2 triệu bản ghi mỗi table.

#### Sharding database

Sharding database nghĩa là theo kinh nghiệm của chúng tôi, một database thường chịu được tối đa khoảng 2000 lượt đồng thời; khi đến mức đó nhất định phải mở rộng. Tốt nhất nên giữ concurrency của một database khỏe mạnh ở mức khoảng 1000 mỗi giây, đừng để quá cao. Có thể tách dữ liệu của một database sang nhiều database rồi truy cập một database khi cần.

Đó chính là **sharding database/table**. Bạn đã hiểu vì sao cần sharding database/table rồi chứ?

| #              | Trước khi sharding database/table | Sau khi sharding database/table |
| -------------- | --------------------------------- | ------------------------------- |
| Đáp ứng concurrency | MySQL triển khai trên một máy, không chịu được high concurrency | MySQL chuyển từ một máy sang nhiều máy, concurrency có thể tăng lên nhiều lần |
| Dung lượng đĩa | Dung lượng đĩa của MySQL trên một máy gần như dùng hết | Tách thành nhiều database, mức sử dụng đĩa của database server giảm đáng kể |
| Hiệu năng thực thi SQL | Lượng dữ liệu trong một table quá lớn, SQL ngày càng chậm | Lượng dữ liệu mỗi table giảm, hiệu quả thực thi SQL tăng rõ rệt |

### Bạn đã dùng middleware sharding database/table nào? Mỗi middleware có ưu nhược điểm gì?

Thực ra câu hỏi này nhằm xem bạn biết những middleware sharding database/table nào, ưu nhược điểm của từng middleware là gì và bạn đã dùng middleware nào.

Các lựa chọn thường gặp gồm:

-   Cobar
-   TDDL
-   Atlas
-   Sharding-jdbc
-   Mycat

#### Cobar

Do đội ngũ Alibaba B2B phát triển và mã nguồn mở, đây là phương án ở tầng proxy, nằm giữa application server và database server. Ứng dụng truy cập cụm Cobar thông qua JDBC driver; Cobar phân tích SQL và rule sharding, sau đó phân rã SQL rồi phân phối đến các database instance khác nhau trong cụm MySQL để thực thi. Cách đây nhiều năm có thể dùng được, nhưng vài năm gần đây dự án không còn cập nhật, hầu như không ai dùng, gần như đã bị bỏ. Ngoài ra, nó không hỗ trợ read/write separation, stored procedure, join xuyên database và phân trang.

#### TDDL

Do đội ngũ Taobao phát triển, đây là phương án ở tầng client. Nó hỗ trợ cú pháp CRUD cơ bản và read/write separation nhưng không hỗ trợ cú pháp join, truy vấn nhiều table, v.v. Hiện cũng không được dùng nhiều vì còn phụ thuộc vào hệ thống quản lý cấu hình Diamond của Taobao.

#### Atlas

Do 360 mã nguồn mở, đây là phương án ở tầng proxy. Trước đây có một số công ty dùng, nhưng có một vấn đề lớn là các bản bảo trì mới nhất của cộng đồng đã từ 5 năm trước. Vì thế hiện nay cũng rất ít công ty sử dụng.

#### Sharding-jdbc

Do Dangdang mã nguồn mở, đây là phương án ở tầng client, là phương án tầng client của [ `ShardingSphere` ](https://shardingsphere.apache.org); [ `ShardingSphere` ](https://shardingsphere.apache.org) còn cung cấp phương án tầng proxy là Sharding-Proxy. Trước đây giải pháp này được dùng khá nhiều vì hỗ trợ khá nhiều cú pháp SQL, ít hạn chế; đến 2019.4 đã phát hành phiên bản `4.0.0-RC1`, hỗ trợ sharding database/table, read/write separation, tạo distributed id và flexible transaction (transaction kiểu nỗ lực tối đa để gửi, transaction TCC). Thực tế trước đây có khá nhiều công ty dùng (trên website chính thức có danh sách công ty sử dụng; có thể thấy từ năm 2017 đến nay có nhiều công ty dùng). Cộng đồng hiện vẫn tiếp tục phát triển và bảo trì, tương đối năng động; theo tôi đây là **phương án hiện vẫn có thể chọn**.

#### Mycat

Được chỉnh sửa dựa trên Cobar, đây là phương án tầng proxy. Tính năng được hỗ trợ rất đầy đủ; hiện tại có vẻ là middleware database khá phổ biến và ngày càng thịnh hành, cộng đồng rất năng động và một số công ty đã bắt đầu sử dụng. Tuy nhiên, so với Sharding-jdbc, Mycat còn non trẻ hơn và ít trải qua thử thách thực tế hơn.

#### Tổng kết

Tóm lại, hiện nay nên cân nhắc Sharding-jdbc và Mycat; có thể xem xét sử dụng cả hai.

**Ưu điểm** của phương án tầng client như Sharding-jdbc là không cần triển khai, chi phí vận hành thấp, không cần chuyển tiếp request lần hai qua tầng proxy và hiệu năng cao. Tuy nhiên, khi cần nâng cấp thì phải nâng phiên bản rồi phát hành lại từng hệ thống; mỗi hệ thống đều cần **coupling** với dependency Sharding-jdbc.

**Nhược điểm** của phương án tầng proxy như Mycat là cần **triển khai**, tự vận hành một bộ middleware nên chi phí vận hành cao; nhưng **ưu điểm là minh bạch với từng dự án**. Khi cần nâng cấp, chỉ cần thực hiện ở middleware của mình.

Thông thường có thể chọn một trong hai phương án. Tuy nhiên, tôi khuyến nghị công ty vừa và nhỏ dùng Sharding-jdbc vì giải pháp tầng client gọn nhẹ, chi phí bảo trì thấp, không cần thêm nhân sự và hệ thống của công ty vừa và nhỏ thường ít phức tạp, có ít dự án hơn. Với công ty vừa và lớn thì tốt nhất nên dùng phương án tầng proxy như Mycat vì công ty lớn có thể có rất nhiều hệ thống và dự án, đội ngũ đông và đủ nhân lực; nên có người chuyên nghiên cứu và bảo trì Mycat, sau đó các dự án có thể dùng nó một cách minh bạch.

### Cụ thể các bạn tách database theo chiều dọc hoặc chiều ngang như thế nào?

**Sharding ngang** nghĩa là đưa dữ liệu của một table vào nhiều table thuộc nhiều database, nhưng cấu trúc table ở mỗi database đều giống nhau; chỉ khác là mỗi database/table chứa dữ liệu khác nhau. Tổng hợp dữ liệu của tất cả database/table sẽ tạo thành toàn bộ dữ liệu. Ý nghĩa của sharding ngang là phân phối dữ liệu đồng đều sang nhiều database hơn, dùng nhiều database để chịu concurrency cao hơn và dùng dung lượng lưu trữ của nhiều database để mở rộng.

![database-split-horizon](../../high-concurrency/images/database-split-horizon.png)

**Sharding dọc** nghĩa là **tách một table có nhiều field thành nhiều table** hoặc **tách sang nhiều database**. Cấu trúc của mỗi database/table khác nhau; mỗi database/table chứa một phần field. Thông thường, **đưa các field ít hơn nhưng được truy cập thường xuyên vào một table**, sau đó **đưa các field nhiều hơn nhưng ít được truy cập vào một table khác**. Vì database có cache, số field của các hàng được truy cập thường xuyên càng ít thì cache càng lưu được nhiều hàng và hiệu năng càng tốt. Cách này thường được dùng nhiều hơn ở cấp table.

![database-split-vertically](../../high-concurrency/images/database-split-vertically.png)

Việc này khá phổ biến; không nhất thiết chỉ có tôi nói, nhiều bạn có thể đã tự làm rồi: tách một table lớn thành table đơn hàng, table thanh toán đơn hàng và table sản phẩm trong đơn hàng.

Còn có **tách ở cấp table**, tức sharding table: biến một table thành N table, **giữ lượng dữ liệu của mỗi table trong một phạm vi nhất định** để đảm bảo hiệu năng SQL. Nếu không, lượng dữ liệu trong một table càng lớn thì hiệu năng SQL càng kém. Thông thường có khoảng 2 triệu hàng, không nên quá nhiều; tuy nhiên còn tùy cách thao tác cụ thể, có thể là 5 triệu hoặc 1 triệu. SQL càng phức tạp thì số hàng trong một table càng nên ít.

Được rồi, dù sharding database hay sharding table, các middleware database đã nói ở trên đều hỗ trợ. Về cơ bản, sau khi sharding database/table, middleware có thể dựa trên giá trị của một field do bạn chỉ định, chẳng hạn userid, **tự định tuyến đến database tương ứng rồi tự định tuyến đến table tương ứng**.

Bạn cần cân nhắc dự án của mình nên sharding database/table như thế nào. Thông thường, với sharding dọc có thể thực hiện ở cấp table để tách các table có nhiều field. Với sharding ngang, có thể tách khi không chịu nổi concurrency hoặc lượng dữ liệu, dung lượng quá lớn; hãy tự chọn field để tách. Với sharding table, dù đã tách đến từng database và concurrency lẫn dung lượng đều ổn nhưng table trong mỗi database vẫn quá lớn thì hãy sharding table để lượng dữ liệu trong mỗi table không quá lớn.

Ngoài ra còn có hai **cách sharding database/table**:

-   Một cách là phân chia theo range, tức mỗi database chứa một đoạn dữ liệu liên tục; thường dựa trên **khoảng thời gian**, nhưng ít dùng vì dễ tạo vấn đề hotspot, phần lớn lưu lượng tập trung vào dữ liệu mới nhất.
-   Cách khác là hash một field để phân phối đồng đều; cách này được dùng phổ biến hơn.

Ưu điểm của phân chia theo range là mở rộng đơn giản: chỉ cần chuẩn bị một database cho mỗi tháng; khi sang tháng mới thì dữ liệu tự nhiên được ghi vào database mới. Nhược điểm là phần lớn request đều truy cập dữ liệu mới nhất. Khi dùng range trong production cần xem xét tình huống cụ thể.

Ưu điểm của phân phối hash là có thể phân bổ đồng đều lượng dữ liệu và áp lực request lên từng database. Nhược điểm là mở rộng phức tạp hơn vì cần migration dữ liệu; dữ liệu cũ phải được tính lại hash để phân phối sang database hoặc table khác nhau.