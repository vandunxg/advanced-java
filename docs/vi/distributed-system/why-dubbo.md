# Vì sao cần tách hệ thống?

## Câu hỏi phỏng vấn

Vì sao cần tách hệ thống? Tách hệ thống như thế nào? Sau khi tách có thể không dùng Dubbo không?

## Phân tích góc nhìn của người phỏng vấn

Bắt đầu từ câu hỏi này là bước vào phần hệ thống phân tán. Hiện nay, khi đi phỏng vấn, hệ thống phân tán đã trở thành nội dung tiêu chuẩn; không công ty nào không hỏi bạn về hệ thống phân tán. Nếu bạn không biết về hệ thống phân tán thì CV gần như không thể xem nổi và sẽ chẳng ai mời bạn đi phỏng vấn.

Vì sao lại như vậy? Đó là do sự phát triển công nghệ của cả ngành.

Theo ký ức của tôi, vào đầu những năm 2010, rất ít người trong toàn ngành CNTT nói về hệ thống phân tán, chưa nói đến microservice. Dù nhiều công ty lớn như BAT đã sớm dùng kiến trúc phân tán với nhiều dịch vụ vì hệ thống phức tạp, phần lớn microservice của họ được triển khai bằng framework do chính họ tự phát triển.

Nhưng đúng là trong thời kỳ đó, mọi người rất coi trọng SSH2; phần lớn công ty vừa và nhỏ dùng Struts2, Spring, Hibernate. Muộn hơn một chút mới chuyển sang bộ Spring MVC, Spring và MyBatis. Trình độ công nghệ của cả ngành lúc bấy giờ là như vậy. Oracle rất thịnh hành, quản trị viên Oracle rất được săn đón, tối ưu hiệu năng Oracle và những thứ tương tự đều là chiêu lợi hại của dân CNTT. Ngay cả dữ liệu lớn cũng ít được nhắc đến; các trung tâm đào tạo chứng chỉ như OCP, OCM khi đó rất sôi động.

Tuy nhiên, cùng với sự phát triển của thời đại, nhiều công ty dần chấp nhận kiến trúc hệ thống phân tán. Công nghệ có ảnh hưởng đặc biệt quan trọng đến ngành là Dubbo của Alibaba; **ở một mức độ nào đó, Alibaba đã thúc đẩy sự tiến bộ công nghệ của ngành**.

Chính nhờ Dubbo của Alibaba mà nhiều công ty vừa và nhỏ có thể dựa trên Dubbo để tách hệ thống thành nhiều dịch vụ; mỗi người phụ trách một dịch vụ, mã của mọi người không xung đột, các dịch vụ có thể tự chủ, và mỗi nhóm có thể tự chọn công nghệ sử dụng. Mỗi lần phát hành nếu chỉ thay đổi một dịch vụ thì chỉ cần triển khai riêng dịch vụ đó, không cần mọi người cùng kiểm thử tích hợp; mỗi lần phát hành không còn phải phát hành hàng trăm nghìn, thậm chí hàng triệu dòng mã.

Ngày nay, tôi rất vui khi thấy hệ thống phân tán đã trở thành nội dung phỏng vấn tiêu chuẩn trong ngành. Mọi lập trình viên bình thường đều nên nắm vững kiến thức này; đây là bước tiến của ngành cũng như tiến bộ kỹ thuật của tất cả lập trình viên CNTT. Vì hệ thống phân tán đã thành tiêu chuẩn nên người phỏng vấn đương nhiên sẽ hỏi; hiện nay nhiều công ty dùng kiến trúc phân tán và microservice, nên người phỏng vấn cần đánh giá bạn.

## Phân tích câu hỏi phỏng vấn

### Vì sao cần tách hệ thống?

Hãy tìm trên mạng, câu trả lời thường rất rời rạc, phức tạp và vụn vặt, với rất nhiều lý do. Nhưng ở đây tôi muốn giúp mọi người hình dung trực quan:

