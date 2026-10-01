# Giới thiệu về công cụ tìm kiếm

## Lịch sử hình thành và phát triển của Lucene và ES

Lucene là thư viện tìm kiếm tiên tiến và mạnh mẽ nhất. Nếu phát triển trực tiếp dựa trên Lucene thì rất phức tạp; ngay cả để viết một số chức năng đơn giản cũng cần viết rất nhiều code Java và phải hiểu sâu các nguyên lý.

ElasticSearch dựa trên Lucene, ẩn đi sự phức tạp của Lucene và cung cấp các API RESTful / Java API đơn giản, dễ sử dụng (ngoài ra còn có API cho các ngôn ngữ khác).

-   Công cụ lưu trữ document phân tán
-   Công cụ tìm kiếm và phân tích phân tán
-   Phân tán, hỗ trợ dữ liệu ở quy mô PB

## Các khái niệm cốt lõi của ES

### Near Realtime

Gần thời gian thực có hai nghĩa:

-   Có một độ trễ nhỏ từ lúc ghi dữ liệu đến lúc dữ liệu có thể được tìm kiếm (khoảng 1s)
-   Các thao tác tìm kiếm và phân tích dựa trên ES có thể hoàn thành trong thời gian tính bằng giây

### Cluster

Cluster bao gồm nhiều node. Mỗi node thuộc cluster nào được quyết định bằng một cấu hình; với các ứng dụng vừa và nhỏ, việc ban đầu một cluster chỉ có một node là hoàn toàn bình thường.

### Node

Node là một nút trong cluster và cũng có tên; mặc định tên được gán ngẫu nhiên. Theo mặc định, node sẽ tham gia cluster có tên `elasticsearch`. Nếu khởi động một loạt node trực tiếp thì chúng sẽ tự động tạo thành một cluster elasticsearch; dĩ nhiên một node cũng có thể tạo thành một cluster elasticsearch.

### Document & field

Document là đơn vị dữ liệu nhỏ nhất trong ES. Một document có thể là dữ liệu khách hàng, dữ liệu phân loại sản phẩm hoặc dữ liệu đơn hàng; thường được biểu diễn bằng cấu trúc dữ liệu JSON. Mỗi type trong một index có thể lưu nhiều document. Một document có nhiều field; mỗi field là một trường dữ liệu.

```json
{
    "product_id": "1",
    "product_name": "iPhone X",
    "product_desc": "苹果手机",
    "category_id": "2",
    "category_name": "电子产品"
}
```

### Index

Index chứa một tập hợp document có cấu trúc tương tự nhau, chẳng hạn index sản phẩm. Một index chứa nhiều document; một index đại diện cho một nhóm document tương tự hoặc giống nhau.

### Type

Type là một loại; mỗi index có thể có một hoặc nhiều type. Type là một phân loại logic của index. Ví dụ, trong index sản phẩm có một số type: sản phẩm tiêu dùng hằng ngày, đồ điện gia dụng và thực phẩm tươi sống. Các field của document trong mỗi type có thể hơi khác nhau.

### shard

Một máy đơn lẻ không thể lưu trữ lượng dữ liệu lớn; ES có thể chia dữ liệu trong một index thành nhiều shard và phân tán lưu trữ trên nhiều server. Nhờ có shard, hệ thống có thể mở rộng theo chiều ngang, lưu trữ nhiều dữ liệu hơn, phân tán các thao tác như tìm kiếm và phân tích trên nhiều server để tăng throughput và hiệu năng. Mỗi shard là một Lucene index.

### replica

Bất kỳ server nào cũng có thể gặp sự cố hoặc ngừng hoạt động bất cứ lúc nào; khi đó shard có thể bị mất. Vì vậy có thể tạo nhiều replica cho mỗi shard. Khi shard gặp sự cố, replica có thể cung cấp dịch vụ dự phòng để đảm bảo dữ liệu không bị mất; nhiều replica cũng có thể tăng throughput và hiệu năng thao tác tìm kiếm. primary shard (được thiết lập một lần khi tạo index, không thể thay đổi, mặc định là 5), replica shard (số lượng có thể thay đổi bất cứ lúc nào, mặc định là 1); mặc định mỗi index có 10 shard, gồm 5 primary shard và 5 replica shard. Cấu hình high availability tối thiểu cần 2 server.

Nói như thế này: shard được chia thành primary shard và replica shard. Primary shard thường được gọi tắt là shard, còn replica shard thường được gọi tắt là replica.

![es-cluster-0](../../high-concurrency/images/es-cluster-0.png)

## So sánh các khái niệm cốt lõi của ES và DB

| ES       | DB       |
| -------- | -------- |
| index    | Cơ sở dữ liệu |
| type     | Bảng dữ liệu |
| document | Một hàng dữ liệu |

Trên đây là phép so sánh đơn giản.
