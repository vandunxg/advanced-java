# Quá trình rehash của Redis

## Câu hỏi phỏng vấn

Bạn đã tìm hiểu quy trình Redis rehash chưa?

## Phân tích suy nghĩ của người phỏng vấn

Đây là một điểm phỏng vấn tương đối ít gặp trong Redis. Tuy nhiên, khi giới thiệu quy trình rehash của HashMap hoặc ConcurrentHashMap, bạn có thể chủ động đề cập với người phỏng vấn rằng ngoài việc hiểu những nội dung này, bạn còn biết quy trình rehash trong Redis.

Redis nổi tiếng vì tốc độ nhanh và hiệu năng tốt. Ta biết dung lượng ban đầu của Redis có giới hạn; khi dung lượng không đủ thì cần mở rộng. Vậy mở rộng theo cách nào? Chuyển toàn bộ dữ liệu cùng một lúc sao? Nếu lượng dữ liệu lên đến hàng chục hoặc hàng trăm triệu thì việc này chắc chắn sẽ block việc Redis thực thi các lệnh. Vì vậy cần tìm hiểu quá trình rehash trong Redis.

## Phân tích câu hỏi phỏng vấn

Như mọi người đều biết, Redis chủ yếu được dùng để lưu trữ các cặp key-value (`Key-Value Pair`), và dictionary đảm nhiệm việc lưu trữ các cặp key-value. Dictionary trong Redis lại được triển khai bên dưới bằng hash table. Các node trong hash table lưu các cặp key-value của dictionary. Tương tự HashMap trong Java, Key được ánh xạ tới vị trí node trong hash table thông qua hàm hash.

Cấu trúc dữ liệu dictionary trong Redis như sau:

```c
// Cấu trúc dữ liệu tương ứng với dictionary; có thể tham khảo cấu trúc hash table trong mã nguồn Redis, nên không mô tả lại ở đây
typedef struct dict {
    dictType *type;  // Loại dictionary
    void *privdata;  // Dữ liệu private
    dictht ht[2];    // 2 hash table; đây cũng là cấu trúc dữ liệu quan trọng để thực hiện rehash, qua đó có thể thấy dictionary được triển khai bên dưới bằng hash table.
    long rehashidx;   // Dấu hiệu quan trọng của quá trình rehash; giá trị -1 nghĩa là rehash chưa diễn ra
    int iterators;   //  Số lượng iterator hiện đang lặp
} dict;
```

Khi mở rộng hoặc thu nhỏ hash table, chương trình cần rehash toàn bộ các cặp key-value có trong hash table hiện tại sang hash table mới. Quy trình cụ thể như sau:

### 1. Cấp phát bộ nhớ cho hash table dự phòng của dictionary.

Nếu thực hiện thao tác mở rộng thì kích thước hash table dự phòng là lũy thừa của 2 nhỏ nhất lớn hơn hoặc bằng số lượng cặp key-value trong hash table cần mở rộng nhân với 2 (2 mũ n);【`5*2=10,` vì vậy dung lượng hash table dự phòng là lũy thừa của 2 nhỏ nhất lớn hơn 10, tức 16】

Nếu thực hiện thao tác thu nhỏ thì kích thước hash table dự phòng là lũy thừa của 2 nhỏ nhất lớn hơn hoặc bằng số lượng cặp key-value trong hash table cần mở rộng (`ht[0] .used`).

### 2. Rehash tiệm tiến

Khi lượng dữ liệu rất lớn (vài chục triệu hoặc hàng trăm triệu), quy trình rehash không hoàn tất trong một lần mà được thực hiện **tiệm tiến**. Ưu điểm của **rehash tiệm tiến** là tránh ảnh hưởng đến server.

Bản chất của rehash tiệm tiến:

1. Dùng rehashidx để phân bổ đều phần công việc tính toán cần thiết cho việc rehash các cặp key-value vào từng thao tác thêm, xóa, tìm kiếm và cập nhật trên dictionary, từ đó tránh khối lượng tính toán khổng lồ do rehash tập trung gây ra.
2. Trong khi rehash đang diễn ra, mỗi lần chương trình thực hiện một thao tác thêm, xóa, tìm kiếm hoặc cập nhật trên dictionary, ngoài việc thực hiện thao tác được chỉ định, chương trình còn rehash toàn bộ các cặp key-value trong hash table cũ tại chỉ mục rehashidx sang hash table dự phòng. Khi công việc rehash hoàn tất, chương trình tăng giá trị thuộc tính rehashidx lên 1.
