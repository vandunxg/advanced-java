# Làm thế nào để kiểm tra một số có tồn tại trong lượng dữ liệu lớn?

## Mô tả bài toán

Cho 4 tỷ số nguyên kiểu unsigned int không trùng lặp và chưa được sắp xếp, sau đó cho thêm một số; làm thế nào để nhanh chóng xác định số này có nằm trong 4 tỷ số nguyên đó không?

## Hướng giải quyết

### Phương pháp 1: Chia để trị

Vẫn có thể dùng phương pháp chia để trị để giải quyết, cách làm tương tự phần trước nên không nhắc lại ở đây.

### Phương pháp 2: Phương pháp bitmap

Vì phạm vi của số unsigned int là `[0, 1 << 32)`, ta dùng `1<<32=4,294,967,296` bit để biểu diễn từng số. Ban đầu các bit đều bằng 0, do đó tổng bộ nhớ cần dùng là: 4,294,967,296b≈512M.

Ta đọc 4 tỷ số nguyên này và đặt bit tương ứng thành 1. Tiếp theo, đọc số cần tìm và kiểm tra bit tương ứng có bằng 1 hay không; nếu bằng 1 thì số đó tồn tại, nếu bằng 0 thì không tồn tại.

## Tổng kết phương pháp

**Đối với bài toán xác định một số có tồn tại hay không và bài toán xác định số bị trùng lặp**, phương pháp bitmap rất hiệu quả.
