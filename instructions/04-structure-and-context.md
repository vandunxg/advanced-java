# Quy tắc cấu trúc và ngữ cảnh

Repo advanced-java có các tài liệu Markdown độc lập, liên kết chéo và một số chủ đề nối tiếp nhau. Quy tắc này thay cho cách chia source thành các PDF part.

## 1. File và section boundary

File là đơn vị ownership mặc định. Heading thuộc file chứa heading đó. Không chuyển paragraph, heading, bảng, list hoặc code từ file khác sang file hiện tại để làm nội dung “đầy đủ”.

Nếu task chỉ giao một section, giữ rõ điểm bắt đầu/kết thúc và không ghi lại phần còn lại của file. Ưu tiên tạo patch phạm vi hẹp trong file đích đã chỉ định.

## 2. Ngữ cảnh giữa các trang

Nếu đoạn đầu/cuối tham chiếu khái niệm ở file khác:
- đọc trang được liên kết khi cần;
- giữ thuật ngữ và cách gọi nhất quán;
- không lặp lại định nghĩa hoặc đoạn văn của trang kia;
- không tự sửa nguồn để đồng bộ nội dung.

Các câu hỏi/phần giải thích có thể lặp giữa tài liệu khác nhau. Giữ mọi lặp lại có trong từng source.

## 3. Continuation và liên kết

Không nối văn bản giữa hai file thành một paragraph duy nhất. Giữ nội dung trong đúng file, và bảo toàn ranh giới section/file. Bản dịch tương ứng nên có đường dẫn song song.

Giữ nguyên slug của file và heading khi chúng là API của site/link. Nếu dịch anchor làm route đổi, không sửa liên kết hiện hữu ngoài phạm vi; dùng cách bảo toàn anchor theo cấu hình site hoặc ghi issue để xử lý đồng bộ.

## 4. Source thiếu hoặc hỏng

Nếu link source trỏ tới file không tồn tại, nội dung bị cắt, code fence chưa đóng hoặc paragraph dang dở:
- xác minh file/source lân cận nếu được phép;
- chỉ dịch nội dung có sẵn;
- ghi issue cùng path và đoạn liên quan;
- không bịa phần bị thiếu và không sửa bản source.