Nếu **không tách hệ thống**, một hệ thống lớn có hàng trăm nghìn dòng mã được 20 người cùng bảo trì sẽ thật sự là thảm họa. Mã thường xuyên xung đột trong quá trình chỉnh sửa; phải xử lý đủ loại xung đột và hợp nhất mã, rất tốn thời gian. Tôi thường sửa mã của mình, nhưng vì bạn gọi mã đó nên bạn cũng phải kiểm thử lại, vô cùng phiền phức. Mỗi lần phát hành là phát hành toàn bộ hệ thống gồm hàng trăm nghìn dòng mã; mọi người phải cùng thấp thỏm chờ triển khai. Phát hành hệ thống hàng trăm nghìn dòng mã đòi hỏi nhiều bước kiểm tra và xử lý nhiều vấn đề bất thường; thật phiền phức và mệt mỏi. Hơn nữa, nếu tôi muốn nâng cấp công nghệ lên phiên bản Spring mới nhất thì cũng không được, vì có thể khiến mã của bạn gặp lỗi nên tôi không dám tùy tiện thay đổi công nghệ.

Giả sử một hệ thống có 200 nghìn dòng mã; A sửa 1000 dòng trong đó, nhưng khi phát hành thì toàn bộ hệ thống lớn gồm 200 nghìn dòng mã được phát hành cùng nhau. Điều này có nghĩa là trên môi trường production có thể đồng thời xuất hiện đủ loại thay đổi trong 200 nghìn dòng mã này. 20 người đều phải hồi hộp chờ trước máy tính; sau khi triển khai, họ kiểm tra log để xem phần mình phụ trách có vấn đề gì không.

A chỉ kiểm tra các chức năng ứng với 10 nghìn dòng mã mình phụ trách, thấy ổn thì rời đi. Nhưng không may, trong lúc triển khai A vô tình thay đổi cấu hình của một máy production, khiến một số chức năng ứng với 20 nghìn dòng mã do B và C phụ trách gặp lỗi.

Vài chục người cùng bảo trì một ứng dụng nguyên khối có hàng trăm nghìn dòng mã; mỗi lần phát hành phải chuẩn bị vài tuần, sau đó phát hành -> triển khai -> kiểm tra các chức năng mình phụ trách.

**Sau khi tách**, mọi thứ trở nên gọn gàng: hệ thống hàng trăm nghìn dòng mã được chia thành 20 dịch vụ, mỗi dịch vụ trung bình chỉ có 10–20 nghìn dòng mã và được triển khai trên máy riêng. Có 20 dự án, 20 kho Git và 20 nhà phát triển; mỗi người chỉ cần bảo trì dịch vụ của mình, với mã độc lập và không liên quan đến người khác. Không còn xung đột mã, thật tuyệt. Mỗi lần chỉ cần kiểm thử mã của mình, thật tuyệt. Mỗi lần chỉ cần phát hành dịch vụ nhỏ của mình, thật tuyệt. Muốn nâng cấp công nghệ thế nào cũng được, chỉ cần giữ nguyên interface, thật tuyệt.

Tóm lại, với các dự án vừa và lớn có hàng trăm nghìn dòng mã và vài chục người trong nhóm, nếu không tách hệ thống thì **hiệu suất phát triển sẽ cực kỳ thấp** và phát sinh nhiều vấn đề. Nhưng sau khi tách hệ thống, mỗi người chỉ phụ trách một phần nhỏ và có thể tự do phát triển phần việc đó. Tách hệ thống phân tán có thể cải thiện đáng kể hiệu suất phát triển của các nhóm lớn làm việc với hệ thống phức tạp.

Tuy nhiên, cũng cần **lưu ý** rằng sau khi tách hệ thống thành hệ thống phân tán, hàng loạt vấn đề của hệ thống phân tán sẽ xuất hiện nối tiếp nhau; các câu hỏi phía sau đều **xoay quanh những thách thức kỹ thuật phức tạp do hệ thống phân tán mang lại**.

### Tách hệ thống như thế nào?

Câu hỏi này nếu nói rộng thì có thể rất rộng, còn nói hẹp thì cũng có thể rất hẹp, chẳng hạn như nói đến thiết kế theo hướng miền. Tôi không muốn trình bày quá học thuật vì bạn cũng không thể học thuộc câu trả lời này. Cứ nói trực tiếp, đơn giản hơn để mọi người biết cách trả lời khi cần.

