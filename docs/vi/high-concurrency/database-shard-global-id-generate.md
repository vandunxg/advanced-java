# Xử lý khóa chính ID như thế nào?

## Câu hỏi phỏng vấn

Sau khi sharding database và table, xử lý id khóa chính như thế nào?

## Phân tích suy nghĩ của người phỏng vấn

Đây là vấn đề chắc chắn phải đối mặt sau khi sharding database/table: tạo id như thế nào? Vì nếu chia thành nhiều table và mỗi table đều bắt đầu tăng từ 1 thì chắc chắn không ổn; cần có một id **duy nhất toàn cục** để hỗ trợ. Vì vậy, đây là điều bắt buộc phải cân nhắc trong môi trường production thực tế.

## Phân tích câu hỏi phỏng vấn

### Phương án triển khai dựa trên database

#### ID tự tăng của database

Mỗi lần hệ thống cần một id, nó sẽ chèn một bản ghi không có nhiều ý nghĩa nghiệp vụ vào một table trong một database rồi lấy id tự tăng do database tạo ra. Sau khi có id này, hệ thống mới ghi dữ liệu vào database/table tương ứng đã sharding.

Ưu điểm của phương án này là đơn giản, tiện dùng; **nhược điểm là id tự tăng được tạo bởi một database đơn lẻ** nên có thể trở thành nút thắt cổ chai nếu concurrency cao. Nếu muốn cải thiện thì có thể tạo riêng một service; mỗi lần service lấy giá trị id lớn nhất hiện tại rồi tự tăng một số id, trả về một lô id cùng lúc, sau đó cập nhật giá trị id lớn nhất hiện tại thành giá trị sau khi tăng. Nhưng **dù thế nào thì phương án vẫn dựa trên một database duy nhất**.

**Tình huống phù hợp**: Chỉ có hai lý do để sharding database/table: concurrency của một database quá cao hoặc lượng dữ liệu của một database quá lớn. Chỉ khi sharding để mở rộng vì **concurrency không cao nhưng dữ liệu quá lớn** mới có thể dùng phương án này, vì concurrency tối đa có thể chỉ vài trăm lượt mỗi giây; khi đó có thể dùng riêng một database và table để tạo khóa chính tự tăng.

#### Đặt sequence của database hoặc bước tăng của trường tự tăng trong table

Có thể co giãn theo chiều ngang bằng cách đặt sequence của database hoặc bước tăng của trường tự tăng trong table.

Ví dụ, hiện có 8 service node; mỗi node dùng một chức năng sequence để tạo ID. ID bắt đầu của mỗi sequence khác nhau và tăng dần theo thứ tự; bước tăng đều bằng 8.

![database-id-sequence-step](../../high-concurrency/images/database-id-sequence-step.png)

**Tình huống phù hợp**: Phương án này tương đối dễ triển khai và có thể đáp ứng mục tiêu hiệu năng, đồng thời ngăn ID tạo ra bị trùng giữa các node. Tuy nhiên, số service node và bước tăng đều cố định; nếu sau này cần thêm service node thì sẽ khó xử lý.

### UUID

Ưu điểm là có thể tạo tại chỗ mà không cần dựa vào database. Nhược điểm là UUID quá dài và chiếm nhiều dung lượng; **hiệu năng rất kém khi dùng làm khóa chính**. Quan trọng hơn, UUID không có thứ tự nên khi ghi sẽ tạo quá nhiều thao tác ghi ngẫu nhiên lên chỉ mục B+ tree (ID liên tiếp có thể tạo ra một phần thao tác ghi tuần tự). Ngoài ra, do không thể tạo thao tác append có thứ tự khi ghi mà phải dùng thao tác insert, toàn bộ node B+ tree sẽ được đọc vào bộ nhớ; sau khi chèn bản ghi này, toàn bộ node được ghi trở lại đĩa. Khi bản ghi chiếm nhiều dung lượng, hiệu năng giảm rõ rệt.

Tình huống phù hợp: Nếu cần tạo ngẫu nhiên tên file, mã số, v.v. thì có thể dùng UUID; nhưng không thể dùng UUID làm khóa chính.

