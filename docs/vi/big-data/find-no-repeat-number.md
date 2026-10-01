# Làm thế nào để tìm các số nguyên không lặp lại trong một lượng lớn dữ liệu?

## Mô tả bài toán

Tìm các số nguyên không lặp lại trong 250 triệu số nguyên. Lưu ý: bộ nhớ không đủ để chứa 250 triệu số nguyên này.

## Hướng giải quyết

### Phương pháp 1: Chia để trị

Tương tự các bài trước, trước tiên chia 250 triệu số thành nhiều tệp nhỏ, dùng HashSet/HashMap để tìm các số nguyên không lặp lại trong từng tệp nhỏ, rồi hợp nhất kết quả của các tệp con để có kết quả cuối cùng.

### Phương pháp 2: Phương pháp bitmap

**Bitmap** là cách dùng một hoặc nhiều bit để đánh dấu giá trị tương ứng với một phần tử; phần tử đó chính là khóa. Lưu dữ liệu theo đơn vị bit có thể tiết kiệm đáng kể dung lượng lưu trữ.

Bitmap dùng mảng bit để biểu diễn một số phần tử có tồn tại hay không. Có thể dùng nó để tìm kiếm nhanh, loại trùng, sắp xếp, v.v. Chưa rõ lắm? Trước tiên, xem một ví dụ nhỏ.

Giả sử cần sắp xếp 5 phần tử (6, 4, 2, 1, 5) trong phạm vi `[0,7]`; có thể dùng phương pháp bitmap. Trong phạm vi 0~7 có tổng cộng 8 số, chỉ cần 8bit, tức 1 byte. Trước tiên, đặt tất cả các bit thành 0:

```
0 0 0 0 0 0 0 0
```

Sau đó duyệt 5 phần tử. Gặp số 6 trước tiên thì đặt bit 0 ở chỉ số 6 thành 1; tiếp theo gặp số 4 thì đặt bit 0 ở chỉ số 4 thành 1:

```
0 0 0 0 1 0 1 0
```

Tiếp tục duyệt lần lượt; sau khi kết thúc, mảng bit sẽ như sau:

```
0 1 1 0 1 1 1 0
```

Mỗi bit có giá trị 1 tương ứng với một số được biểu thị bằng chỉ số của bit đó:

```
for i in range(8):
    if bits[i] == 1:
        print(i)
```

Như vậy, thực ra chúng ta đã thực hiện được việc sắp xếp.

Để giải các thuật toán liên quan đến số nguyên, **phương pháp bitmap** là một thuật toán rất hữu ích. Giả sử số nguyên int chiếm 4B, tức 32bit, thì số lượng số nguyên có thể biểu diễn là 2<sup>32</sup>.

**Với bài toán này**, ta dùng 2 bit để biểu diễn trạng thái của từng số:

-   00 biểu thị số này chưa xuất hiện;
-   01 biểu thị số này đã xuất hiện một lần (chính là số nguyên không lặp lại mà đề bài cần tìm);
-   10 biểu thị số này đã xuất hiện nhiều lần.

Như vậy, với 2<sup>32</sup> số nguyên, tổng bộ nhớ cần dùng là 2<sup>32</sup>\*2b=1GB. Vì vậy, khi bộ nhớ khả dụng lớn hơn 1GB thì có thể dùng phương pháp bitmap. Giả sử bộ nhớ đáp ứng yêu cầu của bitmap, thực hiện các thao tác sau:

Duyệt 250 triệu số nguyên và xem các bit tương ứng trong bitmap: nếu là 00 thì đổi thành 01, nếu là 01 thì đổi thành 10, nếu là 10 thì giữ nguyên. Sau khi duyệt xong, xem bitmap và xuất các số nguyên có bit tương ứng là 01.

Tất nhiên, đề bài đặc biệt nêu rằng **bộ nhớ không đủ để chứa 250 triệu số nguyên**. Dung lượng bộ nhớ của 250 triệu số nguyên là: 2.5e8/1024/1024/1024 \* 4=3.72GB. Nếu bộ nhớ lớn hơn 1GB thì có thể giải quyết bằng phương pháp bitmap.

## Tổng kết phương pháp

**Đối với bài toán xác định số có bị lặp hay không**, phương pháp bitmap rất hiệu quả; tất nhiên, điều kiện tiên quyết là bộ nhớ phải đáp ứng dung lượng lưu trữ mà bitmap yêu cầu.
