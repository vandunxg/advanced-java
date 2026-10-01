# Chính sách hết hạn và thuật toán LRU của Redis

## Câu hỏi phỏng vấn

Redis có những chính sách hết hạn nào? Có những cơ chế loại bỏ dữ liệu khỏi bộ nhớ nào? Hãy tự viết code triển khai LRU.

## Phân tích suy nghĩ của người phỏng vấn

Nếu bạn còn không biết câu hỏi này, vừa nghe đã lúng túng và không trả lời được, thì khi viết code trên production, bạn sẽ mặc định dữ liệu đã ghi vào Redis chắc chắn còn tồn tại, rồi gây ra đủ loại bug cho hệ thống. Ai sẽ chịu trách nhiệm?

Có hai vấn đề thường gặp:

-   Dữ liệu ghi vào Redis biến đi đâu mất?

Có thể bạn từng gặp tình huống Redis trên production thường xuyên mất một số dữ liệu: vừa ghi vào, một lúc sau có thể đã biến mất. Trời ơi, nếu bạn hỏi câu này thì có nghĩa là bạn chưa dùng Redis đúng cách. Redis là cache, bạn lại dùng nó làm nơi lưu trữ à?

Cache là gì? Là dùng bộ nhớ làm cache. Bộ nhớ có vô hạn không? Bộ nhớ rất quý giá và có giới hạn, còn ổ đĩa rẻ và có dung lượng lớn. Một máy có thể chỉ có vài chục GB bộ nhớ nhưng có vài TB dung lượng đĩa. Redis chủ yếu dựa vào bộ nhớ để thực hiện các thao tác đọc ghi có hiệu năng cao và high concurrency.

Vậy nếu bộ nhớ có giới hạn, chẳng hạn Redis chỉ dùng được 10G, mà bạn ghi vào đó 20G dữ liệu thì sao? Tất nhiên nó sẽ xóa 10G dữ liệu và chỉ giữ lại 10G. Vậy sẽ xóa dữ liệu nào và giữ dữ liệu nào? Tất nhiên là xóa dữ liệu ít dùng và giữ dữ liệu thường dùng.

-   Dữ liệu rõ ràng đã hết hạn, tại sao vẫn chiếm bộ nhớ?

Điều này do chính sách hết hạn của Redis quyết định.

## Phân tích câu hỏi phỏng vấn

### Chính sách hết hạn của Redis

Chính sách hết hạn của Redis là: **xóa định kỳ + xóa lười**.

**Xóa định kỳ** nghĩa là mặc định cứ mỗi 100ms Redis lấy ngẫu nhiên một số key đã đặt thời gian hết hạn để kiểm tra xem chúng đã hết hạn chưa; nếu hết hạn thì xóa.

Giả sử Redis lưu 100.000 key và tất cả đều được đặt thời gian hết hạn. Nếu cứ vài trăm mili giây bạn lại kiểm tra 100.000 key thì Redis gần như sẽ ngừng hoạt động, tải CPU sẽ rất cao vì phải kiểm tra các key hết hạn. Lưu ý, ở đây không phải cứ mỗi 100ms lại duyệt toàn bộ các key có đặt thời gian hết hạn; làm vậy sẽ là một **thảm họa** về hiệu năng. Thực tế, cứ mỗi 100ms Redis **lấy ngẫu nhiên** một số key để kiểm tra và xóa.

Nhưng vấn đề là xóa định kỳ có thể bỏ sót nhiều key đã đến hạn mà chưa được xóa. Vậy phải làm sao? Dùng xóa lười. Nghĩa là khi bạn lấy một key, Redis sẽ kiểm tra xem key đó có được đặt thời gian hết hạn hay không; nếu có, Redis sẽ kiểm tra xem key đã hết hạn chưa. Nếu đã hết hạn thì lúc này key sẽ bị xóa và Redis không trả về gì cho bạn.

> Khi lấy key, nếu key đã hết hạn thì xóa và không trả về gì.

