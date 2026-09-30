# Quy tắc cấu trúc và ngữ cảnh

## 1. Cấu trúc là của từng tài liệu nguồn

Mỗi tài liệu có tổ chức riêng. Tài liệu tiếng Anh tương ứng (nếu có) và tài liệu gốc là căn cứ để giữ cấu trúc bản dịch. Không dùng một cấu trúc Markdown mẫu/định sẵn thay cho cấu trúc quan sát được trong các tài liệu đó.

Giữ chính xác thứ tự và hierarchy nội dung, vị trí, ranh giới, nhóm mục, cách trình bày, code/example, table/list, diagram, component, metadata và các chi tiết cấu trúc khác có trong nguồn. Không tự chuẩn hóa theo sở thích hay lược bỏ chi tiết tưởng như chỉ để trang trí.

## 2. Khi English counterpart và source gốc khác nhau

Source gốc quyết định nội dung cần dịch và không được mất. English counterpart là đối chiếu cho cấu trúc/thuật ngữ khi tồn tại. Nếu khác nhau về heading, section, thứ tự, ví dụ hoặc thành phần:
- giữ đầy đủ phần source gốc trong bản dịch;
- không thêm phần chỉ có ở English counterpart trừ khi task chỉ định dịch hợp nhất;
- ghi chênh lệch với vị trí cụ thể trong QA;
- không tự chọn một bên để làm source of truth cho nội dung.

## 3. File và section boundary

Giữ mỗi nội dung trong file/section tương ứng. Không chuyển paragraph, heading, bảng, list hay code từ file khác vào để làm tài liệu trông đầy đủ. Nếu task chỉ giao một section, giữ đúng điểm bắt đầu/kết thúc và cấu trúc tại chỗ.

## 4. Context giữa các trang

Có thể đọc tài liệu liên kết để hiểu thuật ngữ/cross-reference. Không lặp định nghĩa hoặc nội dung từ trang khác nếu không có trong source. Giữ mọi phần lặp lại thực sự có trong tài liệu nguồn.

## 5. Tên file, links và anchors

Giữ file/path mapping theo cây `docs/vi/`, mirror tài liệu gốc: `docs/<path>` → `docs/vi/<path>`. Trang chủ gốc `docs/index.md` có bản dịch ở `docs/vi/index.md`. Giữ slug, heading anchor, route và link theo tài liệu tham chiếu. Không đổi path/anchor tùy ý.

## 6. Source thiếu/hỏng

Nếu source bị cắt, link hỏng, syntax lỗi hoặc thiếu phần:
- xác minh tài liệu liên quan nếu được phép;
- chỉ dịch phần có thật;
- ghi issue cùng path/heading;
- không tự bịa phần thiếu hoặc sửa source.
