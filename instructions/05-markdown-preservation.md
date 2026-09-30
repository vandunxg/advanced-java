# Quy tắc bảo toàn cấu trúc tài liệu

## Nguyên tắc ưu tiên

Không áp dụng bộ quy tắc Markdown chung để định dạng lại nội dung. Bản dịch phải tái tạo cấu trúc của tài liệu tiếng Anh tương ứng và source gốc, hoặc của source gốc nếu không có bản tiếng Anh. Markup/format thực tế trong source quyết định cách biểu diễn.

Dịch text nhìn thấy cho người đọc tại vị trí tương ứng; giữ nguyên thứ tự, ranh giới, cấp bậc, nhóm nội dung, liên kết, code và mọi thành phần cấu trúc. Không thêm, bỏ, di chuyển, gộp, tách, chuẩn hóa hoặc chuyển đổi định dạng chỉ để “đúng Markdown” hay đẹp hơn.

## Những gì phải đối chiếu

Giữ đúng như source/cặp tài liệu tham chiếu:
- tên file, thư mục, thứ tự file và quan hệ link;
- heading, hierarchy, numbering, paragraph boundaries;
- code, inline tokens, examples, table, list, quote và emphasis;
- image, alt/caption, diagram, component, HTML, frontmatter/metadata;
- anchor, URL, route, attribute, directive và custom syntax;
- khoảng trắng, line breaks hoặc delimiter khi chúng ảnh hưởng hiển thị/cấu trúc.

Không giả định tài liệu phải dùng một dạng Markdown cụ thể. Nếu source dùng HTML/component hoặc một cách biểu diễn riêng, giữ chính cách đó; không đổi thành Markdown table/list/code fence hoặc ngược lại.

## Code và kỹ thuật

Giữ nguyên code block, inline code, command, query, config, log, stack trace, identifier, comment trong code, syntax fence và indentation. Không sửa lỗi, đổi language tag, format lại hoặc làm ví dụ compile được.

Chỉ dịch prose/caption/label được trình bày như text người đọc. Với diagram/component, dịch text hiển thị chỉ khi không làm thay đổi syntax, ID, tham chiếu hay hành vi.

## Nếu format source bị lỗi

Không âm thầm sửa cấu trúc lỗi hoặc bù syntax bị thiếu. Dịch phần có thể xác định, báo lỗi source trong QA. Chỉ sửa định dạng khi task yêu cầu sửa source hoặc khi có quyết định rõ ràng về structural mapping.
