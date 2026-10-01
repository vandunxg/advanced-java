# Triển khai high availability bằng Redis Sentinel

## Giới thiệu Sentinel

sentinel, tên tiếng Trung là 哨兵. Sentinel là một thành phần rất quan trọng trong kiến trúc cụm Redis, chủ yếu có các chức năng sau:

-   Giám sát cluster: chịu trách nhiệm giám sát tiến trình Redis master và slave có hoạt động bình thường hay không.
-   Thông báo message: nếu một Redis instance gặp sự cố thì Sentinel gửi message cảnh báo cho quản trị viên.
-   Failover: nếu master node bị sập thì tự động chuyển sang slave node.
-   Trung tâm cấu hình: nếu failover xảy ra thì thông báo cho client địa chỉ master mới.

Sentinel dùng để triển khai high availability cho cụm Redis; bản thân nó cũng được phân tán và chạy thành một cụm Sentinel, các node phối hợp với nhau.

-   Khi failover, để xác định một master node có bị sập hay không cần đa số Sentinel đồng ý; việc này liên quan đến bài toán bầu chọn phân tán.
-   Ngay cả khi một số node Sentinel bị sập, cụm Sentinel vẫn hoạt động bình thường. Nếu hệ thống failover — thành phần quan trọng của cơ chế high availability — chỉ có một điểm lỗi thì sẽ rất tệ.

## Kiến thức cốt lõi về Sentinel

-   Sentinel cần ít nhất 3 instance để đảm bảo độ vững chắc.
-   Kiến trúc triển khai Sentinel + Redis primary-replica **không đảm bảo không mất dữ liệu**, chỉ đảm bảo high availability cho cụm Redis.
-   Với kiến trúc triển khai phức tạp như Sentinel + Redis primary-replica, nên kiểm thử và diễn tập đầy đủ ở cả môi trường test lẫn production.

Cụm Sentinel phải triển khai từ 2 node trở lên. Nếu cụm chỉ triển khai 2 Sentinel instance thì quorum = 1.

```
+----+         +----+
| M1 |---------| R1 |
| S1 |         | S2 |
+----+         +----+
```

Cấu hình `quorum=1`; nếu master bị sập thì chỉ cần một trong hai Sentinel s1 và s2 cho rằng master bị sập là có thể chuyển đổi. Đồng thời, s1 và s2 sẽ bầu một Sentinel để thực hiện failover. Nhưng lúc này cũng cần majority, tức đa số Sentinel đang chạy.

```
2 个哨兵，majority=2
3 个哨兵，majority=2
4 个哨兵，majority=2
5 个哨兵，majority=3
...
```

Nếu lúc này chỉ tiến trình M1 bị sập còn Sentinel s1 vẫn hoạt động bình thường thì failover vẫn OK. Nhưng nếu máy đang chạy cả M1 lẫn S1 bị sập thì chỉ còn 1 Sentinel; lúc này không có majority cho phép thực hiện failover. Dù máy khác còn R1, failover cũng sẽ không được thực hiện.

Cụm Sentinel kinh điển gồm 3 node như sau:

```
       +----+
       | M1 |
       | S1 |
       +----+
          |
+----+    |    +----+
| R2 |----+----| R3 |
| S2 |         | S3 |
+----+         +----+
```

Cấu hình `quorum=2`; nếu máy chứa M1 bị sập thì vẫn còn 2 trong 3 Sentinel. S2 và S3 có thể cùng xác định master bị sập, rồi bầu một node thực hiện failover. Đồng thời majority của 3 Sentinel là 2, nên hai Sentinel còn chạy có thể cho phép thực hiện failover.

## Vấn đề mất dữ liệu khi Sentinel chuyển đổi primary/standby của Redis

### Hai tình huống gây mất dữ liệu

Quá trình chuyển đổi primary/standby có thể gây mất dữ liệu:

-   Mất dữ liệu do replication bất đồng bộ

Do replication từ master đến slave là bất đồng bộ, một phần dữ liệu có thể chưa được sao chép sang slave thì master đã bị sập; khi đó phần dữ liệu này bị mất.

