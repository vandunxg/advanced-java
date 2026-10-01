# Cache avalanche, cache penetration và cache breakdown

## Câu hỏi phỏng vấn

Bạn có hiểu cache avalanche, cache penetration và cache breakdown của Redis là gì không? Redis sập thì điều gì xảy ra? Hệ thống nên ứng phó thế nào? Xử lý cache penetration của Redis ra sao?

## Phân tích suy nghĩ của người phỏng vấn

Đây là câu hỏi chắc chắn sẽ được hỏi khi phỏng vấn về cache, vì cache avalanche và cache penetration là hai vấn đề lớn nhất của cache; có thể chúng không xảy ra, nhưng một khi xảy ra thì sẽ là vấn đề mang tính chí mạng. Vì vậy người phỏng vấn chắc chắn sẽ hỏi bạn.

## Phân tích câu hỏi phỏng vấn

### Cache avalanche (Cache Avalanche)

Với hệ thống A, giả sử vào giờ cao điểm có 5000 request mỗi giây; bình thường cache có thể chịu 4000 request mỗi giây trong giờ cao điểm, nhưng máy cache bất ngờ sập hoàn toàn. Cache bị sập, lúc này cả 5000 request mỗi giây đều đổ xuống database; database chắc chắn không chịu nổi, sẽ phát cảnh báo rồi sập. Lúc này nếu không có phương án đặc biệt nào để xử lý sự cố, DBA sẽ rất sốt ruột và khởi động lại database, nhưng database lại lập tức bị lưu lượng mới đánh sập.

Đó là cache avalanche.

![redis-caching-avalanche](../../high-concurrency/images/redis-caching-avalanche.png)

Khoảng 3 năm trước, một công ty Internet khá nổi tiếng trong nước từng gặp sự cố cache gây avalanche; toàn bộ hệ thống backend bị sập. Sự cố kéo dài từ chiều hôm đó đến 3–4 giờ sáng, gây thiệt hại cho công ty hàng chục triệu.

Các phương án xử lý cache avalanche trước, trong và sau sự cố như sau:

-   Trước sự cố: dùng Redis high availability, primary-replica + Sentinel hoặc Redis cluster để tránh sập toàn bộ.
-   Trong sự cố: dùng cache cục bộ Ehcache + rate limiting và degradation bằng Hystrix để tránh làm sập MySQL.
-   Sau sự cố: dùng persistence của Redis; khi khởi động lại, Redis sẽ tự động tải dữ liệu từ đĩa để nhanh chóng khôi phục dữ liệu cache.

![redis-caching-avalanche-solution](../../high-concurrency/images/redis-caching-avalanche-solution.png)

Người dùng gửi request; sau khi hệ thống A nhận request, trước tiên nó truy vấn cache cục bộ Ehcache. Nếu không tìm thấy thì truy vấn Redis. Nếu cả Ehcache và Redis đều không có thì truy vấn database, rồi ghi kết quả từ database vào Ehcache và Redis.

Component rate limiting có thể đặt số request mỗi giây được phép đi qua; vậy các request còn lại không qua được thì xử lý thế nào? **Chuyển sang degradation**! Có thể trả về một số giá trị mặc định, lời nhắc thân thiện hoặc giá trị rỗng.

Ưu điểm:

-   Database chắc chắn không bị sập vì component rate limiting đảm bảo chỉ có một số lượng request nhất định mỗi giây được đi qua.
-   Chỉ cần database không sập thì 2/5 số request của người dùng có thể được xử lý.
-   Chỉ cần xử lý được 2/5 số request là hệ thống chưa sập; với người dùng, có thể họ phải bấm vài lần mà trang chưa tải ra, nhưng bấm thêm vài lần thì trang sẽ hiện.

### Cache penetration (Cache Penetration)

Với hệ thống A, giả sử có 5000 request mỗi giây, trong đó 4000 request là cuộc tấn công độc hại của hacker.

Cache không tìm thấy dữ liệu tương ứng với 4000 request tấn công đó; mỗi lần truy vấn database cũng không tìm thấy dữ liệu.

Lấy một ví dụ. ID trong database bắt đầu từ 1, nhưng các request do hacker gửi đều có ID âm. Khi đó cache không có dữ liệu; mỗi request đều “**coi cache như không tồn tại**” và truy vấn thẳng database. Tình huống cache penetration do tấn công độc hại như vậy có thể trực tiếp làm sập database.

![redis-caching-penetration](../../high-concurrency/images/redis-caching-penetration.png)

Cách giải quyết rất đơn giản: mỗi khi hệ thống A không tìm thấy dữ liệu trong database thì ghi một giá trị rỗng vào cache, chẳng hạn `set -999 UNKNOWN`. Sau đó đặt thời gian hết hạn; lần sau khi có truy cập với cùng key thì có thể lấy dữ liệu trực tiếp từ cache trước khi cache hết hạn.

Tất nhiên, nếu hacker dùng một ID âm khác nhau trong mỗi lần tấn công thì cách ghi giá trị rỗng có thể không hiệu quả. Cách làm phổ biến hơn là thêm Bloom filter trước cache, hash dữ liệu có khả năng tồn tại trong database vào Bloom filter. Sau đó kiểm tra từng request như sau:

-   Nếu key của dữ liệu trong request không tồn tại trong Bloom filter thì có thể xác định dữ liệu chắc chắn không tồn tại trong database; hệ thống có thể trả về kết quả không tồn tại ngay.
-   Nếu key của dữ liệu trong request tồn tại trong Bloom filter thì tiếp tục truy vấn cache.

Bloom filter giúp sàng lọc sơ bộ các request, tránh áp lực truy vấn do dữ liệu không tồn tại gây ra.

![redis-caching-avoid-penetration](../../high-concurrency/images/redis-caching-avoid-penetration.png)

### Cache breakdown (Hotspot Invalid)

Cache breakdown xảy ra khi một key nào đó rất hot và được truy cập thường xuyên, tạo thành tình trạng truy cập tập trung ở mức high concurrency. Ngay khi key này hết hạn, một lượng lớn request đồng loạt đánh thủng cache và truy cập thẳng database, giống như đục thủng một lỗ trên tấm chắn.

Có thể xử lý theo các cách sau trong những tình huống khác nhau:

-   Nếu dữ liệu cache về cơ bản không thay đổi thì có thể thử đặt dữ liệu nóng này không bao giờ hết hạn.
-   Nếu dữ liệu cache ít cập nhật và toàn bộ quy trình refresh cache mất ít thời gian thì có thể dùng distributed lock dựa trên middleware phân tán như Redis, ZooKeeper hoặc local lock để đảm bảo chỉ một số ít request truy vấn database và xây dựng lại cache; các thread còn lại có thể truy cập cache mới sau khi lock được giải phóng.
-   Nếu dữ liệu cache cập nhật thường xuyên hoặc quy trình refresh cache mất nhiều thời gian thì có thể dùng một thread chạy định kỳ để chủ động xây dựng lại cache trước khi cache hết hạn hoặc kéo dài thời gian hết hạn của cache, đảm bảo mọi request luôn truy cập được cache tương ứng.
