# Redis và Zookeeper triển khai khóa phân tán

## Câu hỏi phỏng vấn

Có những cách nào thường dùng để triển khai khóa phân tán? Thiết kế khóa phân tán bằng Redis như thế nào? Có thể dùng zk để thiết kế khóa phân tán không? Trong hai cách triển khai này, cách nào có hiệu suất cao hơn?

## Phân tích góc nhìn của người phỏng vấn

Thông thường câu hỏi sẽ được đặt theo cách này: đầu tiên hỏi về zk, rồi chuyển sang một số câu hỏi liên quan đến zk, chẳng hạn khóa phân tán. Vì trong quá trình phát triển hệ thống phân tán, các tình huống sử dụng khóa phân tán khá phổ biến.

## Phân tích câu hỏi phỏng vấn

### Khóa phân tán Redis

Thuật toán chính thức được gọi là `RedLock`, đây là thuật toán khóa phân tán được Redis hỗ trợ chính thức.

Khóa phân tán này có 3 điểm quan trọng cần cân nhắc:

-   Tính loại trừ lẫn nhau (chỉ một client có thể lấy được khóa)
-   Không bị deadlock
-   Khả năng chịu lỗi (chỉ cần phần lớn các nút Redis tạo được khóa này là đủ)

#### Khóa phân tán Redis đơn giản nhất

Cách triển khai đơn giản nhất là dùng `SET key value [EX seconds] [PX milliseconds] NX` trong Redis để tạo một key, như vậy là đã khóa. Trong đó:

-   `NX`: chỉ đặt thành công khi `key` chưa tồn tại; nếu lúc này Redis đã có `key` thì thao tác đặt thất bại và trả về `nil`.
-   `EX seconds`: đặt thời gian hết hạn của `key`, chính xác đến giây. Nghĩa là khóa tự động được giải phóng sau `seconds` giây; nếu người khác thấy khóa đã tồn tại thì không thể khóa được.
-   `PX milliseconds`: cũng đặt thời gian hết hạn của `key`, nhưng chính xác đến mili giây.

Ví dụ, chạy lệnh sau:

```r
SET resource_name my_random_value PX 30000 NX
```

Để giải phóng khóa, ta xóa key; thông thường có thể dùng script `lua` để xóa và chỉ xóa khi value giống nhau:

```lua
-- 删除锁的时候，找到 key 对应的 value，跟自己传过去的 value 做比较，如果是一样的才删除。
if redis.call("get",KEYS[1]) == ARGV[1] then
    return redis.call("del",KEYS[1])
else
    return 0
end
```

Vì sao cần giá trị ngẫu nhiên `random_value`? Vì nếu một client lấy được khóa nhưng bị chặn trong thời gian dài mới thực thi xong, chẳng hạn hơn 30 giây, thì khóa có thể đã tự động được giải phóng và client khác có thể đã lấy được khóa. Nếu lúc này bạn xóa key trực tiếp thì sẽ gây ra vấn đề. Vì vậy cần dùng giá trị ngẫu nhiên cùng script `lua` ở trên để giải phóng khóa.

Tuy nhiên, cách này chắc chắn không đủ. Nếu chỉ dùng một Redis instance thông thường thì sẽ có lỗi đơn điểm. Hoặc nếu dùng Redis master-slave thông thường, Redis sao chép bất đồng bộ giữa master và slave; nếu nút master bị lỗi (key sẽ mất) trước khi key được đồng bộ sang slave, rồi slave được chuyển thành master, người khác có thể đặt key và lấy khóa.

#### Thuật toán RedLock

Giả sử có một Redis cluster gồm 5 Redis master instance. Sau đó thực hiện các bước sau để lấy khóa:

1. Lấy dấu thời gian hiện tại, đơn vị mili giây;
2. Tương tự như trên, lần lượt thử tạo khóa trên từng nút master, với thời gian chờ ngắn, thường chỉ vài chục mili giây (thời gian chờ client dùng để lấy khóa nhỏ hơn tổng thời gian tự động giải phóng khóa. Ví dụ, nếu thời gian tự động giải phóng là 10 giây thì thời gian chờ có thể trong khoảng `5~50` mili giây);
3. Thử tạo khóa trên **phần lớn các nút**, chẳng hạn với 5 nút thì yêu cầu 3 nút `n / 2 + 1`;
4. Client tính thời gian tạo khóa; nếu thời gian tạo khóa nhỏ hơn thời gian chờ thì coi như tạo thành công;
5. Nếu tạo khóa thất bại thì lần lượt xóa các khóa đã tạo trước đó;
6. Chỉ cần người khác đã tạo một khóa phân tán thì bạn phải **liên tục thăm dò để thử lấy khóa**.