![async-replication-data-lose-case](../../high-concurrency/images/async-replication-data-lose-case.png)

-   Mất dữ liệu do split-brain

Split-brain nghĩa là máy chứa một master nào đó đột nhiên **mất kết nối với mạng bình thường**, không thể kết nối với các máy slave khác, nhưng trên thực tế master vẫn đang chạy. Khi đó Sentinel có thể **cho rằng** master đã sập rồi bắt đầu bầu chọn, chuyển các slave khác thành master. Lúc này trong cluster sẽ có hai master, đây chính là hiện tượng **split-brain**.

Lúc này dù một slave đã được chuyển thành master, client có thể chưa kịp chuyển sang master mới và vẫn tiếp tục ghi dữ liệu vào master cũ. Vì vậy khi master cũ hoạt động trở lại, nó sẽ được gắn làm slave của master mới; dữ liệu của chính nó sẽ bị xóa và được replication lại từ master mới. Nhưng master mới không có dữ liệu mà client đã ghi sau đó, vì vậy phần dữ liệu này cũng bị mất.

![Redis-cluster-split-brain](../../high-concurrency/images/redis-cluster-split-brain.png)

### Giải pháp cho vấn đề mất dữ liệu

Thực hiện cấu hình như sau:

```bash
min-slaves-to-write 1
min-slaves-max-lag 10
```

Cấu hình này yêu cầu có ít nhất 1 slave và độ trễ replication, đồng bộ dữ liệu không được vượt quá 10 giây.

Nếu độ trễ replication và đồng bộ dữ liệu của tất cả slave đều vượt quá 10 giây thì lúc đó master sẽ không nhận thêm request nào nữa.

-   Giảm lượng dữ liệu mất do replication bất đồng bộ

Nhờ cấu hình `min-slaves-max-lag`, khi slave replication dữ liệu và độ trễ ack quá dài thì có thể xem là lượng dữ liệu có thể mất khi master sập quá lớn; khi đó từ chối request ghi. Như vậy có thể giới hạn lượng dữ liệu mất do một phần dữ liệu chưa kịp đồng bộ sang slave khi master sập trong một phạm vi có thể kiểm soát.

-   Giảm lượng dữ liệu mất do split-brain

Nếu master bị split-brain và mất kết nối với các slave khác thì hai cấu hình trên đảm bảo rằng khi master không thể gửi dữ liệu đến đủ số lượng slave được chỉ định và slave không gửi ack message trong hơn 10 giây thì nó sẽ từ chối request ghi từ client. Vì vậy trong tình huống split-brain, tối đa chỉ mất dữ liệu của 10 giây.

## Cơ chế chuyển đổi giữa sdown và odown

-   sdown là sập chủ quan: nếu một Sentinel tự cho rằng một master bị sập thì đó là sập chủ quan.
-   odown là sập khách quan: nếu số lượng Sentinel bằng quorum đều cho rằng một master bị sập thì đó là sập khách quan.

Điều kiện đạt sdown rất đơn giản: nếu một Sentinel ping master vượt quá số mili giây được chỉ định bởi `is-master-down-after-milliseconds` thì Sentinel chủ quan cho rằng master bị sập. Nếu trong thời gian chỉ định, một Sentinel nhận được thông tin từ số Sentinel khác bằng quorum rằng master đó đang sdown thì xem như đã odown.

## Cơ chế tự động phát hiện của cụm Sentinel

Sentinel phát hiện lẫn nhau thông qua hệ thống `pub/sub` của Redis. Mỗi Sentinel gửi một message đến channel `__sentinel__:hello`; lúc này tất cả Sentinel khác đều có thể nhận message và nhận biết sự tồn tại của các Sentinel khác.

Cứ mỗi hai giây, từng Sentinel gửi **một message** đến channel `__sentinel__:hello` tương ứng với master+slaves mà nó giám sát. Message chứa host, ip, runid của Sentinel và cấu hình giám sát master đó.

