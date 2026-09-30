# Tối ưu hiệu năng truy vấn ES

## Câu hỏi phỏng vấn

Khi lượng dữ liệu trong ES rất lớn (quy mô hàng tỷ bản ghi), làm thế nào để cải thiện hiệu quả truy vấn?

## Phân tích suy nghĩ của người phỏng vấn

Câu hỏi này chắc chắn sẽ được hỏi. Nói đơn giản, họ muốn biết bạn đã thực sự làm việc với es chưa, vì sao? Thực tế hiệu năng es không tốt như bạn nghĩ. Nhiều khi lượng dữ liệu lớn, đặc biệt khi có vài trăm triệu bản ghi, bạn có thể bối rối khi thấy một lần tìm kiếm mất tới `5~10s`, thật phiền. Lần tìm kiếm đầu tiên mất `5~10s`, nhưng các lần sau lại nhanh hơn, có thể chỉ vài trăm mili giây.

Bạn sẽ tự hỏi: mỗi người dùng truy cập lần đầu đều chậm và giật như vậy sao? Nếu chưa từng dùng es hoặc chỉ tự làm vài demo, bạn dễ bối rối trước câu hỏi này và thể hiện rằng mình chưa thực sự thành thạo es.

## Phân tích câu hỏi phỏng vấn

Nói thật, tối ưu hiệu năng es không có viên đạn bạc. Nghĩa là **đừng mong chỉ cần tùy ý chỉnh một tham số là có thể giải quyết mọi tình huống hiệu năng chậm**. Có thể trong một số tình huống, đổi tham số hoặc chỉnh cú pháp là giải quyết được, nhưng tuyệt đối không phải mọi tình huống đều như vậy.

### Vũ khí tối ưu hiệu năng — filesystem cache

Dữ liệu bạn ghi vào es thực tế được ghi vào các file trên đĩa. **Khi truy vấn**, hệ điều hành tự động cache dữ liệu trong file trên đĩa vào `filesystem cache`.

![es-search-process](./images/es-search-process.png)

Search engine của es phụ thuộc rất nhiều vào `filesystem cache` bên dưới. Nếu cấp thêm bộ nhớ cho `filesystem cache`, cố gắng để bộ nhớ chứa được toàn bộ file dữ liệu chỉ mục `idx segment file `, thì khi tìm kiếm hầu hết thao tác sẽ chạy trong bộ nhớ và hiệu năng sẽ rất cao.

Chênh lệch hiệu năng có thể lớn đến đâu? Trong nhiều lần kiểm thử và load test trước đây, nếu truy cập đĩa thì thường chắc chắn mất hơn một giây; hiệu năng tìm kiếm tính bằng giây, như 1 giây, 5 giây hoặc 10 giây. Nhưng nếu dùng `filesystem cache`, tức hoàn toàn chạy trong bộ nhớ, thì hiệu năng thường cao hơn truy cập đĩa một bậc độ lớn, cơ bản ở mức mili giây, từ vài mili giây đến vài trăm mili giây.

Đây là một trường hợp thực tế. Cụm es của một công ty có 3 máy; mỗi máy trông có vẻ rất nhiều bộ nhớ, 64G, tổng bộ nhớ là `64 * 3 = 192G`. Mỗi máy cấp cho es jvm heap `32G`, vậy bộ nhớ còn lại dành cho `filesystem cache` chỉ là `32G` mỗi máy, tổng cộng cụm chỉ cấp `32 * 3 = 96G` bộ nhớ cho `filesystem cache`. Trong khi đó, các file dữ liệu index trên toàn bộ đĩa chiếm tổng cộng `1T` trên 3 máy; lượng dữ liệu es là `1T`, tức mỗi máy có `300G` dữ liệu. Hiệu năng như vậy có tốt không? Bộ nhớ của `filesystem cache` chỉ khoảng 100G, chỉ một phần mười dữ liệu nằm được trong bộ nhớ, phần còn lại ở trên đĩa; sau đó khi chạy tìm kiếm, phần lớn thao tác đều truy cập đĩa nên hiệu năng chắc chắn kém.

Tóm lại, để es có hiệu năng tốt, trong tình huống lý tưởng bộ nhớ của máy ít nhất phải chứa được một nửa tổng lượng dữ liệu.

Theo kinh nghiệm thực tế của chúng tôi, tốt nhất chỉ lưu một lượng nhỏ dữ liệu trong es, tức **những index dùng để tìm kiếm**. Nếu bộ nhớ dành cho `filesystem cache` là 100G thì giữ dữ liệu index trong phạm vi `100G`; khi đó gần như toàn bộ dữ liệu được tìm kiếm trong bộ nhớ nên hiệu năng rất cao, thường dưới 1 giây.

