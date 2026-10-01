# Nguyên lý ghi dữ liệu của ES

## Câu hỏi phỏng vấn

Quy trình ghi dữ liệu của ES hoạt động như thế nào? Quy trình truy vấn dữ liệu của ES hoạt động ra sao? Hãy giới thiệu Lucene bên dưới ES. Bạn có biết inverted index không?

## Phân tích suy nghĩ của người phỏng vấn

Thực ra, câu hỏi này nhằm xem bạn có hiểu một số nguyên lý cơ bản của es hay không, vì dùng es chẳng qua cũng chỉ là ghi và tìm kiếm dữ liệu. Nếu không hiểu es đang làm gì khi bạn gửi request ghi và tìm kiếm thì thật sự...

Đối với es, về cơ bản nó là một hộp đen; bạn còn có thể làm gì? Việc duy nhất bạn có thể làm là dùng API của es để đọc và ghi dữ liệu. Nếu có vấn đề xảy ra mà bạn không biết gì thì còn có thể trông đợi gì ở bạn?

## Phân tích câu hỏi phỏng vấn

### Quy trình ghi dữ liệu của es

-   Client chọn một node để gửi request; node này là `coordinating node` (node điều phối).
-   `coordinating node` **định tuyến** document rồi chuyển tiếp request đến node tương ứng (có primary shard).
-   Node chứa `primary shard` xử lý request, sau đó đồng bộ dữ liệu đến `replica node`.
-   Khi `coordinating node` nhận thấy `primary node` và toàn bộ `replica node` đã hoàn tất, nó trả kết quả phản hồi cho client.

![es-write](../../high-concurrency/images/es-write.png)

### Quy trình đọc dữ liệu của es

Có thể truy vấn bằng `doc id`; hệ thống hash `doc id` để xác định `doc id` đã được phân bổ vào shard nào, rồi truy vấn từ shard đó.

-   Client gửi request đến **bất kỳ** node nào; node đó trở thành `coordinate node`.
-   `coordinate node` hash và định tuyến theo `doc id`, chuyển tiếp request đến node tương ứng. Lúc này dùng `round-robin`, tức **thuật toán luân phiên ngẫu nhiên**, để chọn một node trong `primary shard` và các replica của nó, giúp cân bằng tải cho các request đọc.
-   Node nhận request trả document về `coordinate node`.
-   `coordinate node` trả document cho client.

### Quy trình tìm kiếm dữ liệu của es

Điểm mạnh nhất của es là full-text search. Ví dụ, có ba mẫu dữ liệu:

```
java真好玩儿啊
java好难学啊
j2ee特别牛
```

Tìm kiếm theo từ khóa `java` để tìm ra các `document` có chứa `java`. es sẽ trả về: java thật vui, java thật khó học.

-   Client gửi request đến một `coordinate node`.
-   Node điều phối chuyển request tìm kiếm đến `primary shard` hoặc `replica shard` của **tất cả** các shard; loại nào cũng được.
-   query phase: mỗi shard trả kết quả tìm kiếm riêng (thực ra là một số `doc id`) về node điều phối; node này gộp, sắp xếp, phân trang dữ liệu, v.v. để tạo ra kết quả cuối cùng.
-   fetch phase: sau đó node điều phối dựa trên `doc id` để **lấy dữ liệu thực tế** của `document` từ các node, rồi trả kết quả cuối cùng cho client.

> Đối với request ghi, dữ liệu được ghi vào primary shard rồi đồng bộ đến tất cả replica shard; request đọc có thể đọc từ primary shard hoặc replica shard, sử dụng thuật toán round-robin ngẫu nhiên.

### Nguyên lý bên dưới của việc ghi dữ liệu

![es-write-detail](../../high-concurrency/images/es-write-detail.png)

Trước tiên, dữ liệu được ghi vào memory buffer; khi còn nằm trong buffer, dữ liệu chưa thể tìm kiếm được. Đồng thời, dữ liệu cũng được ghi vào file log translog.

Nếu buffer sắp đầy hoặc đến thời điểm nhất định, dữ liệu trong memory buffer sẽ được `refresh` vào một `segment file` mới. Tuy nhiên, lúc này dữ liệu chưa đi thẳng vào `segment file` trên đĩa mà trước hết đi vào `os cache`. Quá trình này chính là `refresh`.

Cứ mỗi 1 giây, es ghi dữ liệu trong buffer vào một `segment file` **mới**; mỗi giây tạo ra một **file mới trên đĩa** gọi là `segment file`, và `segment file` này chứa dữ liệu được ghi vào buffer trong giây gần nhất.

Nếu lúc đó buffer không có dữ liệu thì dĩ nhiên không thực hiện thao tác refresh. Nếu buffer có dữ liệu, theo mặc định cứ mỗi giây thực hiện refresh một lần và đẩy dữ liệu vào một segment file mới.

