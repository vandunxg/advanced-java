# Nguyên lý chế độ Redis cluster

## Câu hỏi phỏng vấn

Bạn có thể trình bày nguyên lý hoạt động của Redis cluster không? Trong chế độ cluster, Redis định địa chỉ key như thế nào? Có những thuật toán định địa chỉ phân tán nào? Bạn có biết consistent hash không?

## Phân tích suy nghĩ của người phỏng vấn

Vài năm trước, nếu muốn Redis có một số node và mỗi node lưu một phần dữ liệu thì phải **nhờ một số middleware** triển khai, chẳng hạn có `codis` hoặc `twemproxy`. Có một số middleware Redis; bạn đọc ghi qua middleware Redis, middleware sẽ chịu trách nhiệm lưu trữ phân tán dữ liệu trên các Redis instance ở nhiều máy.

Trong vài năm gần đây, Redis liên tục phát triển và phát hành các phiên bản mới. Chế độ Redis cluster hiện tại có thể triển khai nhiều Redis instance trên nhiều máy, mỗi instance lưu một phần dữ liệu; đồng thời mỗi Redis primary instance có thể gắn với Redis replica instance, tự động đảm bảo nếu Redis primary instance bị sập thì sẽ chuyển sang Redis replica instance.

Với phiên bản Redis mới, mọi người đều dùng Redis cluster, tức chế độ cluster được Redis hỗ trợ nguyên bản. Vì vậy người phỏng vấn chắc chắn sẽ hỏi liên tiếp về Redis cluster. Nếu bạn chưa từng dùng Redis cluster thì cũng bình thường; trước đây nhiều người dùng client như codis để hỗ trợ cluster, nhưng ít nhất bạn nên tìm hiểu Redis cluster.

Nếu lượng dữ liệu ít và chủ yếu cần chịu high concurrency, high performance — chẳng hạn cache của bạn thường chỉ vài GB — thì một máy là đủ. Có thể dùng replication: một master và nhiều slave. Số slave cần có phụ thuộc vào throughput đọc bạn yêu cầu; sau đó tự dựng một cụm sentinel để đảm bảo high availability cho kiến trúc master-slave của Redis.

Redis cluster chủ yếu dành cho tình huống **lượng dữ liệu lớn + high concurrency + high availability**. Redis cluster hỗ trợ N Redis master node, mỗi master node có thể gắn nhiều slave node. Nhờ vậy toàn bộ Redis có thể mở rộng theo chiều ngang. Nếu cần hỗ trợ cache có lượng dữ liệu lớn hơn thì mở rộng theo chiều ngang bằng cách thêm master node; mỗi master node sẽ lưu được thêm dữ liệu.

## Phân tích câu hỏi phỏng vấn

### Giới thiệu Redis cluster

-   Tự động sharding dữ liệu, mỗi master lưu một phần dữ liệu
-   Cung cấp sẵn hỗ trợ high availability; khi một số master không khả dụng, cluster vẫn có thể tiếp tục hoạt động

Trong kiến trúc Redis cluster, mỗi Redis cần mở hai port, ví dụ một port là 6379 và port còn lại là port cộng thêm 1w, chẳng hạn 16379.

Port 16379 dùng để các node giao tiếp với nhau, tức cluster bus. Cluster bus được dùng để phát hiện lỗi, cập nhật cấu hình và cấp quyền failover. Cluster bus dùng một protocol nhị phân khác là protocol `gossip`, giúp các node trao đổi dữ liệu hiệu quả, chiếm ít băng thông mạng và thời gian xử lý hơn.

### Cơ chế giao tiếp nội bộ giữa các node

#### Nguyên lý giao tiếp cơ bản

Có hai cách duy trì metadata của cluster: tập trung và protocol Gossip. Các node Redis cluster giao tiếp với nhau bằng protocol gossip.

**Kiểu tập trung** lưu metadata của cluster (thông tin node, sự cố, v.v.) tập trung tại một node. Một đại diện tiêu biểu của cách lưu metadata tập trung là `storm` trong lĩnh vực big data. Đây là engine tính toán dữ liệu lớn phân tán theo thời gian thực, dùng cấu trúc lưu trữ metadata tập trung; bên dưới dựa trên zookeeper (middleware điều phối phân tán) để lưu trữ và duy trì toàn bộ metadata.

![zookeeper-centralized-storage](../../high-concurrency/images/zookeeper-centralized-storage.png)

