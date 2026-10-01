# Nguyên lý kiến trúc phân tán của ES

## Câu hỏi phỏng vấn

Bạn có thể trình bày nguyên lý kiến trúc phân tán của ES không (ES triển khai phân tán như thế nào)?

## Phân tích suy nghĩ của người phỏng vấn

Trong lĩnh vực tìm kiếm, lucene là thư viện tìm kiếm phổ biến nhất. Vài năm trước, người trong ngành thường hỏi bạn có biết lucene không, có biết nguyên lý inverted index không. Bây giờ những câu hỏi đó đã lỗi thời từ lâu vì nhiều dự án hiện dùng trực tiếp search engine phân tán dựa trên lucene là ElasticSearch, viết tắt là ES.

Hiện nay, distributed search đã trở thành cấu hình tiêu chuẩn của phần lớn hệ thống Java trong ngành Internet; ES đặc biệt phổ biến. Trước đây, khi ES chưa phổ biến, mọi người thường dùng solr. Nhưng vài năm gần đây, về cơ bản phần lớn doanh nghiệp và dự án đã bắt đầu chuyển sang ES.

Vì vậy, trong phỏng vấn ngành Internet, chắc chắn người ta sẽ trao đổi với bạn về distributed search engine, tức là nhất định sẽ nói về ES. Nếu thực sự không biết thì bạn đã lỗi thời rồi.

Nếu người phỏng vấn hỏi câu đầu tiên thì thông thường sẽ hỏi bạn có thể giới thiệu thiết kế kiến trúc phân tán của ES không. Họ muốn xem mức độ hiểu biết cơ bản của bạn về kiến trúc search engine phân tán.

## Phân tích câu hỏi phỏng vấn

Ý tưởng thiết kế của ElasticSearch là một distributed search engine; bên dưới nó vẫn dựa trên lucene. Ý tưởng cốt lõi là khởi chạy nhiều ES process instance trên nhiều máy để tạo thành một ES cluster.

**Đơn vị cơ bản để lưu trữ dữ liệu trong ES là index**. Ví dụ, nếu muốn lưu một số dữ liệu đơn hàng trong ES thì cần tạo index `order_idx` trong ES và ghi toàn bộ dữ liệu đơn hàng vào index này. Một index gần tương đương với một database trong mysql.

```
index -> type -> mapping -> document -> field
```

Để giải thích trực quan hơn, tôi sẽ đưa ra một phép so sánh ở đây. Nhưng cần nhớ, đừng đồng nhất hai bên; phép so sánh chỉ nhằm giúp dễ hiểu.

index tương đương với database trong mysql. Còn type thì không có khái niệm tương đương trong mysql. Một index có thể có nhiều type; các field của mỗi type gần như giống nhau nhưng có một số khác biệt nhỏ. Giả sử có một index là index đơn hàng, chuyên lưu dữ liệu đơn hàng. Có thể so sánh với việc tạo table trong mysql: một số đơn hàng là đơn hàng hóa vật lý như quần áo, giày; một số là đơn hàng hóa ảo như thẻ game, nạp tiền điện thoại. Hai loại đơn hàng có phần lớn field giống nhau nhưng một số field có thể hơi khác nhau.

Vì vậy, trong index đơn hàng sẽ tạo hai type: type đơn hàng hóa vật lý và type đơn hàng hóa ảo. Phần lớn field của hai type này giống nhau, một số ít field thì khác nhau.

Trong nhiều trường hợp, một index có thể chỉ có một type. Tuy nhiên, nếu một index có nhiều type (**lưu ý**: khái niệm `mapping types` đã bị loại bỏ hoàn toàn trong ElasticSearch 7. X; xem chi tiết trong [tài liệu chính thức](https://github.com/elastic/elasticsearch/blob/6.5/docs/reference/mapping/removal_of_types.asciidoc)), có thể xem index như một table thuộc một nhóm; từng type cụ thể đại diện cho một table trong mysql. Mỗi type có một mapping. Nếu xem type là một table cụ thể thì index đại diện cho nhóm type cùng thuộc một loại, còn mapping là **định nghĩa cấu trúc table** của type đó. Khi tạo table trong mysql, chắc chắn cần định nghĩa cấu trúc table, gồm những field nào và kiểu của từng field. Trên thực tế, một bản ghi dữ liệu được ghi vào một type trong index được gọi là một document; một document tương ứng với một hàng trong một table mysql. Mỗi document có nhiều field, mỗi field tương ứng với giá trị của một trường trong document đó.

![es-index-type-mapping-document-field](../../high-concurrency/images/es-index-type-mapping-document-field.png)

Một index có thể được chia thành nhiều `shard`; mỗi shard lưu một phần dữ liệu. Việc chia thành nhiều shard có lợi ích: thứ nhất là **hỗ trợ mở rộng theo chiều ngang**. Ví dụ, dữ liệu của bạn là 3T và có 3 shard, mỗi shard chứa 1T dữ liệu. Nếu lượng dữ liệu tăng lên 4T thì mở rộng thế nào? Rất đơn giản: tạo lại index có 4 shard rồi nạp dữ liệu vào. Thứ hai là **cải thiện hiệu năng**: dữ liệu nằm trên nhiều shard, tức nhiều server; mọi thao tác đều được thực thi song song, phân tán trên nhiều máy, giúp tăng throughput và hiệu năng.

Tiếp theo, dữ liệu của shard thực tế có nhiều bản sao; nghĩa là mỗi shard có một `primary shard` phụ trách ghi dữ liệu và một vài `replica shard`. Sau khi `primary shard` ghi dữ liệu, nó đồng bộ dữ liệu sang một số `replica shard` khác.

![es-cluster](../../high-concurrency/images/es-cluster.png)

Nhờ phương án replica này, dữ liệu của mỗi shard có nhiều bản sao. Nếu một máy bị sập thì cũng không sao vì còn bản sao dữ liệu trên các máy khác. Vậy là có high availability.

Trong một ES cluster có nhiều node, hệ thống tự bầu một node làm master node. Master node thực hiện một số công việc quản lý, chẳng hạn duy trì metadata của index và chịu trách nhiệm chuyển đổi vai trò primary shard/replica shard. Nếu master node bị sập thì hệ thống sẽ bầu lại một node làm master.

Nếu một node không phải master bị sập, master node sẽ chuyển vai trò primary shard trên node bị sập sang replica shard trên một máy khác. Sau khi sửa máy bị sập và khởi động lại, master node sẽ điều khiển việc phân bổ replica shard còn thiếu sang đó và đồng bộ các dữ liệu đã thay đổi sau này, v.v., để cluster khôi phục bình thường.

Nói đơn giản hơn: nếu một node không phải master bị sập thì primary shard trên node đó cũng mất. Khi ấy master sẽ chuyển replica shard tương ứng với primary shard đó (nằm trên các máy khác) thành primary shard. Nếu máy bị sập được sửa chữa thì node sau khi khôi phục sẽ không còn là primary shard mà trở thành replica shard.

Trên đây là thiết kế kiến trúc cơ bản nhất của ElasticSearch với vai trò distributed search engine.
