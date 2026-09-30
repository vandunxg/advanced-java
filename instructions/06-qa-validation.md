# Quy tắc QA và validation

QA phải đối chiếu trực tiếp tài liệu gốc và bản dịch; khi có English counterpart, dùng thêm để xác nhận cấu trúc đầu ra.

## 1. Content completeness

Kiểm tra mọi nội dung trong source có counterpart trong bản dịch; không thiếu/duplicate và không có prose tự thêm. Source gốc là căn cứ đầy đủ nội dung. Nếu source và English counterpart khác nhau, ghi rõ khác biệt.

## 2. Structural parity

So sánh bản dịch với English counterpart nếu có, nếu không thì với source gốc:
- cùng file/path mapping và thứ tự nội dung;
- cùng heading hierarchy, ranh giới đoạn, section, thứ tự ví dụ;
- cùng cấu trúc và vị trí table, list, code, image, diagram, component, metadata;
- cùng link/anchor/route mapping và cách trình bày;
- không có định dạng áp đặt từ template/quy ước ngoài source.

Không chỉ kiểm tra syntax Markdown theo một chuẩn riêng; xác nhận bản dịch tái tạo cấu trúc của tài liệu tham chiếu.

## 3. Technical fidelity

Kiểm tra tên class/API/method/package/annotation, version, số liệu, đơn vị, logic, phủ định, điều kiện, exception, recommendation và thuật ngữ Java/backend. Đảm bảo code, command, query, config, log và identifier không đổi.

## 4. Trạng thái QA

Dùng một trạng thái:
- `PASS`
- `PASS_WITH_NOTES`
- `NEEDS_FIX`
- `BLOCKED_SOURCE_UNCLEAR`

Ghi QA report tại vị trí task/repo chỉ định. Mẫu dưới đây chỉ để ghi kết quả review, không phải format áp đặt cho tài liệu được dịch:

```text
Source: <original path and ref>
English counterpart: <path or n/a>
Translation: <target path>
Status: <status>
Findings: <specific locations, or none>
```

Không PASS nếu còn thiếu nội dung, cấu trúc không khớp, meaning/term sai hoặc issue chưa được nêu.
