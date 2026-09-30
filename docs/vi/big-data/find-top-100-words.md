# Làm thế nào để tìm các từ xuất hiện thường xuyên nhất trong lượng lớn dữ liệu?

## Mô tả bài toán

Có một tệp dung lượng 1GB, mỗi dòng trong tệp là một từ, kích thước mỗi từ không quá 16B, giới hạn bộ nhớ là 1MB. Yêu cầu trả về 100 từ có tần suất cao nhất (Top 100).

## Hướng giải quyết

Do giới hạn bộ nhớ, chúng ta vẫn không thể đọc trực tiếp tất cả từ trong tệp lớn vào bộ nhớ cùng lúc. Vì vậy, cũng có thể dùng **chiến lược chia để trị**, chia một tệp lớn thành nhiều tệp nhỏ, bảo đảm kích thước mỗi tệp nhỏ hơn 1MB để có thể đọc trực tiếp từng tệp nhỏ vào bộ nhớ xử lý.

**Ý tưởng như sau**:

Trước tiên, duyệt tệp lớn; với mỗi từ x được duyệt, tính `hash(x) % 5000` và lưu từ đó vào tệp a<sub>i</sub> có kết quả bằng i. Sau khi duyệt xong, ta có 5000 tệp nhỏ. Mỗi tệp có kích thước khoảng 200KB. Nếu một số tệp nhỏ vẫn vượt quá 1MB thì tiếp tục chia nhỏ theo cách tương tự.

Tiếp theo, thống kê 100 từ có tần suất xuất hiện cao nhất trong từng tệp nhỏ. Cách đơn giản nhất là dùng HashMap. Trong đó, key là từ, value là tần suất xuất hiện của từ. Cách làm cụ thể: với từ x được duyệt, nếu từ đó không có trong map thì thực hiện `map.put(x, 1)`; nếu đã có thì thực hiện `map.put(x, map.get(x)+1)`, tăng tần suất của từ lên 1.

Trên đây ta đã thống kê tần suất xuất hiện của các từ trong từng tệp nhỏ. Tiếp theo, có thể duy trì một **heap min** để tìm 100 từ có tần suất xuất hiện cao nhất trong tất cả các từ. Cách làm cụ thể: lần lượt duyệt từng tệp nhỏ và tạo một **heap min** có kích thước 100. Nếu số lần xuất hiện của từ đang duyệt lớn hơn số lần xuất hiện của từ ở đỉnh heap thì thay từ ở đỉnh bằng từ mới, sau đó điều chỉnh lại thành **heap min**. Khi duyệt xong, các từ trong heap min chính là 100 từ có tần suất xuất hiện cao nhất.

## Tổng kết phương pháp

1. Chia để trị, lấy phần dư của hàm băm;
2. Dùng HashMap để thống kê tần suất;
3. Tìm TopN **lớn nhất** thì dùng **heap min**; tìm TopN **nhỏ nhất** thì dùng **heap max**.
