# Workflow dịch docs

## 1. Nhận task

Task cần chỉ rõ:
- tài liệu gốc và source ref;
- English counterpart nếu có;
- target path/file tương ứng;
- context file được phép đọc;
- giới hạn scope nếu chỉ dịch một phần.

## 2. Đọc và đối chiếu cấu trúc

Đọc toàn bộ tài liệu gốc. Khi có English counterpart, đọc bản đó để đối chiếu cấu trúc, cách trình bày và thuật ngữ. Ghi nhận đường dẫn, thứ tự nội dung, hierarchy, các thành phần hiển thị, metadata, link và code. Source khác biệt thì đánh dấu cho QA; không tự lược bỏ.

## 3. Tạo bản dịch

Tạo bản dịch trong `docs/vi/`, mirror đúng đường dẫn và tên file của tài liệu gốc dưới `docs/` (hoặc English counterpart nếu nó có mapping riêng trong repo). Ví dụ `docs/high-concurrency/x.md` thành `docs/vi/high-concurrency/x.md`; `docs/index.md` thành `docs/vi/index.md`. Không thay đổi file gốc.

Dịch text hiển thị tại chỗ, giữ nguyên thứ tự, ranh giới và markup thực tế. Không thêm section/header mới hoặc đổi format chỉ theo một chuẩn Markdown chung. Không ghi đè source.

## 4. Links và components

Giữ URL, destination, route, anchor, component, attribute và syntax đúng theo tài liệu tham chiếu. Chỉ cập nhật link nếu task yêu cầu hoặc cần thiết để ánh xạ bản dịch và target đã tồn tại; kiểm tra mọi target đã thay đổi. Không tự ý chỉnh nav/site config.

## 5. QA

Đối chiếu source gốc từng phần với bản dịch; đối chiếu English counterpart để xác nhận structural parity khi có. Ghi các chênh lệch, file đích, lỗi source và link issue trong QA report. Chỉ dịch file được giao; không kéo nội dung liên kết vào.
