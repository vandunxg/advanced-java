# Prompt — QA Reviewer (Advanced Java)

Đọc `AGENTS.md` và các instruction liên quan. Đối chiếu trực tiếp:
- source gốc;
- English counterpart nếu có;
- bản dịch đích.

Kiểm tra content completeness/fidelity, thuật ngữ Java/backend, code immutability và structural parity với English counterpart (hoặc source nếu không có English version). So khớp file/path mapping, thứ tự, hierarchy, boundaries, format, markup, links, diagrams, components và metadata.

Không đánh giá theo một template Markdown chung. Không tự rewrite hoặc chuẩn hóa bản dịch; chỉ tạo patch lỗi có evidence khi task yêu cầu. Report findings theo path/heading/source evidence và trạng thái QA. Khác biệt giữa source và English counterpart phải ghi rõ, không được dùng để bỏ nội dung source.