Mỗi Sentinel cũng **lắng nghe** channel `__sentinel__:hello` tương ứng với từng master+slaves mà nó giám sát để nhận biết các Sentinel khác cũng đang lắng nghe master+slaves này.

Từng Sentinel còn trao đổi cấu hình giám sát `master` với các Sentinel khác và đồng bộ cấu hình giám sát cho nhau.

## Tự động hiệu chỉnh cấu hình slave

Sentinel chịu trách nhiệm tự động hiệu chỉnh một số cấu hình của slave. Ví dụ, nếu slave sẽ trở thành ứng viên master tiềm năng, Sentinel đảm bảo slave thực hiện replication dữ liệu từ master hiện tại. Nếu slave kết nối với một master sai, chẳng hạn sau khi failover, Sentinel đảm bảo các slave kết nối đúng master.

## Thuật toán bầu chọn slave->master

Nếu một master được xem là odown và số Sentinel bằng majority đều cho phép chuyển đổi primary/standby thì một Sentinel sẽ thực hiện thao tác chuyển đổi. Trước tiên cần bầu một slave, dựa trên một số thông tin của slave:

-   Thời gian mất kết nối với master
-   Độ ưu tiên của slave
-   Replication offset
-   Run id

Nếu thời gian slave mất kết nối với master vượt quá 10 lần `down-after-milliseconds` cộng với thời gian master bị sập thì slave được xem là không phù hợp để bầu làm master.

```
(down-after-milliseconds * 10) + milliseconds_since_master_is_in_SDOWN_state
```

Tiếp theo sẽ sắp xếp các slave:

-   Sắp xếp theo độ ưu tiên của slave; slave priority càng thấp thì độ ưu tiên càng cao.
-   Nếu slave priority bằng nhau thì xét replica offset: slave nào replication được nhiều dữ liệu hơn, offset càng tiến về sau, thì độ ưu tiên càng cao.
-   Nếu hai điều kiện trên đều bằng nhau thì chọn slave có run id nhỏ hơn.

## quorum và majority

Mỗi lần Sentinel muốn chuyển đổi primary/standby, trước hết cần số Sentinel bằng quorum xác định trạng thái odown, sau đó bầu ra một Sentinel thực hiện chuyển đổi. Sentinel này cũng cần được majority Sentinel cấp quyền thì mới chính thức thực hiện chuyển đổi.

Nếu quorum < majority, chẳng hạn có 5 Sentinel, majority là 3 và quorum được đặt là 2, thì 3 Sentinel cấp quyền là đủ để thực hiện chuyển đổi.

Nhưng nếu quorum >= majority thì phải có đủ số Sentinel bằng quorum cấp quyền. Ví dụ, có 5 Sentinel và quorum là 5 thì phải được cả 5 Sentinel đồng ý cấp quyền mới thực hiện chuyển đổi được.

## configuration epoch

Sentinel giám sát một nhóm Redis master+slaves với cấu hình giám sát tương ứng.

Sentinel thực hiện chuyển đổi sẽ lấy một configuration epoch từ master mới cần chuyển sang (salve->master). Đây là số version; version của mỗi lần chuyển đổi phải là duy nhất.

Nếu Sentinel đầu tiên được bầu thất bại khi chuyển đổi thì các Sentinel khác sẽ chờ hết thời gian failover-timeout rồi tiếp tục thực hiện chuyển đổi. Lúc này chúng lấy một configuration epoch mới để làm version mới.

## Lan truyền cấu hình

Sau khi hoàn tất chuyển đổi, Sentinel cập nhật cấu hình master mới nhất tại máy cục bộ rồi đồng bộ cấu hình này cho các Sentinel khác thông qua cơ chế message `pub/sub` đã nói ở trên.

Version trước đó rất quan trọng vì các message đều được phát và lắng nghe qua một channel. Vì vậy sau khi Sentinel hoàn tất một lần chuyển đổi mới, cấu hình master mới sẽ gắn với version mới. Các Sentinel khác cập nhật cấu hình master của mình dựa trên độ lớn của version.