```java
UUID.randomUUID().toString().replace("-", "") -> sfsdf23423rr234sfdaf
```

### Lấy thời gian hiện tại của hệ thống

Cách này chỉ cần lấy thời gian hiện tại, nhưng vấn đề là **khi concurrency cao**, chẳng hạn vài nghìn lượt mỗi giây, **có thể tạo ra giá trị trùng lặp**, nên chắc chắn không phù hợp. Về cơ bản có thể bỏ qua phương án này.

Tình huống phù hợp: Thông thường, nếu dùng phương án này thì sẽ ghép thời gian hiện tại với nhiều trường nghiệp vụ khác để tạo thành id. Nếu nghiệp vụ chấp nhận được thì cũng có thể dùng. Có thể ghép các giá trị trường nghiệp vụ khác với thời gian hiện tại để tạo thành mã số duy nhất toàn cục.

### Thuật toán snowflake

Thuật toán snowflake là thuật toán tạo id phân tán do Twitter mã nguồn mở, được triển khai bằng ngôn ngữ Scala. Thuật toán tạo id kiểu long 64 bit; bỏ 1 bit, dùng 41 bit làm số mili giây, 10 bit làm id máy làm việc và 12 bit làm số thứ tự.

-   1 bit: không dùng. Vì nếu bit đầu tiên trong nhị phân là 1 thì giá trị sẽ là số âm, còn các id được tạo đều là số dương, nên bit đầu tiên luôn là 0.
-   41 bit: biểu thị timestamp, đơn vị là mili giây. 41 bit có thể biểu diễn tối đa `2^41 - 1`, tức có thể đánh dấu `2^41 - 1` giá trị mili giây; quy đổi ra năm là 69 năm.
-   10 bit: ghi lại id máy làm việc; service này có thể được triển khai trên tối đa 2^10 máy, tức 1024 máy. Tuy nhiên, 5 trong 10 bit biểu thị id trung tâm dữ liệu, 5 bit biểu thị id máy. Nghĩa là tối đa biểu thị được `2^5` trung tâm dữ liệu (32 trung tâm dữ liệu), mỗi trung tâm dữ liệu biểu thị được `2^5` máy (32 máy).
-   12 bit: dùng để ghi lại các id khác nhau được tạo trong cùng một mili giây. 12 bit có thể biểu thị số lớn nhất là `2^12 - 1 = 4095`, tức dùng các số mà 12 bit biểu thị được để phân biệt 4096 id khác nhau (từ số 0 đến số 4095) **trong cùng một mili giây**.

```sh
0 | 0001100 10100010 10111110 10001001 01011100 00 | 10001 | 1 1001 | 0000 00000000
```

