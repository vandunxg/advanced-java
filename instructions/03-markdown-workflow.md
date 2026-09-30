# Workflow dịch file Markdown

## 1. Nhận task

Mỗi task cần khai báo:
- file nguồn chính xác (path và branch/commit nếu có);
- file đích tương ứng dưới `docs/vi/`;
- các file liên quan được phép đọc để tham khảo;
- giới hạn scope nếu chỉ dịch một section.

Không dịch file khác chỉ vì chúng được liên kết từ nguồn.

## 2. Đọc và lập ranh giới

Đọc trọn file nguồn trước khi dịch. Ghi nhận:
- hierarchy heading và thứ tự section;
- code fence, inline code, tables, lists, links, images;
- nội dung tiếp diễn từ/đến file khác;
- tên Java/API, version, con số và thuật ngữ trọng yếu.

Dùng file kế cận chỉ để hiểu context và liên kết; không đưa nội dung không thuộc file nguồn vào bản dịch.

## 3. Tạo bản dịch

Tạo file tại `docs/vi/<same-relative-path>.md`, giữ tên file gốc. Dịch theo từng đoạn và giữ cấu trúc. Không thêm tiêu đề “Bản dịch” trừ khi cấu trúc của dự án yêu cầu.

Giữ link external nguyên URL. Với relative links và anchors, chỉ chỉnh path khi cần trỏ đúng bản tiếng Việt và target đã tồn tại; ghi mapping trong QA. Không để link trỏ nhầm nguồn dịch hoặc đường dẫn hỏng.

## 4. Kiểm tra trước khi bàn giao

Đối chiếu từ đầu đến cuối với source: đủ nội dung, code không đổi, cấu trúc Markdown giữ đúng, link/path hợp lệ, thuật ngữ nhất quán. Ghi QA report cho file.

Nếu có lỗi source, phần không đọc được, link mơ hồ hoặc nội dung cần tác giả xác nhận, đánh dấu rõ; không tự lấp khoảng trống.

## 5. File không phải prose thông thường

Với README, index, sidebar, frontmatter, HTML/VuePress component, Mermaid hoặc metadata:
- giữ nguyên cấu trúc và key/slug được tooling sử dụng;
- chỉ dịch text hiển thị cho người đọc;
- không sửa cấu hình hoặc cú pháp;
- không dịch file máy sinh hoặc binary;
- nếu dịch có thể làm đổi route/anchor/build, ghi rõ và yêu cầu task bao gồm cập nhật điều hướng trước khi thay đổi.
