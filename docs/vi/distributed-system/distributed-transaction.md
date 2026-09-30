# Nguyên lý giao dịch phân tán

## Câu hỏi phỏng vấn

Bạn hiểu gì về giao dịch phân tán? Các bạn giải quyết vấn đề giao dịch phân tán như thế nào?

## Phân tích góc nhìn của người phỏng vấn

Chỉ cần nói rằng bạn đã xây dựng hệ thống phân tán thì chắc chắn sẽ bị hỏi về giao dịch phân tán. Nếu hoàn toàn không biết gì về giao dịch phân tán thì thực sự sẽ gặp khó; ít nhất bạn phải biết có những phương án nào, thường thực hiện ra sao và ưu nhược điểm của từng phương án là gì.

Hiện nay, hệ thống phân tán đã trở thành tiêu chuẩn trong phỏng vấn; **giao dịch phân tán** do hệ thống phân tán kéo theo cũng đã thành nội dung thường gặp. Vì xây dựng hệ thống chắc chắn phải dùng giao dịch; nếu là hệ thống phân tán thì chắc chắn cần giao dịch phân tán. Chưa cần nói bạn đã làm qua hay chưa, ít nhất phải hiểu có những phương án nào và mỗi phương án có thể gặp vấn đề gì, chẳng hạn vấn đề mạng của phương án TCC hay vấn đề nhất quán của phương án XA.

## Phân tích câu hỏi phỏng vấn

Có 6 phương án chính để triển khai giao dịch phân tán:

-   Phương án XA
-   Phương án TCC
-   Phương án SAGA
-   Bảng thông điệp cục bộ
-   Phương án nhất quán cuối cùng bằng thông điệp tin cậy
-   Phương án thông báo với nỗ lực tối đa

### Phương án commit hai giai đoạn / phương án XA

Phương án XA chính là commit hai giai đoạn. Trong đó có khái niệm **transaction manager**, chịu trách nhiệm điều phối giao dịch của nhiều cơ sở dữ liệu (resource manager). Transaction manager trước tiên hỏi từng cơ sở dữ liệu đã sẵn sàng chưa. Nếu tất cả cơ sở dữ liệu trả lời đồng ý thì giao dịch được commit chính thức và thao tác được thực hiện trên từng cơ sở dữ liệu; nếu bất kỳ cơ sở dữ liệu nào trả lời không đồng ý thì giao dịch được rollback.

Phương án giao dịch phân tán này phù hợp hơn với ứng dụng đơn khối cần giao dịch phân tán trên nhiều cơ sở dữ liệu. Do phụ thuộc nghiêm trọng vào tầng cơ sở dữ liệu để xử lý các giao dịch phức tạp nên hiệu suất thấp, tuyệt đối không phù hợp với tình huống đồng thời cao. Nếu muốn sử dụng, có thể dùng `Spring + JTA`; chỉ cần tìm một ví dụ demo là sẽ hiểu cách làm.

Chúng tôi ít dùng phương án này. Nói chung, một thao tác **trong nội bộ một hệ thống mà truy cập nhiều cơ sở dữ liệu** là **không phù hợp**. Tôi xin giải thích: hiện nay, trong kiến trúc microservice, một hệ thống lớn được chia thành hàng chục hoặc thậm chí hàng trăm dịch vụ. Thông thường quy định và tiêu chuẩn của chúng tôi yêu cầu **mỗi dịch vụ chỉ được thao tác trên một cơ sở dữ liệu tương ứng của nó**.

Nếu cần thao tác trên cơ sở dữ liệu thuộc dịch vụ khác, không được kết nối trực tiếp đến cơ sở dữ liệu của dịch vụ đó. Làm vậy vi phạm tiêu chuẩn kiến trúc microservice. Nếu tùy tiện truy cập chéo giữa hàng trăm dịch vụ thì mọi thứ sẽ rối tung, không thể quản lý hay quản trị được; có thể xảy ra tình trạng người khác sửa sai dữ liệu hoặc ghi hỏng cơ sở dữ liệu của bạn.

