# Làm thế nào để tìm các URL trùng nhau trong một lượng lớn URL?

## Mô tả bài toán

Cho hai tệp a và b, mỗi tệp lưu trữ 5 tỷ URL, mỗi URL chiếm 64B, giới hạn bộ nhớ là 4G. Hãy tìm các URL xuất hiện trong cả hai tệp a và b.

## Hướng giải quyết

### 1. Chiến lược chia để trị

Mỗi URL chiếm 64B, vậy 5 tỷ URL chiếm khoảng 320GB dung lượng.

> 5, 000, 000, 000 _ 64B ≈ 5GB _ 64 = 320GB

Vì bộ nhớ chỉ có 4G nên chúng ta không thể tải tất cả URL vào bộ nhớ cùng lúc để xử lý. Với dạng bài này, thường dùng **chiến lược chia để trị**, tức là: chia URL trong một tệp thành nhiều tệp nhỏ theo một đặc điểm nào đó, sao cho kích thước mỗi tệp nhỏ không vượt quá 4G; khi đó có thể đọc tệp nhỏ vào bộ nhớ để xử lý.

**Ý tưởng như sau**:

Trước tiên, duyệt tệp a, tính `hash(URL) % 1000` cho mỗi URL và lưu URL đó vào một trong các tệp a<sub>0</sub>, a<sub>1</sub>, a<sub>2</sub>, ..., a<sub>999</sub> theo kết quả tính toán; như vậy mỗi tệp có kích thước khoảng 300MB. Dùng cách tương tự để duyệt tệp b và lưu các URL trong tệp b lần lượt vào các tệp b<sub>0</sub>, b<sub>1</sub>, b<sub>2</sub>, ..., b<sub>999</sub>. Sau bước này, mọi URL có thể trùng nhau đều nằm trong các tệp nhỏ tương ứng, tức a<sub>0</sub> tương ứng với b<sub>0</sub>, ..., a<sub>999</sub> tương ứng với b<sub>999</sub>; các cặp tệp không tương ứng không thể chứa URL trùng nhau. Vì vậy, tiếp theo chỉ cần tìm các URL trùng nhau trong 1000 cặp tệp nhỏ này.

Tiếp theo, duyệt a<sub>i</sub> ( `i∈[0,999]` ), lưu các URL vào một tập HashSet. Sau đó duyệt từng URL trong b<sub>i</sub> và kiểm tra xem URL đó có trong tập HashSet hay không; nếu có thì đó là URL chung và có thể lưu URL này vào một tệp riêng.

### 2. Cây tiền tố có khả thi không?