Redis duy trì metadata cluster theo một cách khác là protocol `gossip`: tất cả node đều giữ một bản metadata. Nếu metadata thay đổi ở một node nào đó thì node đó liên tục gửi metadata đến các node khác để chúng cũng cập nhật metadata.

![Redis-gossip](../../high-concurrency/images/redis-gossip.png)

**Ưu điểm** của kiểu **tập trung** là đọc và cập nhật metadata rất kịp thời: ngay khi metadata thay đổi, nó lập tức được cập nhật vào nơi lưu trữ tập trung và các node khác có thể nhận biết khi đọc. **Nhược điểm** là toàn bộ áp lực cập nhật metadata tập trung tại một nơi, có thể gây áp lực lên nơi lưu trữ metadata.

Ưu điểm của gossip là cập nhật metadata được phân tán, không tập trung tại một nơi; các request cập nhật lần lượt được gửi đến mọi node để cập nhật, giúp giảm áp lực. Nhược điểm là cập nhật metadata có độ trễ và có thể khiến một số thao tác trong cluster bị chậm.

-   Port 10000: mỗi node có một port riêng để giao tiếp giữa các node, bằng port cung cấp dịch vụ cộng 10000; chẳng hạn port 7001 thì port giao tiếp giữa các node là 17001. Cứ một khoảng thời gian, mỗi node gửi message `ping` đến một số node khác; các node nhận `ping` sẽ phản hồi `pong`.

-   Thông tin trao đổi: gồm thông tin sự cố, thêm/xóa node, thông tin hash slot, v.v.

#### Protocol gossip

Protocol gossip bao gồm nhiều loại message như `ping`, `pong`, `meet`, `fail`, v.v.

-   meet: một node gửi meet đến node mới tham gia để đưa node mới vào cluster; sau đó node mới bắt đầu giao tiếp với các node khác.

```bash
Redis-trib.rb add-node
```

Thực tế bên trong chỉ là gửi một message gossip meet đến node mới tham gia, thông báo node đó gia nhập cluster của chúng ta.

-   ping: mỗi node thường xuyên gửi ping đến các node khác; message chứa trạng thái của chính nó và metadata cluster mà nó duy trì. Các node trao đổi metadata với nhau thông qua ping.
-   pong: phản hồi ping và meet; chứa trạng thái cùng thông tin khác của node, đồng thời dùng để broadcast và cập nhật thông tin.
-   fail: sau khi một node xác định node khác đã fail, nó gửi fail đến các node khác để thông báo node đó đã sập.

#### Tìm hiểu sâu message ping

Khi ping cần mang theo một số metadata; nếu ping quá thường xuyên thì có thể làm tăng tải mạng.

Mỗi node gửi ping 10 lần mỗi giây; mỗi lần chọn 5 node khác có thời gian không giao tiếp lâu nhất. Dĩ nhiên, nếu phát hiện độ trễ giao tiếp với một node đạt `cluster_node_timeout / 2` thì gửi ping ngay để tránh độ trễ trao đổi dữ liệu quá lâu và bị tụt lại quá xa. Ví dụ, hai node không trao đổi dữ liệu trong 10 phút thì toàn cluster sẽ ở trạng thái metadata không nhất quán nghiêm trọng và phát sinh vấn đề. Vì vậy có thể điều chỉnh `cluster_node_timeout`; nếu đặt giá trị lớn thì tần suất ping giảm.

Mỗi lần ping, node gửi thông tin của chính mình và thông tin của 1/10 số node khác để trao đổi. Message chứa thông tin của ít nhất `3` node khác và nhiều nhất `tổng số node trừ 2` node khác.

### Thuật toán định địa chỉ phân tán

-   Thuật toán hash (tái tạo lượng lớn cache)
-   Consistent hash (tự động migration cache) + virtual node (tự động cân bằng tải)
-   Thuật toán hash slot của Redis cluster

#### Thuật toán hash

Khi nhận một key, trước tiên tính giá trị hash rồi lấy modulo theo số node. Sau đó ghi vào các master node khác nhau. Khi một master node bị sập, mọi request đến sẽ lấy modulo theo số master node còn lại mới nhất rồi thử lấy dữ liệu. Việc này khiến **phần lớn request không thể lấy được cache hợp lệ**, dẫn đến lượng lớn lưu lượng đổ vào database.

![hash](../../high-concurrency/images/hash.png)

#### Thuật toán consistent hash

