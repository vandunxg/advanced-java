# Nguyên lý ghi dữ liệu của ES

## Câu hỏi phỏng vấn

Quy trình ghi dữ liệu của ES hoạt động như thế nào? Quy trình truy vấn dữ liệu của ES hoạt động ra sao? Hãy giới thiệu Lucene bên dưới ES. Bạn có biết inverted index không?

## Phân tích suy nghĩ của người phỏng vấn

Thực ra khi hỏi câu này, người phỏng vấn muốn xem bạn có hiểu một số nguyên lý cơ bản của es không, vì dùng es chẳng qua là ghi dữ liệu và tìm kiếm dữ liệu. Nếu không hiểu es đang làm gì khi bạn gửi request ghi và tìm kiếm thì thật sự...

Với es, về cơ bản nó là hộp đen; bạn còn có thể làm gì? Việc duy nhất có thể làm là dùng API es để đọc ghi dữ liệu. Nếu có vấn đề xảy ra mà bạn không biết gì thì còn có thể trông đợi gì ở bạn?

## Phân tích câu hỏi phỏng vấn

### Quy trình ghi dữ liệu es

-   Client chọn một node để gửi request; node này là `coordinating node` (node điều phối).
-   `coordinating node` **định tuyến** document rồi chuyển tiếp request đến node tương ứng (có primary shard).
-   `primary shard` trên node thực tế xử lý request, sau đó đồng bộ dữ liệu đến `replica node`.
-   Khi `coordinating node` nhận thấy `primary node` và toàn bộ `replica node` đã hoàn tất, nó trả kết quả phản hồi cho client.

![es-write](./images/es-write.png)

### Quy trình đọc dữ liệu es

Có thể truy vấn bằng `doc id`; hệ thống hash `doc id` để xác định nó đã được phân bổ vào shard nào, rồi truy vấn từ shard đó.

-   Client gửi request đến **bất kỳ** node nào; node đó trở thành `coordinate node`.
-   `coordinate node` hash và định tuyến theo `doc id`, chuyển tiếp request đến node tương ứng. Lúc này dùng thuật toán **round-robin** để chọn ngẫu nhiên một node trong `primary shard` và các replica của nó, giúp cân bằng tải các request đọc.
-   Node nhận request trả document về `coordinate node`.
-   `coordinate node` trả document cho client.

### Quy trình tìm kiếm dữ liệu es

Điểm mạnh nhất của es là full-text search. Ví dụ, có ba dữ liệu:

```
java真好玩儿啊
java好难学啊
j2ee特别牛
```

Tìm kiếm theo từ khóa `java` để tìm ra các `document` có chứa `java`. es sẽ trả về: java thật vui, java thật khó học.

-   Client gửi request đến một `coordinate node`.
-   Node điều phối chuyển request tìm kiếm đến `primary shard` hoặc `replica shard` tương ứng của **tất cả** shard; cả hai loại đều được.
-   query phase: mỗi shard trả kết quả tìm kiếm riêng (thực ra là một số `doc id`) về node điều phối; node này gộp, sắp xếp, phân trang dữ liệu, v.v. để tạo ra kết quả cuối cùng.
-   fetch phase: sau đó node điều phối dựa trên `doc id` để **lấy dữ liệu thực tế** của `document` từ các node, rồi trả kết quả cuối cùng cho client.

> Request ghi dữ liệu được ghi vào primary shard rồi đồng bộ đến tất cả replica shard; request đọc có thể đọc từ primary shard hoặc replica shard, dùng thuật toán round-robin ngẫu nhiên.

### Nguyên lý bên dưới khi ghi dữ liệu

![es-write-detail](./images/es-write-detail.png)

Trước tiên, dữ liệu được ghi vào memory buffer; trong lúc nằm trong buffer thì chưa thể tìm kiếm được. Đồng thời, dữ liệu cũng được ghi vào file log translog.

Nếu buffer sắp đầy hoặc đã đến một khoảng thời gian nhất định, dữ liệu trong memory buffer sẽ được `refresh` vào một `segment file` mới. Tuy nhiên, lúc này dữ liệu chưa trực tiếp vào file `segment file` trên đĩa mà trước tiên vào `os cache`. Quá trình này chính là `refresh`.