> Nói chung, độ dài URL không chênh lệch nhiều và phần lớn các URL có chung một vài ký tự đầu. Trong trường hợp này, cấu trúc dữ liệu **cây từ điển** (trie tree) rất phù hợp để lưu trữ, vừa giảm chi phí lưu trữ vừa tăng hiệu suất truy vấn.
>
> Góp ý từ [@ChunelFeng](https://github.com/ChunelFeng). [#212](https://github.com/doocs/advanced-java/issues/212)

Có issue hỏi liệu có thể dùng trực tiếp cây trie hay không; hãy cùng ước tính tính khả thi của phương án này.

Bối cảnh: máy 4G, phân tích 320G dữ liệu.

Trước hết, đề bài nêu kích thước 64B; nếu tính mỗi ký tự là một byte thì đó là 64 bit, tức gồm 64 ký tự (ở đây xét trường hợp cực đoan). Không nhắc lại định nghĩa cây trie ở đây, xem [cây từ điển](https://doocs.github.io/leetcode/tags/#%E5%A4%9A%E7%BA%BF%E7%A8%8B).

- **Chiều cao cây**: Độ dài URL chính là chiều cao tối đa của cây cuối cùng, tức cây có thể cao tối đa 64 tầng.

- **Số nút con của một nút**: Vì đây là URL nên ngoài chữ số và chữ cái còn có `%`, `/`, `:`v.v. Để đơn giản hóa phép tính và dễ hiểu, ở đây chỉ dùng tổng số chữ cái tiếng Anh và chữ số = 62+10=72. Nghĩa là một nút có tối đa 72 nút con, tức chiếm 72B.

- **Tổng kích thước các nút**: Vì tập dữ liệu 320G đủ lớn nên xét trường hợp xấu nhất, cây cuối cùng cao 64 tầng và là cây đầy đủ có 72 nhánh. Bộ nhớ cuối cùng cần dùng bằng số lượng nút * kích thước mỗi nút:

  - Số lượng nút: cây đầy đủ có N = 64 tầng, K = 72 nhánh; công thức tính số nút của cây (tổng cấp số nhân) là: `1 * (1-72^64)/ (1 - 72) = (72^64 - 1)/ (71)`, ước tính là `71^63` nút.

  - Kích thước mỗi nút: mỗi nút chiếm 1B
    - Ký tự hiện tại: 1B
    - Vị trí hiện tại có giá trị hay không: 1b (kích thước Bool thường dùng), ở đây lấy kích thước nhỏ nhất.

Vì vậy, tổng kích thước là: `71^63 * 1B/ 1000 ≈ 71^60 KB ≈ 71 ^ 63 GB`; giá trị này đã rất lớn, trong khi phép ước tính phương án còn dựa trên giả định tối thiểu.

---

Đến đây, có thể một số độc giả đã thấy choáng: sao lại ra nhiều dữ liệu đến vậy, cây trie chẳng phải có tác dụng nén sao?

Kết quả trên không chính xác, vì với 320G dữ liệu, số nút được tạo ra nhiều nhất cũng chỉ là 320G (khi các đường đi hoàn toàn không trùng nhau); không thể tạo thành cây N nhánh đầy đủ như đã bàn ở trên, mà chỉ lấp đầy một phần. Tuy nhiên, với một máy đơn lẻ, lượng dữ liệu này vốn đã không thể phân tích được; phương án cũng thiếu khả năng mở rộng và độ ổn định. Vì vậy, cây trie đơn thuần phụ thuộc quá nhiều vào phân bố dữ liệu. Nếu phần lớn URL của bạn giống nhau thì tỷ lệ nén rất cao, một máy 4G có thể phân tích 320G; nhưng với tình huống ứng dụng mà người phỏng vấn muốn nghe, khả năng này quá thấp. Vì thế vẫn phải dùng phương pháp chia để trị để giảm bộ nhớ.

Tối ưu phương án một: trong cách trước, ta dùng HaseSet để loại trùng; hash có hiệu suất cao hơn thao tác truy cập cây trie, còn trie có thể giảm bộ nhớ.

Do đó, trong phỏng vấn có thể đề cập đến phương án trie. Trong tình huống này, phân tích 320G dữ liệu ngoại tuyến không nhạy cảm về thời gian, nên có thể hy sinh tốc độ để đổi lấy không gian.

- Phương án một nêu kích thước mỗi tệp đơn là hơn 300MB; sau khi dùng cây trie, kích thước hơn 300MB này có thể được nén, chẳng hạn còn hơn 200MB. Xét đến mức sử dụng tài nguyên máy, trong một số tình huống có đủ CPU, có thể cân nhắc chạy song song: do tỷ lệ nén là 1/3, phần dung lượng còn lại có thể dùng để nạp thêm tệp và tăng tốc độ xử lý bằng xử lý đồng thời.

- Nếu không đủ CPU, chẳng hạn chỉ có một lõi, có thể cân nhắc tăng kích thước tệp chia nhỏ: giảm số tệp từ 1000 xuống 200, tức kích thước tệp tăng gấp năm lần; từ 300MB trước đó thành 300*5 = 1.5G. Trên máy 4G có thể tận dụng gần hết bộ nhớ, giảm số lần I/O và giảm số lần sao chép từ kernel mode sang user mode; cũng có thể nhắc đến DMA.

## Tổng kết phương pháp

### Chiến lược chia để trị

1. Chia để trị, lấy phần dư của hàm băm;
1. Dùng HashSet để thống kê từng tệp con.

### Cây tiền tố

1. Tận dụng tiền tố chung của chuỗi, hy sinh tốc độ để giảm mức sử dụng bộ nhớ.