Nếu muốn thao tác trên cơ sở dữ liệu của dịch vụ khác, bắt buộc phải thực hiện thông qua **gọi giao diện của dịch vụ đó**; tuyệt đối không được truy cập chéo cơ sở dữ liệu của dịch vụ khác.

![distributed-transacion-XA](./images/distributed-transaction-XA.png)

### Phương án TCC

TCC là viết tắt của: `Try`, `Confirm`, `Cancel`.

-   Giai đoạn Try: kiểm tra tài nguyên của từng dịch vụ và **khóa hoặc giữ chỗ trước** các tài nguyên đó.
-   Giai đoạn Confirm: **thực hiện thao tác thực tế** trong từng dịch vụ.
-   Giai đoạn Cancel: nếu phương thức nghiệp vụ của bất kỳ dịch vụ nào thực thi lỗi thì cần **bù trừ**, tức rollback logic nghiệp vụ đã thực thi thành công. (Rollback những phần đã thực thi thành công.)

Thành thật mà nói, phương án này hầu như ít người dùng; chúng tôi cũng ít dùng, nhưng vẫn có trường hợp sử dụng. Vì thao tác **rollback giao dịch** thực tế **phụ thuộc rất nhiều vào mã rollback và bù trừ do chính bạn viết**, dẫn đến lượng mã bù trừ khổng lồ và rất khó chịu.

Chẳng hạn, với các tình huống liên quan đến **tiền**, **thanh toán** và **giao dịch**, chúng tôi thường dùng TCC để bảo đảm nghiêm ngặt rằng giao dịch phân tán hoặc thành công toàn bộ, hoặc tự động rollback toàn bộ; nhờ vậy bảo đảm tính chính xác của dòng tiền và tránh sai sót về tài chính.

Ngoài ra, tốt nhất là thời gian thực thi của từng nghiệp vụ đều ngắn.

Tuy nhiên, thành thật mà nói, nói chung nên tránh cách này nếu có thể. Tự viết logic rollback hoặc bù trừ rất khó chịu, và mã nghiệp vụ sẽ khó bảo trì.

![distributed-transacion-TCC](./images/distributed-transaction-TCC.png)

### Phương án Saga

Các nghiệp vụ như hệ thống tài chính cốt lõi có thể chọn phương án TCC để hướng đến tính nhất quán mạnh và mức đồng thời cao hơn. Với nhiều hệ thống nghiệp vụ nằm phía trên hệ thống tài chính cốt lõi, người ta thường chọn giao dịch bù trừ. Lý thuyết Saga về xử lý giao dịch bù trừ đã được đề xuất hơn 30 năm trước; chỉ đến những năm gần đây, cùng với sự phát triển của microservice, lý thuyết này mới dần được quan tâm. Hiện nay, trong ngành, Saga được xem là một giải pháp cho giao dịch dài hạn.

#### Nguyên lý cơ bản

Mỗi bên tham gia trong quy trình nghiệp vụ commit giao dịch cục bộ của mình. Nếu một bên tham gia thất bại thì bù trừ các bên đã thành công trước đó. Bên trái của hình dưới là quy trình giao dịch bình thường; khi xảy ra lỗi ở T3 thì bắt đầu quy trình bù trừ giao dịch ở bên phải, thực thi ngược các dịch vụ bù trừ C3, C2, C1 cho T3, T2, T1 để hoàn lại các dữ liệu đã bị T3, T2, T1 thay đổi.

![distributed-transacion-TCC](./images/distributed-transaction-saga.png)

#### Tình huống sử dụng

Với tình huống yêu cầu tính nhất quán cao, quy trình ngắn và đồng thời cao, chẳng hạn hệ thống tài chính cốt lõi, thường ưu tiên phương án TCC. Trong một số tình huống khác, không cần tính nhất quán mạnh đến vậy mà chỉ cần bảo đảm tính nhất quán cuối cùng.