Trong hệ điều hành, file trên đĩa đều có một thành phần gọi là `os cache`, tức cache của hệ điều hành. Trước khi dữ liệu được ghi vào file trên đĩa, nó sẽ vào `os cache`, một cache bộ nhớ ở cấp hệ điều hành. Chỉ cần dữ liệu trong `buffer` được refresh vào `os cache` là dữ liệu có thể tìm kiếm được.

Vì sao gọi es là **gần thời gian thực**? `NRT` là viết tắt của `near real-time`. Mặc định cứ mỗi giây refresh một lần, nên es là gần thời gian thực: dữ liệu được ghi vào phải sau 1 giây mới có thể nhìn thấy. Có thể dùng `restful api` hoặc `java api` của es để **thủ công** thực hiện thao tác refresh một lần, tức đẩy dữ liệu trong buffer vào `os cache` để dữ liệu có thể được tìm kiếm ngay. Khi dữ liệu đã được đưa vào `os cache`, buffer sẽ được xóa vì không cần giữ lại nữa; dữ liệu đã được lưu bền vững một bản trên đĩa trong translog.

Lặp lại các bước trên: dữ liệu mới liên tục vào buffer và translog; dữ liệu trong `buffer` liên tục được ghi vào nhiều `segment file` mới; sau mỗi lần `refresh`, buffer được xóa còn translog được giữ lại. Khi quá trình tiếp diễn, translog ngày càng lớn. Khi translog đạt đến độ dài nhất định, thao tác `commit` sẽ được kích hoạt.

Bước đầu của thao tác commit là `refresh` dữ liệu hiện có trong buffer vào `os cache` rồi xóa buffer. Sau đó, ghi một `commit point` vào file trên đĩa; trong đó, `commit point` này đánh dấu toàn bộ `segment file` tương ứng, đồng thời buộc toàn bộ dữ liệu hiện có trong `os cache` được `fsync` xuống file trên đĩa. Cuối cùng **xóa sạch** file log translog hiện tại và khởi động một translog mới; lúc này thao tác commit hoàn tất.

Thao tác commit này được gọi là `flush`. Mặc định tự động thực hiện `flush` mỗi 30 phút; nếu translog quá lớn thì cũng kích hoạt `flush`. Thao tác flush tương ứng với toàn bộ quá trình commit. Có thể dùng API es để thực hiện flush thủ công, buộc dữ liệu trong os cache được fsync xuống đĩa.

File log translog có tác dụng gì? Trước khi thực hiện commit, dữ liệu hoặc nằm trong buffer hoặc nằm trong os cache; cả buffer lẫn os cache đều ở bộ nhớ. Nếu máy gặp sự cố thì toàn bộ dữ liệu trong bộ nhớ sẽ mất. Vì vậy cần ghi các thao tác tương ứng với dữ liệu vào file log chuyên dụng `translog`. Nếu máy bị sập lúc đó, khi khởi động lại es sẽ tự động đọc dữ liệu trong file log translog và khôi phục vào memory buffer và os cache.

Bản thân translog cũng được ghi vào os cache trước; mặc định cứ mỗi 5 giây mới flush xuống đĩa. Vì vậy, theo mặc định có thể có 5 giây dữ liệu chỉ nằm trong buffer hoặc os cache của file translog mà chưa được ghi xuống đĩa; nếu máy bị sập lúc đó thì **mất** dữ liệu của 5 giây. Nhưng hiệu năng tốt hơn; tối đa chỉ mất dữ liệu của 5 giây. Cũng có thể đặt translog để mỗi thao tác ghi đều phải `fsync` trực tiếp xuống đĩa, nhưng hiệu năng sẽ kém hơn nhiều.

-   `index.translog.sync_interval` kiểm soát khoảng thời gian translog fsync xuống đĩa; tối thiểu là 100ms;
-   `index.translog.durability` quyết định translog được flush mỗi 5 giây hay fsync trong mỗi request. Tham số này có hai giá trị: request (mỗi request đều thực hiện fsync; es chờ translog fsync xuống đĩa rồi mới trả về thành công) và async (giá trị mặc định; translog fsync mỗi 5 giây).

Thực ra, nếu người phỏng vấn chưa hỏi về vấn đề mất dữ liệu của es thì bạn có thể nhân đây thể hiện hiểu biết: es là gần thời gian thực, dữ liệu có thể tìm kiếm được sau 1 giây; dữ liệu cũng có thể bị mất. Có 5 giây dữ liệu nằm trong buffer, translog os cache hoặc segment file os cache mà chưa được ghi xuống đĩa; nếu máy bị sập lúc này thì sẽ dẫn đến **mất dữ liệu** trong 5 giây.

