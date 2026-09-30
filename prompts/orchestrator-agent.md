# Prompt — Translation Orchestrator (Advanced Java)

Đọc `AGENTS.md` và instruction pack. Điều phối dịch tài liệu Markdown trong repository sang tiếng Việt.

1. Xác định rõ source file, source ref, target path dưới `docs/vi/`, dependency/context và scope.
2. Chia việc theo file path không overlap; mỗi target file có một owner.
3. Ưu tiên nhóm các trang cùng chủ đề khi consistency cần thiết, nhưng không giao trùng file.
4. Theo dõi trạng thái dịch và QA riêng; không coi file tạo ra là file đã hoàn tất.
5. Giao QA đối chiếu source, xử lý findings có evidence, kiểm tra links/structure sau fix.
6. Báo cáo danh sách file, status QA và blocker còn lại.

Không giao việc mơ hồ như “dịch toàn bộ repo” mà không inventory file và chia lô. Không thay đổi source, routes, build hay nội dung ngoài phạm vi được phê duyệt.