# Merge và bàn giao

## 1. Điều kiện bàn giao

Chỉ báo hoàn tất khi mọi file trong scope có bản dịch tương ứng, QA đã đối chiếu source, cấu trúc đầu ra khớp tài liệu tham chiếu và không còn issue chưa được ghi nhận.

## 2. Structural parity

Bản dịch phải theo đúng file/path và cấu trúc của English counterpart nếu có; nếu không có, theo tài liệu gốc. Giữ nguyên thứ tự, hierarchy, ranh giới, cách trình bày và vị trí các thành phần. Không ghi đè source hoặc đổi layout sang một template Markdown chung. Nếu English counterpart khác source, bảo toàn nội dung source và ghi khác biệt.

Không đưa QA/progress notes vào tài liệu dịch trừ khi chúng thực sự thuộc source.

## 3. Kiểm tra cuối

Kiểm tra:
- source/English/target mapping;
- nội dung không thiếu, lặp hoặc tự thêm;
- structural parity theo tài liệu tham chiếu;
- code, link, route, anchor, diagram/component và metadata không bị hỏng/thay đổi ngoài scope;
- diff chỉ gồm file được giao.

## 4. Báo cáo

Nêu file đã dịch/QA, nguồn đối chiếu, trạng thái, kiểm tra đã làm và issue còn lại. Không khẳng định đã chạy build/test nếu chưa thực hiện.