**Tóm tắt**: dữ liệu được ghi vào memory buffer trước, sau đó cứ mỗi giây được refresh vào os cache; khi vào os cache thì dữ liệu có thể tìm kiếm được (vì vậy mới nói từ lúc ghi đến lúc tìm kiếm được có độ trễ 1 giây). Cứ mỗi 5 giây, dữ liệu được ghi vào file translog (nếu máy sập và toàn bộ dữ liệu bộ nhớ mất thì tối đa mất dữ liệu của 5 giây). Khi translog đạt độ lớn nhất định hoặc mặc định mỗi 30 phút, thao tác commit được kích hoạt để flush dữ liệu trong buffer vào các segment file trên đĩa.

> Sau khi dữ liệu được ghi vào segment file, inverted index cũng được xây dựng.

### Nguyên lý bên dưới của việc xóa/cập nhật dữ liệu

Với thao tác xóa, khi commit sẽ tạo file `.del`, trong đó đánh dấu một doc ở trạng thái `deleted`; khi tìm kiếm, hệ thống dựa vào file `.del` để biết doc đó đã bị xóa hay chưa.

Với thao tác cập nhật, doc cũ được đánh dấu ở trạng thái `deleted`, sau đó ghi một bản ghi dữ liệu mới.

Mỗi lần buffer refresh sẽ tạo ra một `segment file`; vì vậy theo mặc định cứ mỗi giây có một `segment file` mới và số `segment file` ngày càng tăng. Lúc này hệ thống định kỳ thực hiện merge. Mỗi lần merge, nhiều `segment file` được gộp thành một; đồng thời các doc được đánh dấu `deleted` sẽ bị **xóa vật lý**. Sau đó ghi `segment file` mới vào đĩa, ghi một `commit point` để đánh dấu tất cả `segment file` mới, mở `segment file` cho tìm kiếm và xóa `segment file` cũ.

### Lucene ở tầng bên dưới

Nói đơn giản, Lucene là một gói JAR chứa các đoạn mã thuật toán xây dựng inverted index đã được đóng gói sẵn. Khi phát triển bằng Java, chỉ cần thêm file JAR của Lucene rồi sử dụng API của Lucene.

Thông qua Lucene, có thể tạo index cho dữ liệu hiện có; Lucene sẽ tổ chức cấu trúc dữ liệu index trên đĩa cục bộ.

### Inverted index

Trong search engine, mỗi document có một document ID tương ứng; nội dung document được biểu diễn thành một tập hợp các từ khóa. Ví dụ, document 1 sau khi tách từ có 20 từ khóa; với mỗi từ khóa sẽ ghi lại số lần và vị trí nó xuất hiện trong document.

Như vậy, inverted index là ánh xạ từ **từ khóa đến document** ID; mỗi từ khóa tương ứng với một loạt tài liệu có chứa từ khóa đó.

Lấy một ví dụ.

Có các document sau:

| DocId | Nội dung Doc                                   |
| ----- | ---------------------------------------------- |
| 1     | 谷歌地图之父跳槽 Facebook                      |
| 2     | 谷歌地图之父加盟 Facebook                      |
| 3     | 谷歌地图创始人拉斯离开谷歌加盟 Facebook        |
| 4     | 谷歌地图之父跳槽 Facebook 与 Wave 项目取消有关 |
| 5     | 谷歌地图之父拉斯加盟社交网站 Facebook          |

Sau khi tách từ các document, ta có **inverted index** sau:

| WordId | Từ       | DocIds        |
| ------ | -------- | ------------- |
| 1      | 谷歌     | 1, 2, 3, 4, 5 |
| 2      | 地图     | 1, 2, 3, 4, 5 |
| 3      | 之父     | 1, 2, 4, 5    |
| 4      | 跳槽     | 1, 4          |
| 5      | Facebook | 1, 2, 3, 4, 5 |
| 6      | 加盟     | 2, 3, 5       |
| 7      | 创始人   | 3             |
| 8      | 拉斯     | 3, 5          |
| 9      | 离开     | 3             |
| 10     | 与       | 4             |
| ..     | ..       | ..            |

Ngoài ra, inverted index hữu ích còn có thể ghi lại nhiều thông tin hơn, chẳng hạn document frequency, biểu thị có bao nhiêu document trong tập hợp tài liệu chứa một từ.

Nhờ inverted index, search engine có thể dễ dàng phản hồi truy vấn của người dùng. Ví dụ, người dùng nhập từ khóa `Facebook`; hệ thống tìm kiếm tra inverted index, đọc ra các document có chứa từ này và cung cấp chúng cho người dùng làm kết quả tìm kiếm.

Cần lưu ý hai chi tiết quan trọng về inverted index:

-   Tất cả term trong inverted index đều tương ứng với một hoặc nhiều document;
-   Các term trong inverted index **được sắp xếp tăng dần theo thứ tự từ điển**

> Trên đây chỉ là ví dụ đơn giản, không được sắp xếp nghiêm ngặt theo thứ tự từ điển tăng dần.
