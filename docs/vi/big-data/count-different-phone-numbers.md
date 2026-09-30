# Làm thế nào để đếm số lượng số điện thoại khác nhau?

## Mô tả bài toán

Một tệp có chứa một số số điện thoại, mỗi số gồm 8 chữ số. Hãy đếm số lượng số điện thoại khác nhau.

## Hướng giải quyết

Về bản chất, bài toán này vẫn là bài toán **dữ liệu trùng lặp**. Với dạng bài toán này, thông thường trước tiên nên cân nhắc phương pháp bitmap.

Trong bài toán này, số điện thoại gồm 8 chữ số có thể biểu diễn 10<sup>8</sup> số, tức là 100 triệu số. Ta dùng một bit để biểu diễn mỗi số, vậy tổng cộng cần 100 triệu bit, chiếm khoảng 12M bộ nhớ.

**Ý tưởng như sau**:

Tạo một mảng bitmap có độ dài 100 triệu, khởi tạo tất cả phần tử bằng 0. Sau đó duyệt qua toàn bộ số điện thoại và đặt vị trí tương ứng trong bitmap thành 1. Sau khi duyệt xong, nếu bit bằng 1 thì số điện thoại đó tồn tại trong tệp; nếu không thì không tồn tại. Số lượng bit có giá trị 1 chính là số lượng số điện thoại khác nhau.

## Tổng kết phương pháp

Khi giải bài toán dữ liệu trùng lặp, hãy nhớ cân nhắc phương pháp bitmap.