Ví dụ, hiện có một hàng dữ liệu với 30 field: `id,name,age ....`. Nhưng khi tìm kiếm, bạn chỉ cần dựa vào ba field `id,name,age`. Nếu ngây thơ ghi vào es toàn bộ field của một hàng dữ liệu thì `90%` dữ liệu không dùng để tìm kiếm nhưng vẫn chiếm không gian `filesystem cache` trên máy es. Kích thước dữ liệu mỗi bản ghi càng lớn thì lượng dữ liệu mà `filesystem cahce` cache được càng ít. Thực ra, chỉ cần ghi một vài field **được dùng để tìm kiếm** vào es, chẳng hạn ba field `id,name,age`; các field khác có thể lưu trong mysql/hbase. Thông thường chúng tôi khuyến nghị kiến trúc `es + hbase`.

Đặc điểm của hbase là **phù hợp để lưu trữ trực tuyến lượng dữ liệu khổng lồ**: có thể ghi lượng dữ liệu rất lớn vào hbase, nhưng không nên tìm kiếm phức tạp; chỉ cần các thao tác truy vấn đơn giản theo id hoặc phạm vi. Tìm kiếm theo name và age trong es có thể trả về 20 `doc id`; sau đó dùng `doc id` để truy vấn từng bản ghi tương ứng trong hbase, lấy **dữ liệu đầy đủ** rồi trả về frontend.

Tốt nhất dữ liệu ghi vào es nhỏ hơn hoặc bằng, hay nhỉnh hơn một chút so với dung lượng bộ nhớ `filesystem cache` của es. Sau đó tìm kiếm trong es có thể chỉ tốn 20ms; rồi dùng id es trả về để truy vấn 20 bản ghi trong hbase, có thể chỉ tốn thêm 30ms. Trước đây nếu lưu cả 1T dữ liệu trong es thì mỗi lần truy vấn có thể mất 5–10 giây; với cách này hiệu năng có thể cao hơn rất nhiều, mỗi truy vấn chỉ mất khoảng 50ms.

### Làm nóng dữ liệu

Giả sử bạn đã làm theo phương án trên nhưng lượng dữ liệu ghi vào mỗi máy trong cụm es vẫn vượt gấp đôi `filesystem cache`; chẳng hạn ghi 60G dữ liệu vào một máy trong khi `filesystem cache` chỉ có 30G, vậy 30G dữ liệu vẫn nằm trên đĩa.

Thực ra có thể **làm nóng dữ liệu**.

Ví dụ với Weibo, có thể lấy dữ liệu của một số người nổi tiếng có nhiều người theo dõi và thường được xem; chủ động xây dựng một hệ thống backend để cứ cách một lúc lại tìm kiếm dữ liệu nóng và đưa chúng vào `filesystem cache`. Khi người dùng truy cập dữ liệu nóng sau đó, họ sẽ tìm kiếm trực tiếp trong bộ nhớ, rất nhanh.

Hoặc với thương mại điện tử, có thể chọn một số sản phẩm thường được xem nhiều, chẳng hạn iPhone 8; xây dựng một chương trình backend chủ động truy cập dữ liệu nóng mỗi phút một lần để đưa nó vào `filesystem cache`.

Với dữ liệu mà bạn cho là nóng và thường được truy cập, tốt nhất hãy **xây dựng một subsystem chuyên làm nóng cache**: chủ động truy cập dữ liệu nóng trước theo chu kỳ để đưa dữ liệu vào `filesystem cache`. Khi người khác truy cập lần sau, hiệu năng chắc chắn sẽ tốt hơn nhiều.

### Tách biệt dữ liệu nóng và lạnh

es có thể thực hiện kiểu sharding ngang tương tự mysql: ghi riêng lượng dữ liệu lớn nhưng ít được truy cập, tần suất thấp vào một index; còn dữ liệu nóng được truy cập thường xuyên thì ghi riêng vào một index khác. Tốt nhất **ghi dữ liệu lạnh vào một index và dữ liệu nóng vào một index khác**. Như vậy có thể đảm bảo sau khi làm nóng dữ liệu, dữ liệu nóng được giữ lại trong `filesystem os cache` nhiều nhất có thể, **không để dữ liệu lạnh đẩy nó ra khỏi cache**.

Giả sử bạn có 6 máy và 2 index: một index lưu dữ liệu lạnh, một index lưu dữ liệu nóng; mỗi index có 3 shard. Ba máy lưu hot data index, ba máy còn lại lưu cold data index. Khi đó phần lớn thời gian bạn truy cập hot data index; dữ liệu nóng có thể chỉ chiếm 10% tổng dữ liệu, lượng này nhỏ nên gần như được giữ toàn bộ trong `filesystem cache`, đảm bảo hiệu năng truy cập dữ liệu nóng cao. Dữ liệu lạnh nằm trong index khác, không cùng máy với hot data index nên hai bên hầu như không liên quan. Nếu có người truy cập dữ liệu lạnh thì có thể phần lớn dữ liệu nằm trên đĩa, hiệu năng thấp hơn; nhưng chỉ 10% người dùng truy cập dữ liệu lạnh và 90% truy cập dữ liệu nóng nên cũng không sao.

