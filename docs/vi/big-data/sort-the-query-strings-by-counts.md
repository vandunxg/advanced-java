# Làm thế nào để sắp xếp query theo tần suất?

## Mô tả bài toán

Có 10 tệp, mỗi tệp có kích thước 1G; mỗi dòng trong từng tệp lưu query của người dùng và query trong mỗi tệp có thể bị lặp. Yêu cầu sắp xếp theo tần suất của query.

## Hướng giải quyết

Nếu query có tỷ lệ lặp lại cao thì có thể cân nhắc đọc tất cả query vào bộ nhớ xử lý cùng lúc; nếu tỷ lệ lặp lại không cao thì bộ nhớ khả dụng không đủ để chứa tất cả query, khi đó cần dùng phương pháp chia để trị hoặc phương pháp khác.

### Phương pháp 1: Dùng HashMap

Nếu query có tỷ lệ lặp lại cao, tức tổng số query khác nhau tương đối nhỏ, có thể cân nhắc tải tất cả query vào HashMap trong bộ nhớ. Sau đó có thể sắp xếp theo số lần xuất hiện của query.

### Phương pháp 2: Chia để trị

Cần xác định quy mô chia bài toán bằng cách dựa vào lượng dữ liệu và dung lượng bộ nhớ khả dụng. Với bài toán này, có thể lần lượt duyệt query trong 10 tệp, dùng hàm băm `hash(query) % 10` để chia các query vào 10 tệp nhỏ. Sau đó dùng HashMap để thống kê số lần xuất hiện của query trong từng tệp nhỏ, sắp xếp theo số lần xuất hiện rồi ghi vào một tệp riêng khác.

Tiếp theo, sắp xếp tất cả các tệp theo số lần xuất hiện của query; ở đây có thể dùng merge sort (vì không thể đọc tất cả query vào bộ nhớ nên cần dùng external sort).

## Tổng kết phương pháp

-   Nếu đủ bộ nhớ, đọc trực tiếp dữ liệu vào để sắp xếp;
-   Nếu không đủ bộ nhớ, trước tiên chia dữ liệu thành các tệp nhỏ; sau khi sắp xếp từng tệp nhỏ, dùng external sort để hợp nhất.
