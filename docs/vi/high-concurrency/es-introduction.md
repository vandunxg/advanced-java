# Giới thiệu search engine

## Quá trình phát triển của Lucene và ES

Lucene là thư viện tìm kiếm tiên tiến và mạnh mẽ nhất. Nếu phát triển trực tiếp dựa trên Lucene thì rất phức tạp; ngay cả để viết một số chức năng đơn giản cũng cần viết nhiều code Java và phải hiểu sâu nguyên lý.

ElasticSearch dựa trên Lucene, ẩn đi sự phức tạp của lucene và cung cấp các giao diện RESTful api / Java api đơn giản, dễ dùng (ngoài ra còn có giao diện api cho các ngôn ngữ khác).

-   Distributed document storage engine
-   Distributed search engine và analysis engine
-   Phân tán, hỗ trợ dữ liệu ở quy mô PB

## Các khái niệm cốt lõi của ES

### Near Realtime

Gần thời gian thực có hai nghĩa:

-   Có một độ trễ nhỏ từ lúc ghi dữ liệu đến lúc dữ liệu có thể được tìm kiếm (khoảng 1s)
-   Thực hiện tìm kiếm và phân tích dựa trên ES có thể đạt mức theo giây

### Cluster

Cluster gồm nhiều node; node thuộc cluster nào được quyết định bằng cấu hình. Với ứng dụng vừa và nhỏ, lúc đầu một cluster chỉ có một node là chuyện bình thường.

### Node

Node là một nút trong cluster và cũng có tên; mặc định tên được gán ngẫu nhiên. Theo mặc định, node sẽ tham gia cluster có tên `elasticsearch`. Nếu khởi động một loạt node trực tiếp thì chúng sẽ tự động tạo thành một elasticsearch cluster; dĩ nhiên một node cũng có thể tạo thành elasticsearch cluster.

### Document & field

Document là đơn vị dữ liệu nhỏ nhất trong ES. Một document có thể là dữ liệu khách hàng, dữ liệu phân loại sản phẩm hoặc dữ liệu đơn hàng; thường được biểu diễn bằng cấu trúc dữ liệu json. Mỗi type trong một index có thể lưu nhiều document. Một document có nhiều field; mỗi field là một trường dữ liệu.

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

Index chứa một tập document có cấu trúc tương tự nhau, chẳng hạn index sản phẩm. Một index chứa nhiều document; một index đại diện cho một loại document tương tự hoặc giống nhau.

### Type

Type là loại; mỗi index có thể có một hoặc nhiều type. Type là phân loại logic của index. Ví dụ, trong product index có một số type: hàng hóa tiêu dùng hằng ngày, thiết bị điện tử và thực phẩm tươi sống. Field của document trong mỗi type có thể hơi khác nhau.

### shard

Một máy đơn lẻ không thể lưu lượng dữ liệu lớn; ES có thể chia dữ liệu trong một index thành nhiều shard và phân tán lưu trên nhiều server. Nhờ có shard, hệ thống có thể mở rộng theo chiều ngang, lưu nhiều dữ liệu hơn, phân tán các thao tác như tìm kiếm và phân tích trên nhiều server để tăng throughput và hiệu năng. Mỗi shard là một lucene index.

### replica

Bất kỳ server nào cũng có thể gặp sự cố hoặc ngừng hoạt động bất cứ lúc nào; khi đó shard có thể bị mất. Vì vậy có thể tạo nhiều replica cho mỗi shard. Khi shard gặp sự cố, replica có thể cung cấp dịch vụ dự phòng để đảm bảo dữ liệu không bị mất; nhiều replica cũng có thể tăng throughput và hiệu năng thao tác tìm kiếm. primary shard (đặt một lần khi tạo index, không thể sửa đổi, mặc định 5 shard), replica shard (có thể thay đổi số lượng bất cứ lúc nào, mặc định 1 shard); mặc định mỗi index có 10 shard, gồm 5 primary shard và 5 replica shard. Cấu hình high availability tối thiểu cần 2 server.

Nói như thế này: shard được chia thành primary shard và replica shard. Primary shard thường được gọi tắt là shard, còn replica shard thường được gọi tắt là replica.

![es-cluster-0](../../high-concurrency/images/es-cluster-0.png)

## So sánh khái niệm cốt lõi ES và DB

| ES       | DB       |
| -------- | -------- |
| index    | Database |
| type     | Table    |
| document | Một hàng dữ liệu |

Trên đây là phép so sánh đơn giản.
