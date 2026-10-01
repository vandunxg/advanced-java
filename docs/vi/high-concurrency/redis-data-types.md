# Các kiểu dữ liệu Redis và tình huống sử dụng

## Câu hỏi phỏng vấn

Redis có những kiểu dữ liệu nào? Mỗi kiểu phù hợp để dùng trong tình huống nào?

## Phân tích suy nghĩ của người phỏng vấn

Trừ khi người phỏng vấn thấy qua CV rằng bạn có dưới 3 năm kinh nghiệm, là ứng viên khá mới và có thể chưa nghiên cứu kỹ thuật chuyên sâu, họ mới hỏi loại câu hỏi này. Nếu không, trong thời gian phỏng vấn quý giá, người phỏng vấn thường không muốn hỏi quá nhiều về nó.

Thực ra, câu hỏi này chủ yếu có hai mục đích:

-   Xem bạn có hiểu toàn diện Redis có những chức năng nào, thường dùng ra sao và tình huống nào dùng tính năng nào không; họ lo bạn chỉ biết các thao tác KV đơn giản nhất.
-   Xem bạn đã dùng Redis như thế nào trong các dự án thực tế.

Nếu câu trả lời của bạn không tốt, không nêu được vài kiểu dữ liệu cũng như tình huống sử dụng, thì coi như xong; người phỏng vấn chắc chắn có ấn tượng không tốt và nghĩ rằng bình thường bạn chỉ làm vài thao tác set và get đơn giản.

## Phân tích câu hỏi phỏng vấn

Redis chủ yếu có các kiểu dữ liệu sau:

-   Strings
-   Hashes
-   Lists
-   Sets
-   Sorted Sets

> Ngoài 5 kiểu dữ liệu này, Redis còn có Bitmaps, HyperLogLogs, Streams, v.v.

### Strings

Đây là kiểu đơn giản nhất, gồm các thao tác set và get thông thường, dùng làm cache KV đơn giản.

```bash
set college szu
```

### Hashes

Kiểu này tương tự cấu trúc map. Thường dùng để cache dữ liệu có cấu trúc, chẳng hạn một object (với điều kiện **object này không lồng các object khác**) trong Redis. Khi đọc ghi cache, có thể chỉ thao tác với **một trường cụ thể** trong hash.

```bash
hset person name bingo
hset person age 20
hset person id 1
hget person name
```

```json
(person = {
  "name": "bingo",
  "age": 20,
  "id": 1
})
```

### Lists

Lists là danh sách có thứ tự, có thể dùng cho nhiều mục đích.

Ví dụ, có thể dùng list để lưu các cấu trúc dữ liệu dạng danh sách, như danh sách follower hoặc danh sách bình luận của bài viết.

Chẳng hạn, có thể dùng lệnh lrange để đọc các phần tử trong một khoảng đóng, rồi dựa vào list để thực hiện truy vấn phân trang. Đây là một chức năng rất hữu ích: dùng Redis tạo phân trang đơn giản, hiệu năng cao, chẳng hạn kiểu tải thêm từng trang như trên Weibo; hiệu năng tốt vì chỉ lấy từng trang một.

```bash
# Vị trí bắt đầu là 0, vị trí kết thúc là -1; khi vị trí kết thúc là -1, đó là vị trí cuối cùng của danh sách, tức là xem tất cả.
lrange mylist 0 -1
```

Cũng có thể tạo một message queue đơn giản: thêm phần tử vào đầu list và lấy phần tử ở cuối list.

```bash
lpush mylist 1
lpush mylist 2
lpush mylist 3 4 5

# 1
rpop mylist
```

### Sets

Sets là tập hợp không có thứ tự và tự động loại bỏ phần tử trùng lặp.

Có thể đưa dữ liệu cần khử trùng lặp trong hệ thống trực tiếp vào set để tự động loại bỏ phần tử trùng. Nếu cần khử trùng lặp toàn cục thật nhanh cho một số dữ liệu, bạn cũng có thể dùng HashSet trong bộ nhớ JVM; nhưng nếu hệ thống được triển khai trên nhiều máy thì sao? Khi đó cần dùng Redis để khử trùng lặp toàn cục bằng set.

Có thể dùng set để thực hiện phép giao, hợp và hiệu. Chẳng hạn với phép giao, lấy giao của danh sách follower của hai người để xem bạn chung của hai người là ai. Đúng không?

Đưa follower của hai người nổi tiếng vào hai set riêng rồi lấy giao của hai set.

```bash
#-------Thao tác với một set-------
# Thêm phần tử
sadd mySet 1

# Xem toàn bộ phần tử
smembers mySet

# Kiểm tra có chứa một giá trị hay không
sismember mySet 3

# Xóa một hoặc một số phần tử
srem mySet 1
srem mySet 2 4

# Xem số lượng phần tử
scard mySet

# Xóa ngẫu nhiên một phần tử
spop mySet

#-------Thao tác với nhiều set-------
# Di chuyển phần tử của một set sang set khác
smove yourSet mySet 2

# Tìm giao của hai set
sinter yourSet mySet

# Tìm hợp của hai set
sunion yourSet mySet

# Tìm các phần tử có trong yourSet nhưng không có trong mySet
sdiff yourSet mySet
```

### Sorted Sets

Sorted Sets là set có sắp xếp: loại bỏ trùng lặp nhưng vẫn sắp xếp được. Khi thêm phần tử, cung cấp một điểm số; các phần tử sẽ tự động được sắp xếp theo điểm số.

```bash
zadd board 85 zhangsan
zadd board 72 lisi
zadd board 96 wangwu
zadd board 63 zhaoliu

# Lấy ba người dùng đứng đầu bảng xếp hạng (mặc định là tăng dần, nên cần dùng rev để chuyển sang giảm dần)
zrevrange board 0 3

# Lấy thứ hạng của một người dùng
zrank board zhaoliu
```