Cứ mỗi 1 giây, es ghi dữ liệu trong buffer vào một `segment file` **mới**; mỗi giây tạo ra một **file đĩa mới** `segment file`, chứa dữ liệu được ghi vào buffer trong giây gần nhất.

Nếu lúc đó buffer không có dữ liệu thì dĩ nhiên không thực hiện thao tác refresh. Nếu buffer có dữ liệu, theo mặc định cứ mỗi giây thực hiện refresh một lần và đẩy dữ liệu vào một segment file mới.

Trong hệ điều hành, file trên đĩa đều có một thành phần gọi là `os cache`, tức cache của hệ điều hành. Trước khi dữ liệu được ghi vào file trên đĩa, nó sẽ vào `os cache`, một cache bộ nhớ ở cấp hệ điều hành. Ngay khi dữ liệu trong `buffer` được thao tác refresh đẩy vào `os cache`, dữ liệu đó có thể tìm kiếm được.

Vì sao gọi es là **gần thời gian thực**? `NRT` là viết tắt của `near real-time`. Mặc định cứ mỗi giây refresh một lần, nên es là gần thời gian thực: dữ liệu được ghi vào sau 1 giây mới có thể được nhìn thấy. Có thể dùng `restful api` hoặc `java api` của es để **thủ công** thực hiện thao tác refresh một lần, tức đẩy dữ liệu trong buffer vào `os cache` để dữ liệu có thể được tìm thấy ngay. Khi dữ liệu đã được đưa vào `os cache`, buffer sẽ được xóa vì không cần giữ lại nữa; dữ liệu đã được lưu bền vững một bản trên đĩa trong translog.

Lặp lại các bước trên: dữ liệu mới liên tục vào buffer và translog; dữ liệu trong `buffer` liên tục được ghi vào nhiều `segment file` mới; sau mỗi lần `refresh`, buffer được xóa còn translog được giữ lại. Khi quá trình tiếp diễn, translog ngày càng lớn. Khi translog đạt đến độ dài nhất định, thao tác `commit` sẽ được kích hoạt.

Bước đầu của thao tác commit là `refresh` dữ liệu hiện có trong buffer vào `os cache` rồi xóa buffer. Sau đó, ghi một `commit point` vào file trên đĩa; trong đó đánh dấu toàn bộ `segment file` tương ứng với `commit point` này, đồng thời buộc toàn bộ dữ liệu hiện có trong `os cache` được `fsync` xuống file trên đĩa. Cuối cùng **xóa sạch** file log translog hiện tại và khởi động một translog mới; lúc này thao tác commit hoàn tất.

Thao tác commit này được gọi là `flush`. Mặc định tự động thực hiện `flush` mỗi 30 phút; nếu translog quá lớn thì cũng kích hoạt `flush`. Thao tác flush tương ứng với toàn bộ quá trình commit. Có thể dùng API es để thực hiện flush thủ công, buộc dữ liệu trong os cache được fsync xuống đĩa.

File log translog có tác dụng gì? Trước khi thực hiện commit, dữ liệu hoặc nằm trong buffer hoặc nằm trong os cache; cả buffer lẫn os cache đều ở bộ nhớ. Nếu máy gặp sự cố thì toàn bộ dữ liệu trong bộ nhớ sẽ mất. Vì vậy cần ghi các thao tác tương ứng với dữ liệu vào file log chuyên dụng `translog`. Nếu máy bị sập lúc đó, khi khởi động lại es sẽ tự động đọc dữ liệu trong file log translog và khôi phục vào memory buffer và os cache.

Bản thân translog cũng được ghi vào os cache trước; mặc định cứ mỗi 5 giây mới flush xuống đĩa. Vì vậy, theo mặc định có thể có 5 giây dữ liệu chỉ nằm trong buffer hoặc os cache của file translog mà chưa ở trên đĩa; nếu máy bị sập lúc đó thì **mất** 5 giây dữ liệu. Nhưng hiệu năng tốt hơn; tối đa chỉ mất 5 giây dữ liệu. Cũng có thể đặt translog để mỗi thao tác ghi đều phải `fsync` trực tiếp xuống đĩa, nhưng hiệu năng sẽ kém hơn nhiều.