![redis-redlock](../../distributed-system/images/redis-redlock.png)

[Redis chính thức](https://redis.io/) đưa ra hai cách triển khai khóa phân tán dựa trên Redis ở trên; xem mô tả chi tiết tại https://redis.io/topics/distlock .

### Khóa phân tán zk

Khóa phân tán zk có thể triển khai khá đơn giản: một nút thử tạo znode tạm thời; nếu tạo thành công thì đã lấy được khóa. Khi client khác đến tạo khóa thì sẽ thất bại và chỉ có thể **đăng ký một listener** để lắng nghe khóa này. Giải phóng khóa là xóa znode đó; khi znode được xóa, client sẽ được thông báo và một client đang chờ có thể khóa lại.

```java
/**
 * ZooKeeperSession
 */
public class ZooKeeperSession {

    private static CountDownLatch connectedSemaphore = new CountDownLatch(1);

    private ZooKeeper zookeeper;
    private CountDownLatch latch;

    public ZooKeeperSession() {
        try {
            this.zookeeper = new ZooKeeper("192.168.31.187:2181,192.168.31.19:2181,192.168.31.227:2181", 50000, new ZooKeeperWatcher());
            try {
                connectedSemaphore.await();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            System.out.println("ZooKeeper session established......");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 获取分布式锁
     *
     * @param productId
     */
    public Boolean acquireDistributedLock(Long productId) {
        String path = "/product-lock-" + productId;

        try {
            zookeeper.create(path, "".getBytes(), Ids.OPEN_ACL_UNSAFE, CreateMode.EPHEMERAL);
            return true;
        } catch (Exception e) {
            while (true) {
                try {
                    // 相当于是给node注册一个监听器，去看看这个监听器是否存在
                    Stat stat = zk.exists(path, true);

                    if (stat != null) {
                        this.latch = new CountDownLatch(1);
                        this.latch.await(waitTime, TimeUnit.MILLISECONDS);
                        this.latch = null;
                    }
                    zookeeper.create(path, "".getBytes(), Ids.OPEN_ACL_UNSAFE, CreateMode.EPHEMERAL);
                    return true;
                } catch (Exception ee) {
                    continue;
                }
            }

        }
        return true;
    }

    /**
     * 释放掉一个分布式锁
     *
     * @param productId
     */
    public void releaseDistributedLock(Long productId) {
        String path = "/product-lock-" + productId;
        try {
            zookeeper.delete(path, -1);
            System.out.println("release the lock for product[id=" + productId + "]......");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 建立 zk session 的 watcher
     */
    private class ZooKeeperWatcher implements Watcher {

        public void process(WatchedEvent event) {
            System.out.println("Receive watched event: " + event.getState());

            if (KeeperState.SyncConnected == event.getState()) {
                connectedSemaphore.countDown();
            }

            if (this.latch != null) {
                this.latch.countDown();
            }
        }

    }

    /**
     * 封装单例的静态内部类
     */
    private static class Singleton {

        private static ZooKeeperSession instance;

        static {
            instance = new ZooKeeperSession();
        }

        public static ZooKeeperSession getInstance() {
            return instance;
        }

    }

    /**
     * 获取单例
     *
     * @return
     */
    public static ZooKeeperSession getInstance() {
        return Singleton.getInstance();
    }

    /**
     * 初始化单例的便捷方法
     */
    public static void init() {
        getInstance();
    }

}
```

Cũng có thể dùng một cách khác: tạo ephemeral sequential node.

Nếu nhiều người cùng tranh một khóa thì họ sẽ xếp hàng. Người lấy được khóa đầu tiên sẽ thực thi rồi giải phóng khóa; những người còn lại sẽ lắng nghe node do người **đứng ngay trước mình** tạo. Khi một người giải phóng khóa, ZooKeeper sẽ thông báo cho người đứng sau; sau khi nhận thông báo, người đó sẽ lấy được khóa và có thể thực thi mã.

```java
public class ZooKeeperDistributedLock implements Watcher {

    private ZooKeeper zk;
    private String locksRoot = "/locks";
    private String productId;
    private String waitNode;
    private String lockNode;
    private CountDownLatch latch;
    private CountDownLatch connectedLatch = new CountDownLatch(1);
    private int sessionTimeout = 30000;

    public ZooKeeperDistributedLock(String productId) {
        this.productId = productId;
        try {
            String address = "192.168.31.187:2181,192.168.31.19:2181,192.168.31.227:2181";
            zk = new ZooKeeper(address, sessionTimeout, this);
            connectedLatch.await();
        } catch (IOException e) {
            throw new LockException(e);
        } catch (KeeperException e) {
            throw new LockException(e);
        } catch (InterruptedException e) {
            throw new LockException(e);
        }
    }

    public void process(WatchedEvent event) {
        if (event.getState() == KeeperState.SyncConnected) {
            connectedLatch.countDown();
            return;
        }

        if (this.latch != null) {
            this.latch.countDown();
        }
    }

    public void acquireDistributedLock() {
        try {
            if (this.tryLock()) {
                return;
            } else {
                waitForLock(waitNode, sessionTimeout);
            }
        } catch (KeeperException e) {
            throw new LockException(e);
        } catch (InterruptedException e) {
            throw new LockException(e);
        }
    }

    public boolean tryLock() {
        try {
            // 传入进去的locksRoot + “/” + productId
            // 假设productId代表了一个商品id，比如说1
            // locksRoot = locks
            // /locks/10000000000，/locks/10000000001，/locks/10000000002
            lockNode = zk.create(locksRoot + "/" + productId, new byte[0], ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.EPHEMERAL_SEQUENTIAL);

            // 看看刚创建的节点是不是最小的节点
            // locks：10000000000，10000000001，10000000002
            List<String> locks = zk.getChildren(locksRoot, false);
            Collections.sort(locks);

            if (lockNode.equals(locksRoot + "/" + locks.get(0))) {
                // 如果是最小的节点,则表示取得锁
                return true;
            }

            // 如果不是最小的节点，找到比自己小1的节点
            int previousLockIndex = -1;
            for (int i = 0; i < locks.size(); i++) {
                if (lockNode.equals(locksRoot + "/" +locks.get(i))){
                    previousLockIndex = i - 1;
                    break;
                }
            }

            this.waitNode = locks.get(previousLockIndex);
        } catch (KeeperException e) {
            throw new LockException(e);
        } catch (InterruptedException e) {
            throw new LockException(e);
        }
        return false;
    }

    private boolean waitForLock(String waitNode, long waitTime) throws InterruptedException, KeeperException {
        Stat stat = zk.exists(locksRoot + "/" + waitNode, true);
        if (stat != null) {
            this.latch = new CountDownLatch(1);
            this.latch.await(waitTime, TimeUnit.MILLISECONDS);
            this.latch = null;
        }
        return true;
    }

    public void unlock() {
        try {
            // 删除/locks/10000000000节点
            // 删除/locks/10000000001节点
            System.out.println("unlock " + lockNode);
            zk.delete(lockNode, -1);
            lockNode = null;
            zk.close();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (KeeperException e) {
            e.printStackTrace();
        }
    }

    public class LockException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        public LockException(String e) {
            super(e);
        }

        public LockException(Exception e) {
            super(e);
        }
    }
}
```

Tuy nhiên, dùng ephemeral node của zk còn có một vấn đề khác: zk dựa vào heartbeat định kỳ của session để duy trì client. Nếu client bị GC trong thời gian dài, zk có thể cho rằng client đã dừng và giải phóng khóa, cho phép client khác lấy khóa; nhưng sau khi GC kết thúc, client ban đầu vẫn cho rằng mình đang giữ khóa. Điều này có thể dẫn đến nhiều client cùng lấy được khóa. [#209](https://github.com/doocs/advanced-java/issues/209)

Để xử lý tình huống này, có thể tinh chỉnh JVM nhằm hạn chế tối đa các đợt GC kéo dài.

### So sánh khóa phân tán Redis và zk

-   Khóa phân tán Redis thực ra **đòi hỏi tự liên tục thử lấy khóa**, khá tốn hiệu năng.
-   Với khóa phân tán zk, nếu không lấy được khóa thì chỉ cần đăng ký listener, không cần chủ động liên tục thử lấy khóa, nên chi phí hiệu năng thấp hơn.

Một điểm khác là nếu client lấy khóa Redis gặp lỗi rồi dừng hoạt động thì phải đợi đến khi hết thời gian chờ mới giải phóng được khóa; còn với zk, vì tạo ephemeral znode nên khi client dừng thì znode biến mất và khóa tự động được giải phóng.

Mọi người không thấy khóa phân tán Redis khá rắc rối sao? Duyệt để khóa, tính thời gian, v.v... Ngữ nghĩa khóa phân tán của zk rõ ràng và cách triển khai đơn giản.

Vì vậy, tạm thời không phân tích quá nhiều khía cạnh; chỉ xét hai điểm này, theo kinh nghiệm thực tế của tôi, khóa phân tán zk đáng tin cậy hơn khóa phân tán Redis, đồng thời mô hình đơn giản và dễ dùng.