Ví dụ, nhiều nghiệp vụ nằm phía trên hệ thống tài chính cốt lõi (tầng kênh, tầng sản phẩm, tầng tích hợp hệ thống) chỉ cần nhất quán cuối cùng; chúng có nhiều bước, quy trình dài và có thể cần gọi dịch vụ của công ty khác. Nếu chọn TCC để phát triển trong tình huống này thì thứ nhất chi phí cao, thứ hai không thể yêu cầu dịch vụ của công ty khác cũng tuân theo mô hình TCC. Đồng thời, quy trình dài khiến ranh giới giao dịch quá rộng, thời gian khóa dài và ảnh hưởng đến hiệu năng đồng thời.

Vì vậy, Saga phù hợp với các tình huống:

-   Quy trình nghiệp vụ dài và có nhiều bước;
-   Bên tham gia gồm dịch vụ của công ty khác hoặc hệ thống cũ, không thể cung cấp ba giao diện theo yêu cầu của mô hình TCC.

#### Ưu điểm

-   Commit giao dịch cục bộ trong một giai đoạn, không khóa, hiệu năng cao;
-   Các bên tham gia có thể thực thi bất đồng bộ, thông lượng cao;
-   Dịch vụ bù trừ dễ triển khai, vì thao tác ngược lại của một thao tác cập nhật khá dễ hiểu.

#### Nhược điểm

-   Không bảo đảm tính cô lập của giao dịch.

### Bảng thông điệp cục bộ

Bảng thông điệp cục bộ là ý tưởng do eBay ở nước ngoài đề xuất.

Ý tưởng đại khái như sau:

1. Trong cùng một giao dịch cục bộ, hệ thống A vừa thao tác dữ liệu của mình vừa chèn một bản ghi vào bảng thông điệp;
2. Tiếp đó, hệ thống A gửi thông điệp này đến MQ;
3. Sau khi nhận thông điệp, hệ thống B chèn một bản ghi vào bảng thông điệp cục bộ của mình trong một giao dịch, đồng thời thực hiện các thao tác nghiệp vụ khác. Nếu thông điệp đã được xử lý thì giao dịch rollback, nhờ vậy **bảo đảm thông điệp không bị xử lý trùng lặp**;
4. Sau khi hệ thống B thực thi thành công, hệ thống sẽ cập nhật trạng thái trong bảng thông điệp cục bộ của mình và trạng thái trong bảng thông điệp của hệ thống A;
5. Nếu hệ thống B xử lý thất bại thì trạng thái bảng thông điệp không được cập nhật. Khi đó, hệ thống A sẽ quét bảng thông điệp của mình theo lịch; nếu có thông điệp chưa xử lý thì gửi lại đến MQ để hệ thống B xử lý lần nữa;
6. Phương án này bảo đảm tính nhất quán cuối cùng. Dù giao dịch của B thất bại, A vẫn liên tục gửi lại thông điệp cho đến khi B xử lý thành công.

Thành thật mà nói, vấn đề lớn nhất của phương án này là **phụ thuộc nghiêm trọng vào bảng thông điệp trong cơ sở dữ liệu để quản lý giao dịch**. Sẽ thế nào nếu có mức đồng thời cao? Làm sao mở rộng? Vì vậy, thực tế phương án này ít được dùng.

![distributed-transaction-local-message-table](./images/distributed-transaction-local-message-table.png)

### Phương án nhất quán cuối cùng bằng thông điệp tin cậy

Ý tưởng là không dùng bảng thông điệp cục bộ nữa mà triển khai giao dịch trực tiếp dựa trên MQ. Ví dụ, RocketMQ của Alibaba hỗ trợ giao dịch bằng thông điệp.

Ý tưởng đại khái như sau:

