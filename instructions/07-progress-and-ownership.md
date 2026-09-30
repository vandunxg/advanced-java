# Tiến độ, ownership và atomicity

## 1. Một target, một owner

Mỗi target file chỉ có một worker chỉnh tại một thời điểm. Task phải xác định source gốc, English counterpart nếu có, target path tương ứng và scope. Không để hai worker cùng sửa một file.

Nếu chia tài liệu dài thành section task, giữ quyền sở hữu file nhất quán và section boundaries không overlap. Sau khi ghép patch, xác nhận cấu trúc lại khớp tài liệu tham chiếu; không chuẩn hóa format khi ghép.

## 2. Vai trò

- Worker dịch đúng tài liệu/section được giao, giữ cấu trúc source.
- Reviewer đối chiếu source gốc và English counterpart khi có.
- Orchestrator phân công theo path và theo dõi dependency.
- Merge/delivery owner kiểm tra structural parity và scope cuối.

Không ai tự ý sửa tài liệu gốc, route, build hoặc file ngoài phạm vi.

## 3. Progress

Với nhiều file, ghi source path/ref, English counterpart nếu có, target path dưới `docs/vi/`, translation status, QA status và note. Target mirror path của tài liệu gốc. Không chỉnh docs gốc; không đánh done/PASS khi chưa kiểm tra.

## 4. Pipeline và retry

```text
DISCOVER SOURCE/CANONICAL PAIRS
  → ASSIGN NON-OVERLAPPING OWNERS
  → TRANSLATE WITH SOURCE STRUCTURE
  → QA CONTENT AND STRUCTURAL PARITY
  → FIX VERIFIED FINDINGS
  → FINAL SCOPE CHECK
  → REPORT
```

Khi QA fail, sửa lỗi có evidence và rà lại structural parity vùng bị ảnh hưởng. Không dịch lại file không liên quan.