Tuy vậy, trên thực tế cách này vẫn có vấn đề. Nếu xóa định kỳ bỏ sót nhiều key hết hạn, bạn cũng không kịp truy vấn chúng nên không kích hoạt xóa lười, vậy điều gì sẽ xảy ra? Nếu nhiều key hết hạn tích tụ trong bộ nhớ khiến Redis cạn kiệt bộ nhớ thì làm thế nào?

Câu trả lời là: **áp dụng cơ chế loại bỏ dữ liệu khỏi bộ nhớ**.

### Cơ chế loại bỏ dữ liệu khỏi bộ nhớ

Redis có một số cơ chế loại bỏ dữ liệu khỏi bộ nhớ sau:

-   noeviction: khi bộ nhớ không đủ chỗ chứa dữ liệu mới ghi, thao tác ghi mới sẽ báo lỗi. Chắc chẳng ai dùng cái này đâu, phiền phức quá.
-   **allkeys-lru**: khi bộ nhớ không đủ chỗ chứa dữ liệu mới ghi, loại bỏ key ít được sử dụng gần đây nhất trong **không gian key** (đây là cách **được dùng phổ biến nhất**).
-   allkeys-random: khi bộ nhớ không đủ chỗ chứa dữ liệu mới ghi, loại bỏ ngẫu nhiên một key trong **không gian key**. Chắc chẳng ai dùng cách này đâu; tại sao lại xóa ngẫu nhiên, đương nhiên phải xóa key ít được dùng gần đây nhất chứ.
-   volatile-lru: khi bộ nhớ không đủ chỗ chứa dữ liệu mới ghi, loại bỏ key ít được sử dụng gần đây nhất trong **không gian key có đặt thời gian hết hạn** (cách này thường không phù hợp lắm).
-   volatile-random: khi bộ nhớ không đủ chỗ chứa dữ liệu mới ghi, **xóa ngẫu nhiên** một key trong **không gian key có đặt thời gian hết hạn**.
-   volatile-ttl: khi bộ nhớ không đủ chỗ chứa dữ liệu mới ghi, ưu tiên loại bỏ key có **thời gian hết hạn sớm hơn** trong **không gian key có đặt thời gian hết hạn**.

### Tự viết một thuật toán LRU

LRU là viết tắt của Least Recently Used, dịch là “ít được sử dụng gần đây nhất”. Nghĩa là thuật toán LRU sẽ loại bỏ cache ít được dùng gần đây nhất để nhường chỗ cho cache vừa được sử dụng. Thông thường, dữ liệu được đọc thường xuyên nhất cũng là dữ liệu có số lượt đọc nhiều nhất. Vì vậy, tận dụng tốt thuật toán LRU giúp chúng ta cải thiện hiệu quả cache dữ liệu nóng và tăng tỷ lệ sử dụng bộ nhớ của dịch vụ cache.

Vậy triển khai như thế nào?

Thực ra cách triển khai rất đơn giản, như được mô tả trong hình bên dưới.

![](../../high-concurrency/images/lru.png)

Bạn có thể viết tay thuật toán LRU nguyên thủy ngay tại buổi phỏng vấn, nhưng lượng code khá lớn và có vẻ không thực tế.

Không nhất thiết phải tự tay xây dựng LRU từ đầu, nhưng ít nhất cần biết cách tận dụng cấu trúc dữ liệu có sẵn trong JDK để triển khai LRU bằng Java.

![](../../high-concurrency/images/lru-cache.png)

```java
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private int capacity;

    /**
     * Truyền vào số lượng dữ liệu tối đa có thể cache
     *
     * @param capacity Dung lượng cache
     */
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    /**
     * Nếu số lượng dữ liệu trong map lớn hơn dung lượng tối đa đã đặt thì trả về true; khi thêm object mới, dữ liệu cũ nhất sẽ bị xóa
     *
     * @param eldest Phần tử dữ liệu cũ nhất
     * @return Nếu là true thì loại bỏ dữ liệu cũ nhất
     */
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        // Khi số lượng dữ liệu trong map lớn hơn số lượng phần tử cache được chỉ định, tự động loại bỏ dữ liệu cũ nhất
        return size() > capacity;
    }
}
```