-   `index.translog.sync_interval` kiểm soát khoảng thời gian translog fsync xuống đĩa; tối thiểu là 100ms;
-   `index.translog.durability` quyết định translog được flush mỗi 5 giây hay fsync trong mỗi request. Tham số này có hai giá trị: request (mỗi request đều thực hiện fsync; es chờ translog fsync xuống đĩa rồi mới trả về thành công) và async (giá trị mặc định; translog fsync mỗi 5 giây).

Thực ra, nếu người phỏng vấn chưa hỏi vấn đề mất dữ liệu của es thì bạn có thể thể hiện hiểu biết ở đây: es là gần thời gian thực, dữ liệu có thể tìm kiếm được sau 1 giây; dữ liệu cũng có thể bị mất. Có 5 giây dữ liệu nằm trong buffer, translog os cache hoặc segment file os cache mà chưa ở trên đĩa; nếu máy bị sập lúc này thì sẽ dẫn đến **mất dữ liệu** trong 5 giây.

**Tóm tắt**: dữ liệu được ghi vào memory buffer trước, sau đó cứ mỗi giây được refresh vào os cache; khi vào os cache thì dữ liệu có thể tìm kiếm được (vì vậy mới nói từ lúc ghi đến lúc tìm kiếm được có độ trễ 1 giây). Cứ mỗi 5 giây, dữ liệu được ghi vào file translog (nếu máy sập và toàn bộ dữ liệu bộ nhớ mất thì tối đa mất 5 giây dữ liệu). Khi translog đạt độ lớn nhất định hoặc mặc định mỗi 30 phút, thao tác commit được kích hoạt để flush dữ liệu trong buffer vào file segment file trên đĩa.

> Sau khi dữ liệu được ghi vào segment file, inverted index cũng được xây dựng.

### Nguyên lý bên dưới khi xóa/cập nhật dữ liệu

Với thao tác xóa, khi commit sẽ tạo file `.del`, trong đó đánh dấu một doc ở trạng thái `deleted`; khi tìm kiếm, hệ thống dựa vào file `.del` để biết doc đó đã bị xóa hay chưa.

Với thao tác cập nhật, doc cũ được đánh dấu ở trạng thái `deleted`, sau đó ghi một bản ghi dữ liệu mới.

Mỗi lần buffer refresh sẽ tạo ra một `segment file`; vì vậy theo mặc định cứ mỗi giây có một `segment file` mới và số segment file ngày càng tăng. Lúc này hệ thống định kỳ thực hiện merge. Mỗi lần merge, nhiều `segment file` được gộp thành một; đồng thời các doc được đánh dấu `deleted` sẽ bị **xóa vật lý**. Sau đó ghi `segment file` mới vào đĩa, ghi một `commit point` để đánh dấu tất cả `segment file` mới, mở `segment file` cho tìm kiếm và xóa `segment file` cũ.

### lucene ở tầng bên dưới

Nói đơn giản, lucene là một jar package chứa nhiều đoạn code thuật toán đã được đóng gói để xây dựng inverted index. Khi phát triển bằng Java, chỉ cần thêm lucene jar rồi dùng API của lucene.

Thông qua lucene, có thể tạo index cho dữ liệu sẵn có; lucene sẽ tổ chức cấu trúc dữ liệu index trên đĩa cục bộ.

### Inverted index

Trong search engine, mỗi document có một document ID tương ứng; nội dung document được biểu diễn thành tập hợp các từ khóa. Ví dụ, document 1 sau khi tách từ có 20 từ khóa; với mỗi từ khóa sẽ ghi lại số lần và vị trí nó xuất hiện trong document.

Như vậy, inverted index là ánh xạ từ **từ khóa đến document ID**; mỗi từ khóa tương ứng với một loạt tài liệu có chứa từ khóa đó.

Lấy một ví dụ.

Có các document sau:

| DocId | Nội dung Doc                                   |
| ----- | ---------------------------------------------- |
| 1     | Cha đẻ Google Maps chuyển sang Facebook        |
| 2     | Cha đẻ Google Maps gia nhập Facebook           |
| 3     | Nhà sáng lập Google Maps, Lars, rời Google và gia nhập Facebook |
| 4     | Cha đẻ Google Maps chuyển sang Facebook, liên quan đến việc hủy dự án Wave |
| 5     | Cha đẻ Google Maps Lars gia nhập mạng xã hội Facebook |

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