Thuật toán consistent hash tổ chức toàn bộ không gian giá trị hash thành một vòng tròn ảo, toàn không gian đi theo chiều kim đồng hồ; tiếp theo hash từng master node (dùng IP hoặc hostname của server). Nhờ đó xác định được vị trí của từng node trên hash ring.

Khi nhận một key, trước tiên tính giá trị hash và xác định vị trí của dữ liệu trên vòng; từ vị trí này đi **theo chiều kim đồng hồ** trên vòng, master node đầu tiên gặp được là nơi key thuộc về.

Trong consistent hash, nếu một node bị sập thì chỉ dữ liệu nằm giữa node đó và node trước nó trên không gian vòng (node đầu tiên gặp được khi đi ngược chiều kim đồng hồ) bị ảnh hưởng; phần còn lại không bị ảnh hưởng. Thêm node cũng tương tự.

Tuy nhiên, khi có quá ít node thì consistent hash dễ phân bố không đồng đều và gây ra vấn đề **hotspot cache**. Để giải quyết vấn đề hotspot này, consistent hash đưa vào cơ chế virtual node: tính nhiều giá trị hash cho mỗi node và đặt một virtual node tại từng vị trí tính được. Như vậy dữ liệu được phân bố đồng đều và cân bằng tải.

![consistent-hashing-algorithm](../../high-concurrency/images/consistent-hashing-algorithm.png)

#### Thuật toán hash slot của Redis cluster

Redis cluster có số lượng cố định là `16384` hash slot. Tính giá trị `CRC16` cho mỗi `key`, sau đó lấy modulo `16384` để lấy hash slot tương ứng với key.

Mỗi master trong Redis cluster giữ một phần slot; chẳng hạn có 3 master thì mỗi master có thể giữ hơn 5000 hash slot. Hash slot giúp việc thêm và gỡ node đơn giản: thêm master thì chuyển một phần hash slot của các master khác sang nó; gỡ một master thì chuyển hash slot của nó sang các master khác. Chi phí chuyển hash slot rất thấp. API client có thể khiến một số dữ liệu được chỉ định dùng chung một hash slot thông qua `hash tag`.

Nếu bất kỳ máy nào bị sập thì hai node còn lại không bị ảnh hưởng, vì key được tra theo hash slot chứ không theo máy.

![hash-slot](../../high-concurrency/images/hash-slot.png)

### High availability của Redis cluster và nguyên lý chuyển đổi primary/standby

Nguyên lý high availability của Redis cluster gần như giống với Sentinel.

#### Phán định node bị sập

Nếu một node cho rằng node khác bị sập thì đó là `pfail`, tức **sập chủ quan**. Nếu nhiều node đều cho rằng node khác bị sập thì đó là `fail`, tức **sập khách quan**; nguyên lý gần như giống Sentinel: sdown, odown.

Nếu một node không nhận được `pong` liên tục trong khoảng `cluster-node-timeout` thì node đó được xem là `pfail`.

Nếu một node cho rằng node khác `pfail`, nó gửi thông tin đó cho các node khác trong message `gossip ping`. Nếu **hơn một nửa** số node cho rằng nó `pfail`, thì node sẽ chuyển thành `fail`.

#### Lọc slave node

Với master node bị sập, chọn một slave node trong số các slave của nó để chuyển thành master node.

Kiểm tra thời gian từng slave node bị mất kết nối với master node. Nếu vượt quá `cluster-node-timeout * cluster-slave-validity-factor` thì slave node đó **không đủ điều kiện** chuyển thành `master`.

#### Bầu chọn slave node

Mỗi slave node đặt thời gian bầu chọn dựa trên offset của dữ liệu nó đã replication từ master; offset càng lớn (replication được nhiều dữ liệu hơn) thì thời điểm bầu chọn càng sớm, được ưu tiên bầu chọn.

Tất cả master node bắt đầu bỏ phiếu bầu slave; chúng bỏ phiếu cho slave đang được bầu. Nếu đa số master node `（N/2 + 1）` bỏ phiếu cho một slave node thì cuộc bầu chọn thành công và slave node đó có thể chuyển thành master.

Slave node thực hiện chuyển đổi primary/standby và chuyển thành primary node.

#### So sánh với Sentinel

Toàn bộ quy trình rất giống Sentinel; vì vậy Redis cluster có nhiều chức năng, tích hợp trực tiếp chức năng replication và Sentinel.
