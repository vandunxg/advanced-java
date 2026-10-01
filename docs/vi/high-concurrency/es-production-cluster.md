# Kiến trúc cụm ES production

## Câu hỏi phỏng vấn

Kiến trúc triển khai cụm ES production như thế nào? Lượng dữ liệu của mỗi index khoảng bao nhiêu? Mỗi index có khoảng bao nhiêu shard?

## Phân tích suy nghĩ của người phỏng vấn

Câu hỏi này, cũng như các câu hỏi phía sau về Redis, v.v., luôn được hỏi trong phỏng vấn khi nhắc đến những kỹ thuật như ES, Redis, sharding database/table trong MySQL. Họ muốn biết bạn triển khai thế nào trong môi trường production. Nói thẳng ra, câu hỏi này không đòi hỏi nhiều kỹ thuật; họ chỉ muốn xem bạn đã từng làm việc đó trong môi trường production thực sự chưa!

Một số bạn có thể chưa từng làm trong môi trường production, chưa từng triển khai cụm ES trên các máy production thực tế, chưa từng thực sự vận hành nó hoặc nạp hàng chục triệu, thậm chí hàng trăm triệu bản ghi vào cụm ES; có thể bạn chưa hiểu rõ một số chi tiết trong dự án production.

Nếu bạn chỉ tự làm demo mà chưa tiếp xúc cụm ES thực tế thì có thể lúc này bạn sẽ bối rối. Đừng bối rối; hãy bình tĩnh trả lời câu hỏi này để thể hiện rằng bạn thực sự đã làm việc đó.

## Phân tích câu hỏi phỏng vấn

Thực ra câu hỏi này không phức tạp. Nếu bạn thực sự từng làm với ES thì chắc chắn biết tình hình thực tế của cụm ES production bên mình: đã triển khai bao nhiêu máy, có bao nhiêu index, lượng dữ liệu của mỗi index là bao nhiêu, mỗi index được cấp bao nhiêu shard. Bạn chắc chắn sẽ biết!

Nhưng nếu chưa từng làm cũng đừng lo; tôi sẽ đưa ra một ví dụ cơ bản để đến lúc đó bạn chỉ cần trả lời đơn giản như vậy.

-   Cụm ES production được triển khai trên 5 máy; mỗi máy có 6 core và 64G, tổng bộ nhớ của cluster là 320G.
-   Lượng dữ liệu tăng mỗi ngày trong cụm ES của chúng tôi vào khoảng 20 triệu bản ghi; lượng tăng mỗi ngày khoảng 500MB, mỗi tháng tăng khoảng 600 triệu bản ghi và 15G dữ liệu. Hệ thống đã chạy vài tháng; hiện tổng lượng dữ liệu trong cụm ES khoảng 100G.
-   Hiện trên production có 5 index (hãy dựa theo nghiệp vụ của mình để xem loại dữ liệu nào có thể đưa vào ES); lượng dữ liệu mỗi index khoảng 20G. Với lượng dữ liệu này, chúng tôi cấp 8 shard cho mỗi index, nhiều hơn 3 shard so với mặc định là 5 shard.

Nói đại khái như vậy là được.
