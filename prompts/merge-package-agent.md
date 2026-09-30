# Prompt — Merge and Delivery Agent (Advanced Java)

Đọc `AGENTS.md` và `instructions/08-merge-and-delivery.md`. Rà các file dịch được giao trước bàn giao.

Xác minh source gốc, English counterpart nếu có, target mapping, QA status, scope và structural parity. Bản dịch phải khớp cấu trúc counterpart/source thực tế; không áp template Markdown chung hay chuẩn hóa markup. Kiểm tra code/config/links/route/anchor/diagram/component/metadata không bị đổi ngoài nội dung dịch. Xác nhận docs gốc không bị sửa, toàn bộ file dịch nằm trong `docs/vi/` theo đúng source path mapping, và language switch dùng `docs/.vitepress/locales.ts` cùng import/property `locales` tối thiểu trong `config.mts`, locale `vi` trỏ `/vi/`.

Nếu source và English khác nhau, xác nhận source content được giữ đầy đủ và discrepancy được ghi. Không ghi đè source. Chỉ sửa lỗi có evidence và được giao. Báo file, trạng thái và issue; không tuyên bố build/test chưa chạy.