```java
public class IdWorker {

    private long workerId;
    private long datacenterId;
    private long sequence;

    public IdWorker(long workerId, long datacenterId, long sequence) {
        // sanity check for workerId
        // 这儿不就检查了一下，要求就是你传递进来的机房id和机器id不能超过32，不能小于0
        if (workerId > maxWorkerId || workerId < 0) {
            throw new IllegalArgumentException(
                    String.format("worker Id can't be greater than %d or less than 0", maxWorkerId));
        }
        if (datacenterId > maxDatacenterId || datacenterId < 0) {
            throw new IllegalArgumentException(
                    String.format("datacenter Id can't be greater than %d or less than 0", maxDatacenterId));
        }
        System.out.printf(
                "worker starting. timestamp left shift %d, datacenter id bits %d, worker id bits %d, sequence bits %d, workerid %d",
                timestampLeftShift, datacenterIdBits, workerIdBits, sequenceBits, workerId);

        this.workerId = workerId;
        this.datacenterId = datacenterId;
        this.sequence = sequence;
    }

    private long twepoch = 1288834974657L;

    private long workerIdBits = 5L;
    private long datacenterIdBits = 5L;

    // 这个是二进制运算，就是 5 bit最多只能有31个数字，也就是说机器id最多只能是32以内
    private long maxWorkerId = -1L ^ (-1L << workerIdBits);

    // 这个是一个意思，就是 5 bit最多只能有31个数字，机房id最多只能是32以内
    private long maxDatacenterId = -1L ^ (-1L << datacenterIdBits);
    private long sequenceBits = 12L;

    private long workerIdShift = sequenceBits;
    private long datacenterIdShift = sequenceBits + workerIdBits;
    private long timestampLeftShift = sequenceBits + workerIdBits + datacenterIdBits;
    private long sequenceMask = -1L ^ (-1L << sequenceBits);

    private long lastTimestamp = -1L;

    public long getWorkerId() {
        return workerId;
    }

    public long getDatacenterId() {
        return datacenterId;
    }

    public long getTimestamp() {
        return System.currentTimeMillis();
    }

    public synchronized long nextId() {
        // 这儿就是获取当前时间戳，单位是毫秒
        long timestamp = timeGen();

        if (timestamp < lastTimestamp) {
            System.err.printf("clock is moving backwards.  Rejecting requests until %d.", lastTimestamp);
            throw new RuntimeException(String.format(
                    "Clock moved backwards.  Refusing to generate id for %d milliseconds", lastTimestamp - timestamp));
        }

        if (lastTimestamp == timestamp) {
            // 这个意思是说一个毫秒内最多只能有4096个数字
            // 无论你传递多少进来，这个位运算保证始终就是在4096这个范围内，避免你自己传递个sequence超过了4096这个范围
            sequence = (sequence + 1) & sequenceMask;
            if (sequence == 0) {
                timestamp = tilNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0;
        }

        // 这儿记录一下最近一次生成id的时间戳，单位是毫秒
        lastTimestamp = timestamp;

        // 这儿就是将时间戳左移，放到 41 bit那儿；
        // 将机房 id左移放到 5 bit那儿；
        // 将机器id左移放到5 bit那儿；将序号放最后12 bit；
        // 最后拼接起来成一个 64 bit的二进制数字，转换成 10 进制就是个 long 型
        return ((timestamp - twepoch) << timestampLeftShift) | (datacenterId << datacenterIdShift)
                | (workerId << workerIdShift) | sequence;
    }

    private long tilNextMillis(long lastTimestamp) {
        long timestamp = timeGen();
        while (timestamp <= lastTimestamp) {
            timestamp = timeGen();
        }
        return timestamp;
    }

    private long timeGen() {
        return System.currentTimeMillis();
    }

    // ---------------测试---------------
    public static void main(String[] args) {
        IdWorker worker = new IdWorker(1, 1, 1);
        for (int i = 0; i < 30; i++) {
            System.out.println(worker.nextId());
        }
    }

}

```

Nói đại khái, 41 bit là timestamp theo mili giây hiện tại; 5 bit là id **trung tâm dữ liệu** bạn truyền vào (tối đa 32) và 5 bit còn lại là id **máy** bạn truyền vào (tối đa 32). 12 bit còn lại là số thứ tự; nếu thời điểm tạo id này vẫn nằm trong cùng một mili giây với lần tạo id trước đó thì số thứ tự sẽ tăng dần, tối đa đến 4096 số thứ tự.

Vì vậy, bạn có thể tự dùng utility class này để xây dựng service; khởi tạo một đối tượng như vậy cho mỗi máy trong mỗi trung tâm dữ liệu. Ban đầu, số thứ tự của máy thuộc trung tâm dữ liệu này là 0. Mỗi lần nhận được request yêu cầu máy này trong trung tâm dữ liệu này tạo một id, bạn sẽ tìm đúng Worker tương ứng để tạo id.

Dựa trên thuật toán snowflake, bạn có thể phát triển service riêng cho công ty mình. Với id trung tâm dữ liệu và id máy, vì đã dành sẵn 5 bit + 5 bit nên bạn cũng có thể thay bằng các giá trị khác mang ý nghĩa nghiệp vụ.

Thuật toán snowflake tương đối đáng tin cậy. Vì vậy, nếu thực sự cần tạo id phân tán trong tình huống concurrency cao thì thuật toán này có hiệu năng khá tốt; thông thường cũng đủ dùng cho tình huống vài chục nghìn lượt đồng thời mỗi giây.