Để chuyển hệ thống thành hệ thống phân tán gồm nhiều dịch vụ theo kiến trúc microservice, cần tách thành nhiều đợt. Không phải kiến trúc sư có thể tách xong ngay trong một lần, rồi về sau không cần tách nữa.

Đợt thứ nhất: nhóm tiếp tục mở rộng. Ban đầu, một người bảo trì một dịch vụ có 10 nghìn dòng mã; sau đó hệ thống nghiệp vụ ngày càng phức tạp, dịch vụ này tăng lên 100 nghìn dòng mã và có 5 người. Đợt thứ hai: một dịch vụ -> 5 dịch vụ, mỗi dịch vụ có 20 nghìn dòng mã và mỗi người phụ trách một dịch vụ.

Nếu nhiều người cùng bảo trì một dịch vụ, tình huống lý tưởng nhất là trong nhóm vài chục người, mỗi người phụ trách 1 hoặc 2–3 dịch vụ. Khi khối lượng công việc của một dịch vụ tăng lên, mã ngày càng nhiều; một người phụ trách dịch vụ đó có thể bị quá tải khi lượng mã tăng lên 100 nghìn dòng. Người đó tự tách thành 5 dịch vụ và một mình gánh việc của 5 người; sau đó tiếp tục tuyển thêm người. Hai người mới được người đó hướng dẫn, vậy 3 người phụ trách 5 dịch vụ: 2 người mỗi người phụ trách 2 dịch vụ, 1 người phụ trách 1 dịch vụ.

Theo tôi, mã của một dịch vụ không nên quá nhiều: khoảng 10 nghìn dòng là tốt, tối đa cũng chỉ nên 20–30 nghìn.

Phần lớn hệ thống cần được **tách qua nhiều đợt**. Lần tách đầu tiên có thể chỉ tách các mô-đun trước đây thành các hệ thống riêng, chẳng hạn tách hệ thống thương mại điện tử thành hệ thống đơn hàng, sản phẩm, thu mua, kho và người dùng, v.v.

Về sau, mỗi hệ thống có thể lại trở nên ngày càng phức tạp. Chẳng hạn, hệ thống thu mua lại chia thành hệ thống quản lý nhà cung cấp và hệ thống quản lý đơn thu mua; hệ thống đơn hàng lại chia thành hệ thống giỏ hàng, hệ thống giá và hệ thống quản lý đơn hàng.

Nếu đào sâu thì chủ đề này thực sự rất sâu; ở đây trước hết tôi đưa ra một ví dụ để các bạn tự cảm nhận. **Ý chính là tùy tình hình mà tách trước một đợt; nếu sau đó hệ thống phức tạp hơn thì có thể tiếp tục chia nhỏ**. Hãy cân nhắc dựa trên ví dụ về hệ thống bạn phụ trách.

### Sau khi tách có thể không dùng Dubbo không?

Dĩ nhiên là được. Cùng lắm thì các hệ thống giao tiếp trực tiếp với nhau qua interface HTTP thuần túy dựa trên Spring MVC; còn có thể làm gì khác? Tuy nhiên, chắc chắn cách này có vấn đề vì việc duy trì giao tiếp qua interface HTTP có chi phí rất cao. Bạn phải cân nhắc **retry khi timeout**, **cân bằng tải** và đủ loại vấn đề khác. Chẳng hạn, hệ thống đơn hàng gọi hệ thống sản phẩm đang triển khai trên 5 máy thì làm thế nào để phân phối đều yêu cầu đến 5 máy đó? Đó chẳng phải là cân bằng tải sao? Có thể tự làm tất cả, nhưng thực sự rất vất vả.

Nói đơn giản, Dubbo là một framework RPC: ở phía local bạn chỉ cần gọi interface, còn Dubbo proxy lời gọi này và thực hiện giao tiếp mạng với máy từ xa; nó xử lý cân bằng tải, tự động nhận biết instance dịch vụ được đưa lên hoặc gỡ xuống, retry khi timeout và nhiều vấn đề khác. Như vậy bạn không cần tự xử lý; chỉ cần dùng Dubbo.