### Thiết kế document model

Với MySQL, chúng ta thường có một số truy vấn join phức tạp. Trong es nên xử lý thế nào? Cố gắng không dùng các truy vấn liên kết phức tạp trong es; một khi dùng thì hiệu năng thường không tốt.

Tốt nhất hãy hoàn tất việc join trong hệ thống Java trước rồi ghi trực tiếp dữ liệu đã join vào es. Khi tìm kiếm, không cần dùng cú pháp tìm kiếm es để thực hiện join hoặc các truy vấn liên kết khác.

Thiết kế document model rất quan trọng. Với nhiều thao tác, đừng đợi đến khi tìm kiếm mới muốn thực thi đủ loại xử lý phức tạp. es chỉ hỗ trợ một số thao tác nhất định; đừng dùng es làm những việc mà nó xử lý không tốt. Nếu thực sự có thao tác như vậy, cố gắng hoàn thành ngay khi thiết kế document model hoặc lúc ghi dữ liệu. Ngoài ra, nên tránh các thao tác quá phức tạp như truy vấn join/nested/parent-child vì hiệu năng đều kém.

### Tối ưu hiệu năng phân trang

Phân trang trong es khá tệ, vì sao? Lấy ví dụ: mỗi trang có 10 bản ghi, hiện bạn muốn truy vấn trang thứ 100. Thực tế mỗi shard sẽ trả 1000 bản ghi đầu tiên về một coordinating node. Nếu có 5 shard thì sẽ có 5000 bản ghi; tiếp đó coordinating node gộp và xử lý 5000 bản ghi này rồi lấy 10 bản ghi cuối cùng của trang thứ 100.

Vì là hệ thống phân tán, khi cần lấy 10 bản ghi ở trang thứ 100 thì không thể chỉ lấy 2 bản ghi từ mỗi trong 5 shard rồi gộp thành 10 bản ghi ở coordinating node. **Bắt buộc** phải lấy 1000 bản ghi từ mỗi shard, rồi sắp xếp, lọc theo yêu cầu, sau đó phân trang lần nữa để lấy dữ liệu ở trang thứ 100. Càng lật đến trang sâu, mỗi shard trả càng nhiều dữ liệu và coordinating node xử lý càng lâu; chuyện này rất phiền. Vì vậy khi phân trang bằng es, càng lật về sau càng chậm.

Trước đây chúng tôi cũng gặp vấn đề này. Khi phân trang bằng es, vài trang đầu chỉ mất vài chục mili giây; khi đến trang 10 hoặc vài chục trang thì cơ bản cần 5–10 giây mới truy vấn được một trang.

Có giải pháp nào không?

#### Không cho phép phân trang sâu (hiệu năng mặc định của phân trang sâu rất kém)

Trao đổi với product manager rằng hệ thống không cho phép lật trang quá sâu; theo mặc định lật càng sâu thì hiệu năng càng kém.

#### Cách tương tự như liên tục cuộn xuống để xem từng trang sản phẩm đề xuất trong app

Tương tự thao tác cuộn xuống để xem từng trang Weibo, có thể dùng `scroll api`; tự tìm trên mạng cách sử dụng.

scroll tạo **snapshot của toàn bộ dữ liệu** một lần; sau đó mỗi lần cuộn sang trang tiếp theo sẽ di chuyển bằng **cursor** `scroll_id` để lấy trang kế tiếp. Hiệu năng cao hơn rất nhiều so với cách phân trang ở trên, về cơ bản ở mức mili giây.

Tuy nhiên, cách này chỉ phù hợp với tình huống cuộn xuống từng trang tương tự Weibo; **không thể tùy ý nhảy đến bất kỳ trang nào**. Nghĩa là bạn không thể vào trang 10 trước, sau đó sang trang 120 rồi quay lại trang 58; không thể nhảy trang tùy ý. Vì vậy hiện nay nhiều sản phẩm không cho phép lật trang tùy ý; app và một số website chỉ cho cuộn xuống từng trang.

Khi khởi tạo phải chỉ định tham số `scroll` để cho es biết cần lưu context của lần tìm kiếm này trong bao lâu. Cần đảm bảo người dùng không liên tục lật trang trong vài giờ; nếu không request có thể thất bại do timeout.

Ngoài `scroll api`, cũng có thể dùng `search_after`. Ý tưởng của `search_after` là dùng kết quả trang trước để hỗ trợ tìm dữ liệu trang tiếp theo. Rõ ràng cách này cũng không cho phép nhảy trang tùy ý; chỉ có thể lần lượt lật từng trang về sau. Khi khởi tạo, cần dùng một field có giá trị duy nhất làm field sort.
