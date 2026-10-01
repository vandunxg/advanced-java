# Quy trình Redis rehash

## Câu hỏi phỏng vấn

Bạn đã tìm hiểu quy trình Redis rehash chưa?

## Phân tích suy nghĩ của người phỏng vấn

Đây là một nội dung phỏng vấn Redis ít gặp hơn. Tuy nhiên, khi giới thiệu quy trình rehash của HashMap hoặc ConcurrentHashMap, bạn có thể chủ động đề cập với người phỏng vấn rằng ngoài việc hiểu những nội dung này, bạn còn biết quy trình rehash trong Redis.

Redis nổi tiếng về tốc độ và hiệu năng. Ta biết dung lượng ban đầu của Redis có giới hạn; khi không đủ dung lượng thì cần mở rộng. Vậy mở rộng theo cách nào? Chuyển toàn bộ dữ liệu cùng một lúc sao? Nếu lượng dữ liệu lên đến hàng chục hoặc hàng trăm triệu thì việc này chắc chắn sẽ block quá trình Redis thực thi lệnh. Vì vậy cần tìm hiểu quy trình rehash trong Redis.

## Phân tích câu hỏi phỏng vấn

Như mọi người đều biết, Redis chủ yếu dùng để lưu các cặp key-value (`Key-Value Pair`); dictionary triển khai cách lưu trữ các cặp key-value, còn dictionary trong Redis được triển khai bên dưới bằng hash table. Các node trong hash table lưu các cặp key-value của dictionary. Cách này tương tự HashMap trong Java: ánh xạ Key đến vị trí node trong hash table thông qua hàm hash.

Cấu trúc dữ liệu dictionary trong Redis như sau:

```c
// 字典对应的数据结构，有关hash表的结构可以参考redis源码，再次就不进行描述
typedef struct dict {
    dictType *type;  // 字典类型
    void *privdata;  // 私有数据
    dictht ht[2];    // 2个哈希表，这也是进行rehash的重要数据结构，从这也看出字典的底层通过哈希表进行实现。
    long rehashidx;   // rehash过程的重要标志，值为-1表示rehash未进行
    int iterators;   //  当前正在迭代的迭代器数
} dict;
```

Khi mở rộng hoặc thu nhỏ hash table, chương trình cần rehash toàn bộ cặp key-value trong hash table hiện tại sang hash table mới. Quy trình cụ thể như sau:

### 1. Cấp phát bộ nhớ cho hash table dự phòng của dictionary.

Nếu thực hiện thao tác mở rộng thì kích thước hash table dự phòng là lũy thừa 2 nhỏ nhất lớn hơn hoặc bằng số cặp key-value trong hash table cần mở rộng nhân 2: 2^(số mũ n);【`5*2=10,` nên dung lượng hash table dự phòng là lũy thừa 2 nhỏ nhất lớn hơn 10, tức 16】

Nếu thực hiện thao tác thu nhỏ thì kích thước hash table dự phòng là lũy thừa 2 nhỏ nhất lớn hơn hoặc bằng số cặp key-value trong hash table cần mở rộng (`ht[0] .used`).

### 2. Rehash tiệm tiến

Khi lượng dữ liệu rất lớn (vài chục triệu hoặc hàng trăm triệu), quy trình rehash không hoàn tất trong một lần mà được thực hiện **tiệm tiến**. Ưu điểm của **rehash tiệm tiến** là tránh ảnh hưởng đến server.

Bản chất của rehash tiệm tiến:

1. Dùng rehashidx để phân bổ đều công việc tính toán cần thiết nhằm rehash các cặp key-value vào từng thao tác thêm, xóa, tìm kiếm và cập nhật dictionary, từ đó tránh khối lượng tính toán khổng lồ do rehash tập trung gây ra.
2. Trong khi rehash đang diễn ra, mỗi lần chương trình thực hiện thao tác thêm, xóa, tìm kiếm hoặc cập nhật dictionary, ngoài thao tác được yêu cầu, chương trình sẽ đồng thời rehash toàn bộ cặp key-value trong hash table cũ tại chỉ mục rehashidx sang hash table dự phòng. Sau khi hoàn thành công việc rehash, chương trình tăng giá trị thuộc tính rehashidx thêm 1.
