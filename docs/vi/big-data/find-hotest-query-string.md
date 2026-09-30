# Làm thế nào để tìm các chuỗi truy vấn phổ biến nhất?

## Mô tả bài toán

Công cụ tìm kiếm ghi lại tất cả chuỗi truy vấn mà người dùng sử dụng trong mỗi lần tìm kiếm thông qua các tệp nhật ký; độ dài mỗi chuỗi truy vấn không quá 255 byte.

Giả sử hiện có 1000w bản ghi (các chuỗi truy vấn này có tỷ lệ trùng lặp khá cao; tuy tổng số là 1000w nhưng sau khi loại trùng thì không quá 300w). Hãy thống kê 10 chuỗi truy vấn phổ biến nhất, với yêu cầu bộ nhớ sử dụng không vượt quá 1G. (Một chuỗi truy vấn càng được lặp lại nhiều thì càng có nhiều người dùng tìm kiếm chuỗi đó, tức là càng phổ biến.)

## Hướng giải quyết

Chuỗi truy vấn dài tối đa 255B; 1000w chuỗi cần khoảng 2.55G bộ nhớ, vì vậy chúng ta không thể đọc tất cả chuỗi vào bộ nhớ để xử lý.

### Phương pháp 1: Chia để trị

Chia để trị vẫn là một phương pháp rất hữu ích.

Chia thành nhiều tệp nhỏ để bảo đảm các chuỗi trong mỗi tệp nhỏ có thể được tải trực tiếp vào bộ nhớ xử lý, rồi tìm 10 chuỗi xuất hiện nhiều nhất trong từng tệp; cuối cùng dùng một heap min để thống kê 10 chuỗi xuất hiện nhiều nhất trong tất cả các tệp.

Phương pháp này khả thi, nhưng chưa phải tốt nhất; dưới đây là các phương pháp khác.

### Phương pháp 2: Dùng HashMap

Tuy tổng số chuỗi khá lớn, nhưng sau khi loại trùng không quá 300w; do đó có thể lưu tất cả chuỗi cùng số lần xuất hiện vào một HashMap. Dung lượng cần dùng là 300w\*(255+4)≈777M (trong đó 4 là số byte một số nguyên chiếm dụng). Như vậy có thể thấy bộ nhớ 1G hoàn toàn đủ.

**Ý tưởng như sau**:

Trước tiên, duyệt các chuỗi; nếu chuỗi chưa có trong map thì đưa trực tiếp vào map và đặt value bằng 1; nếu đã có thì tăng value tương ứng lên 1. Độ phức tạp thời gian của bước này là `O(N)` .

Tiếp theo, duyệt map và tạo một heap min gồm 10 phần tử. Nếu số lần xuất hiện của chuỗi đang duyệt lớn hơn số lần xuất hiện của chuỗi ở đỉnh heap thì thay thế chuỗi ở đỉnh, rồi điều chỉnh heap thành heap min.

Sau khi duyệt xong, 10 chuỗi trong heap là những chuỗi xuất hiện nhiều nhất. Độ phức tạp thời gian của bước này là `O(Nlog10)` .

### Phương pháp 3: Dùng cây tiền tố

Phương pháp hai dùng HashMap để thống kê số lần xuất hiện. Khi các chuỗi có nhiều tiền tố chung, có thể dùng cây tiền tố để thống kê số lần xuất hiện; nút cây lưu số lần chuỗi xuất hiện, giá trị 0 biểu thị chuỗi chưa xuất hiện.

**Ý tưởng như sau**:

Khi duyệt các chuỗi, hãy tìm trong cây tiền tố; nếu tìm thấy thì tăng số lần xuất hiện của chuỗi được lưu tại nút lên 1, nếu không thì tạo các nút mới cho chuỗi này; sau khi tạo xong, đặt số lần xuất hiện của chuỗi tại nút lá thành 1.

Cuối cùng vẫn dùng heap min để sắp xếp các chuỗi theo số lần xuất hiện.

## Tổng kết phương pháp

Cây tiền tố thường được dùng để thống kê số lần xuất hiện của chuỗi. Một ứng dụng quan trọng khác của nó là tra cứu chuỗi, chẳng hạn xác định có chuỗi nào bị trùng lặp hay không.
