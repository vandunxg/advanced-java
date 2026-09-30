# Làm thế nào để tìm IP truy cập trang Baidu nhiều nhất trong một ngày?

## Mô tả bài toán

Có một lượng lớn dữ liệu nhật ký được lưu trong một tệp rất lớn mà không thể đọc trực tiếp vào bộ nhớ. Yêu cầu là tìm IP truy cập Baidu nhiều nhất trong một ngày cụ thể.

## Hướng giải quyết

Bài toán này chỉ quan tâm đến IP truy cập Baidu nhiều nhất trong một ngày, vì vậy trước tiên có thể duyệt tệp một lần và ghi thông tin liên quan đến các IP truy cập Baidu trong ngày đó vào một tệp lớn riêng. Tiếp theo, áp dụng phương pháp giống bài trước: trước tiên ánh xạ IP bằng hàm băm, sau đó dùng HashMap thống kê số lần mỗi IP bị lặp, cuối cùng tìm IP có số lần lặp nhiều nhất.

> Lưu ý: Ở đây chỉ cần tìm IP xuất hiện nhiều nhất nên không nhất thiết phải dùng heap, chỉ cần dùng một biến max.

## Tổng kết phương pháp

1. Chia để trị, lấy phần dư của hàm băm;
2. Dùng HashMap để thống kê tần suất;
3. Tìm TopN **lớn nhất** thì dùng **heap min**; tìm TopN **nhỏ nhất** thì dùng **heap max**.