1. Hệ thống A gửi một thông điệp prepared đến MQ trước; nếu gửi thông điệp prepared thất bại thì hủy thao tác và không thực hiện tiếp;
2. Nếu gửi thông điệp thành công thì tiếp tục thực hiện giao dịch cục bộ; nếu thành công thì báo MQ gửi thông điệp xác nhận, nếu thất bại thì báo MQ rollback thông điệp;
3. Nếu gửi thông điệp xác nhận thì hệ thống B sẽ nhận được thông điệp xác nhận và thực hiện giao dịch cục bộ;
4. MQ sẽ tự động **định kỳ thăm dò** mọi thông điệp prepared bằng cách gọi lại giao diện của bạn và hỏi giao dịch cục bộ có thất bại hay không. Với các thông điệp chưa gửi xác nhận, cần tiếp tục thử lại hay rollback? Thông thường ở đây có thể kiểm tra cơ sở dữ liệu để biết giao dịch cục bộ trước đó đã thực thi hay chưa; nếu đã rollback thì cũng rollback thông điệp. Cách này tránh trường hợp giao dịch cục bộ thực thi thành công nhưng gửi thông điệp xác nhận thất bại.
5. Nếu giao dịch của hệ thống B thất bại thì sao? Hãy thử lại, tự động tiếp tục thử cho đến khi thành công. Nếu thực sự không được thì có thể rollback nghiệp vụ quan trọng về dòng tiền; chẳng hạn sau khi hệ thống B rollback cục bộ, tìm cách thông báo hệ thống A cũng rollback. Hoặc gửi cảnh báo để con người rollback và bù trừ thủ công.
6. Phương án này khá phù hợp và hiện được phần lớn công ty Internet trong nước sử dụng. Bạn có thể dùng tính năng được RocketMQ hỗ trợ hoặc tự xây dựng một bộ logic tương tự dựa trên ActiveMQ hay RabbitMQ; ý tưởng chung là như vậy.

![distributed-transaction-reliable-message](./images/distributed-transaction-reliable-message.png)

### Phương án thông báo với nỗ lực tối đa

Ý tưởng đại khái của phương án này là:

1. Sau khi giao dịch cục bộ của hệ thống A thực thi xong, gửi một thông điệp đến MQ;
2. Có một **dịch vụ thông báo với nỗ lực tối đa** chuyên tiêu thụ MQ. Dịch vụ này tiêu thụ MQ rồi ghi lại thông tin vào cơ sở dữ liệu hoặc đưa vào hàng đợi trong bộ nhớ, sau đó gọi giao diện của hệ thống B;
3. Nếu hệ thống B thực thi thành công thì xong; nếu thất bại, dịch vụ thông báo với nỗ lực tối đa sẽ định kỳ thử gọi lại hệ thống B, lặp lại N lần; nếu cuối cùng vẫn không được thì từ bỏ.

### Công ty bạn xử lý giao dịch phân tán như thế nào?

Nếu thực sự được hỏi, có thể trả lời như sau: với một số tình huống đặc biệt nghiêm ngặt, công ty chúng tôi dùng TCC để bảo đảm tính nhất quán mạnh; các tình huống khác triển khai giao dịch phân tán dựa trên RocketMQ của Alibaba.

Hãy chọn một tình huống có yêu cầu nghiêm ngặt về dòng tiền, tuyệt đối không được sai, rồi nói rằng bạn dùng phương án TCC. Với tình huống giao dịch phân tán thông thường, sau khi chèn đơn hàng cần gọi dịch vụ kho để cập nhật tồn kho; dữ liệu tồn kho không nhạy cảm bằng dòng tiền nên có thể dùng phương án nhất quán cuối cùng bằng thông điệp tin cậy.

Lưu ý: các phiên bản RocketMQ trước 3.2.6 có thể triển khai theo ý tưởng trên; các phiên bản sau đó đã thay đổi một số giao diện nên ở đây tôi không trình bày thêm.

Tất nhiên, nếu muốn, bạn có thể tham khảo phương án nhất quán cuối cùng bằng thông điệp tin cậy để tự triển khai một bộ giao dịch phân tán, chẳng hạn dựa trên RocketMQ.
