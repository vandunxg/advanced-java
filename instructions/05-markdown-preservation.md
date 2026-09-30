# Quy tắc bảo toàn Markdown

## 1. Heading và paragraph

Dịch text heading, giữ nguyên cấp heading, thứ tự và ranh giới paragraph. Không merge/split đoạn trừ khi source thể hiện ranh giới semantic và định dạng bị lỗi rõ ràng; mọi chuẩn hóa phải không đổi meaning.

## 2. Inline code và code block

Giữ nguyên nội dung bên trong backtick và fenced code. Bao gồm Java, shell, SQL, JSON, YAML, XML, properties, config, log, stack trace, lệnh terminal, identifier và comment trong code.

Không đổi ngôn ngữ fence, format, indent, quote, escaping hoặc line order. Giữ cấu trúc fence. Nếu phát hiện lỗi source, ghi QA thay vì sửa.

## 3. Comment và prose cạnh code

Comment nằm trong code listing giữ nguyên. Caption, mô tả hoặc đoạn prose trước/sau listing được dịch. Dựa vào vùng Markdown rõ ràng, không suy đoán.

## 4. Table, list và emphasis

Giữ số cột/hàng, thứ tự, cell association và list semantics/nesting. Dịch prose trong cell và list item nhưng giữ inline code, identifier, số liệu và link.

Bảo toàn bold, italic, blockquote, horizontal rule và nội dung HTML/VuePress component. Không chuyển bảng/list thành prose để tiện dịch.

## 5. Link, ảnh, anchor

- Giữ nguyên URL external và destination.
- Dịch link label nếu là prose; giữ nguyên tên file, API, product và official title khi cần nhận diện.
- Giữ nguyên target ảnh, alt syntax, HTML attribute và thứ tự.
- Không tự đổi đường dẫn, anchor, filename hay slug. Mọi cập nhật link cho cấu trúc song ngữ phải kiểm tra target tồn tại và thuộc scope task.

## 6. Mermaid và diagram

Giữ nguyên graph syntax, node ID, edge, direction, sequence và các giá trị config. Chỉ dịch label hiển thị khi không phá cú pháp; nếu không chắc, giữ diagram nguyên văn và ghi QA.

## 7. Ký hiệu và token

Bảo toàn dấu câu có ý nghĩa, toán tử, ký hiệu, version, số, đơn vị, URL, generic delimiter và ký tự đặc biệt, gồm `< > <= >= == != -> :: & | && || @ #`.

Không dịch text trong inline code, HTML attribute, comment code, frontmatter key hoặc key cấu hình.
