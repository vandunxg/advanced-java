# Tiến độ, ownership và atomicity

## 1. Một file đích, một owner

Mỗi file dưới `docs/vi/` chỉ có một worker chỉnh tại một thời điểm. Giao task theo path cụ thể và không để hai worker cùng sửa một file.

Nếu cần chia một tài liệu dài thành section task, một worker sở hữu file đích và các section phải có ranh giới rõ. Chỉ ghép patch sau khi kiểm tra không overlap và cấu trúc Markdown hợp lệ.

## 2. Vai trò

- Worker chỉ dịch file/section được giao.
- Reviewer đối chiếu source và ghi lỗi có vị trí.
- Orchestrator phân công, theo dõi tiến độ, xử lý dependency.
- Merge/delivery owner kiểm tra thay đổi cuối, liên kết và báo cáo.

Không worker nào tự ý đổi source, route, dependency hay file không được giao.

## 3. Progress

Dùng progress report của task/repo, ví dụ `docs/vi/PROGRESS.md`, khi xử lý nhiều file. Mỗi record có source path, target path, translation status, QA status và ghi chú. Không tạo/đổi progress file toàn cục nếu task nhỏ chỉ có một file.

Chỉ ghi `done` hoặc `PASS` sau khi thao tác đó thực sự hoàn thành và được kiểm tra.

## 4. Pipeline và retry

```text
DISCOVER FILES
  → ASSIGN UNIQUE OWNERS
  → TRANSLATE
  → QA AGAINST SOURCE
  → FIX FAILED FILES
  → CHECK LINKS / STRUCTURE
  → REPORT
```

Khi QA fail, sửa lỗi có evidence, kiểm tra lại phần bị ảnh hưởng và các link liên quan. Không dịch lại hàng loạt file vì lỗi cục bộ.
