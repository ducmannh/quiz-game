# 🎯 FUN QUIZ AI (QUIZ.COM AESTHETIC) - BẢNG THEO DÕI TIẾN ĐỘ & CHECKLIST TÍNH NĂNG

> **Mô tả dự án:** Ứng dụng web trắc nghiệm kiến thức thông minh mang phong cách thẩm mỹ Quiz.com (Warm Cream, Neo-Brutalist 3D tactile buttons, Petrol feature banners, Multi-colored Logo), tích hợp AI tự động tạo bộ câu hỏi không giới hạn theo chủ đề, độ khó, và phân tích kết quả người chơi.
> **Công nghệ:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Prisma ORM, PostgreSQL (`100.86.236.104:5432`), AI API (Google Gemini).
> **Cổng dịch vụ (Port):** `3003` (được cấu hình trong `package.json` và `.env`).
> **Hệ thống Font chữ:** Plus Jakarta Sans (Sans-serif hiện đại), Space Grotesk (Tiêu đề cá tính), JetBrains Mono (Mã số & Điểm).

---

## 📊 BẢNG TỔNG QUAN TIẾN ĐỘ (PROGRESS OVERVIEW)

| Giai đoạn (Phase) | Mục tiêu chính | Trạng thái | Tiến độ |
| :--- | :--- | :---: | :---: |
| **Phase 1: Foundation & DB** | Cài đặt Prisma 7, PostgreSQL, Database Schema | 🟢 Hoàn thành | 100% |
| **Phase 2: AI Question Generator** | Engine sinh câu hỏi bằng AI với Structured Output | 🟢 Hoàn thành | 100% |
| **Phase 3: Quiz.com Arena** | Đăng nhập hồ sơ, Sảnh sới PIN, Màn thi đấu tương tác trắc nghiệm tốc độ | 🟢 Hoàn thành | 100% |
| **Phase 4: Results & Analytics** | Bảng tổng kết, thuật toán tính điểm & xem lại đáp án chi tiết | 🟢 Hoàn thành | 100% |
| **Phase 5: Gamification & Social** | Leaderboard Quiz.com, Hệ thống Huy hiệu & Bục vinh danh | 🟢 Hoàn thành | 100% |
| **Phase 6: Polish & QA** | Mobile responsive, âm thanh, rate limit, dọn dữ liệu mẫu, chuẩn hóa cổng 3003 | 🟢 Hoàn thành | 100% |
| **Phase 7: Redesign Quiz.com** | Chuyển đổi toàn bộ UI sang tông màu Quiz.com, nút bấm 3D tactile, loại bỏ 10 bục | 🟢 Hoàn thành | 100% |
| **Phase 8: 3D Virtual Exam Hall** | Mô hình 3D trường thi kiểu Chùa Sen: Màn hình lớn Jumbotron + Bàn thi + Di chuyển người 3D | 🟢 Hoàn thành | 100% |

---

## 🛠️ CHI TIẾT TỪNG GIAI ĐOẠN & CHECKLIST KIỂM TRA

### 🟢 Phase 1: Nền tảng & Cơ sở dữ liệu (Foundation & Database)
- [x] Khởi tạo dự án Next.js 16 + TypeScript + Tailwind CSS v4.
- [x] Cài đặt `prisma` CLI và `@prisma/client` chuẩn phiên bản **Prisma 7** (`7.10.1`).
- [x] Cấu hình biến môi trường kết nối PostgreSQL `DATABASE_URL` trong file `.env` (IP: `100.86.236.104:5432`).
- [x] Cấu hình file `prisma.config.ts` kết hợp driver adapter `@prisma/adapter-pg` và `pg`.
- [x] Khởi tạo singleton Prisma Client trong [`lib/prisma.ts`](file:///c:/TTCNTT/Games/fun-quiz/lib/prisma.ts).
- [x] Thiết kế Database Schema trong [`prisma/schema.prisma`](file:///c:/TTCNTT/Games/fun-quiz/prisma/schema.prisma): `User`, `Category`, `Quiz`, `Question`, `Option`, `QuizAttempt`, `AttemptAnswer`, `Room`, `RoomParticipant`.
- [x] Đồng bộ schema lên database PostgreSQL (`npx prisma db push`).
- [x] Đã xóa toàn bộ dữ liệu mẫu (mock/seed data) thông qua script [`prisma/clear-data.ts`](file:///c:/TTCNTT/Games/fun-quiz/prisma/clear-data.ts) để sẵn sàng cho dữ liệu thực tế.

---

### 🧠 Phase 2: Engine Sinh Câu Hỏi Bằng AI (AI Generator Engine)
- [x] Tích hợp Google Gemini API qua Google AI Studio (`GEMINI_API_KEY`).
- [x] Xây dựng Service AI tại [`lib/ai/generate-quiz.ts`](file:///c:/TTCNTT/Games/fun-quiz/lib/ai/generate-quiz.ts):
  - [x] Sử dụng Zod Schema (`GeneratedQuizSchema`) ép kiểu JSON đầu ra của AI chuẩn 100%.
  - [x] Thiết lập Prompt chuẩn gồm: Chủ đề, số lượng câu, độ khó (Dễ/Vừa/Khó), ngôn ngữ Tiếng Việt.
  - [x] Tự động sinh: Câu hỏi + 4 lựa chọn (1 đúng, 3 sai) + Lời giải thích chi tiết.
  - [x] Tích hợp cơ chế Mock Generator dự phòng khi chưa nhập API Key hoặc khi gặp sự cố mạng.
- [x] Xây dựng Server Action tại [`app/actions/quiz.ts`](file:///c:/TTCNTT/Games/fun-quiz/app/actions/quiz.ts) kết nối trực tiếp với PostgreSQL qua Prisma 7.
- [x] Giao diện tạo đề thi chuẩn phong cách Quiz.com tại [`app/quiz/create/page.tsx`](file:///c:/TTCNTT/Games/fun-quiz/app/quiz/create/page.tsx) với nút bấm 3D tactile, thanh nhập chủ đề và tài liệu ôn tập.

---

### 🎪 Phase 3 & 7: Giao Diện Thẩm Mỹ Quiz.com & Màn Đấu Trí Tương Tác
- [x] **Hệ Thống Nhận Diện Quiz.com**:
  - [x] Logo đa sắc cá tính: `Quiz.com AI` ([`components/QuizLogo.tsx`](file:///c:/TTCNTT/Games/fun-quiz/components/QuizLogo.tsx)).
  - [x] Màu nền ấm đặc trưng `#FFFDF4` (Warm Cream).
  - [x] Nút bấm 3D tactile viền đen đậm dày `border-2 border-black` / `border-3 border-black`, đổ bóng cứng `shadow-[4px_4px_0px_#000]` và hiệu ứng thụt xuống khi bấm (`active:translate-y-1 active:shadow-[1px_1px_0px_#000]`).
  - [x] Biểu ngữ petrol `#0d3b44` tương phản cao nổi bật các tính năng cốt lõi.
- [x] **Trang Chủ (Landing Page - [`app/page.tsx`](file:///c:/TTCNTT/Games/fun-quiz/app/page.tsx))**:
  - [x] Hero section với thanh nhập mã PIN tham gia nhanh.
  - [x] Dải danh mục chủ đề dạng pills (Công nghệ, Khoa học, Lịch sử, Địa lý, Phim ảnh, Thể thao...).
  - [x] 2 Khung giới thiệu lớn phong cách Quiz.com: Trình Soạn Đề Tốc Độ & Sinh Đề AI Không Giới Hạn.
  - [x] 3 Khối giá trị tính năng và Footer chuẩn Quiz.com.
- [x] **Form Đăng Nhập / Hồ Sơ Thí Sinh ([`app/login/page.tsx`](file:///c:/TTCNTT/Games/fun-quiz/app/login/page.tsx))**:
  - [x] Card trắng viền đen dày, đổ bóng khối 3D.
  - [x] Bộ chọn 10 Avatar linh vật với viền xúc giác nổi.
  - [x] Lưu trữ phiên chơi người dùng trong `localStorage` qua [`lib/player.ts`](file:///c:/TTCNTT/Games/fun-quiz/lib/player.ts).
- [x] **Sảnh Phòng Thi Đấu (Lobby - [`app/lobby/page.tsx`](file:///c:/TTCNTT/Games/fun-quiz/app/lobby/page.tsx))**:
  - [x] Banner nhập mã PIN nhanh nổi bật.
  - [x] Danh sách thẻ phòng thi đấu sạch sẽ, trực quan.
  - [x] 1 nút hành động 3D "Vào Chơi Ngay" duy nhất (loại bỏ cơ chế phân chia 10 bục / khán đài theo yêu cầu).
- [x] **Màn Thi Đấu Trắc Nghiệm Tốc Độ ([`app/room/[code]/page.tsx`](file:///c:/TTCNTT/Games/fun-quiz/app/room/[code]/page.tsx))**:
  - [x] Loại bỏ hoàn toàn mô hình 10 bục và màn chiếu Jumbotron cồng kềnh, tập trung trọn vẹn vào trải nghiệm trả lời câu hỏi trực tiếp, nhạy bén và tương thích hoàn hảo trên di động.
  - [x] Top bar: Nút rời phòng, tiến độ câu hỏi (`Câu X / Y`), điểm số trực tiếp, chuỗi thắng (Combo Streak 🔥), nút bật/tắt âm thanh.
  - [x] Đồng hồ đếm ngược nổi bật ở trung tâm, đổi màu khi sắp hết thời gian.
  - [x] Khung câu hỏi thẻ trắng nổi bật với viền 3px, đổ bóng 8px.
  - [x] 4 thẻ đáp án A, B, C, D rực rỡ với các tông màu Quiz.com (San hô `#FF6B4A`, Cyan `#00C2CB`, Hổ phách `#FFB800`, Lục `#00C853`), hỗ trợ bấm chuột và phím tắt (1-4, A-D).

---

### 🏆 Phase 4: Kết Quả, Chấm Điểm & Xem Lại Đáp Án (Results & Analytics)
- [x] **Thuật toán tính điểm nâng cao ([`lib/scoring.ts`](file:///c:/TTCNTT/Games/fun-quiz/lib/scoring.ts))**:
  - [x] Điểm cơ bản: 100 điểm cho mỗi câu trả lời đúng.
  - [x] Điểm thưởng tốc độ (Speed Bonus): Tối đa +50 điểm tính theo thời gian phản xạ còn lại.
  - [x] Hệ số nhân chuỗi đúng liên tiếp (Streak Multiplier): Đúng 2 câu (x1.15), 3 câu (x1.3), 4+ câu (x1.5).
- [x] **Lưu trữ dữ liệu bài thi vào PostgreSQL ([`app/actions/attempt.ts`](file:///c:/TTCNTT/Games/fun-quiz/app/actions/attempt.ts))**.
- [x] **Màn hình tổng kết Quiz.com**:
  - [x] Thẻ cúp vô địch và 4 thông số: Tổng điểm, Độ chính xác, Thời gian TB/câu, Chuỗi đúng cao nhất.
  - [x] Hiệu ứng pháo hoa Confetti chúc mừng.
  - [x] Các nút 3D hành động: Xem lại bài làm, Chia sẻ kết quả, Chơi lại, Về sảnh chờ.
- [x] **Xem lại chi tiết từng câu hỏi & Lời giải ([`components/arena/QuizReviewModal.tsx`](file:///c:/TTCNTT/Games/fun-quiz/components/arena/QuizReviewModal.tsx))**:
  - [x] Thiết kế modal thẻ trắng viền đen dày, bóng đổ 10px chuẩn Quiz.com.
  - [x] Bộ lọc thông minh: Xem tất cả, chỉ câu đúng, chỉ câu sai.
  - [x] Hiển thị rõ câu thí sinh chọn và đáp án chính xác kèm lời giải thích từ AI.

---

### 🔥 Phase 5: Bảng Xếp Hạng & Gamification (Leaderboard & Badges)
- [x] **Bảng xếp hạng phong cách Quiz.com ([`app/leaderboard/page.tsx`](file:///c:/TTCNTT/Games/fun-quiz/app/leaderboard/page.tsx))**:
  - [x] Bục vinh danh Top 3 Quán quân - Á quân - Quý quân (Vàng rực rỡ, Bạc tinh tế, Đồng ấm áp) với viền 3D sắc nét.
  - [x] Bảng danh sách thứ hạng người chơi từ hạng 4 trở đi với thiết kế card nổi bật.
  - [x] Server Action [`app/actions/leaderboard.ts`](file:///c:/TTCNTT/Games/fun-quiz/app/actions/leaderboard.ts) truy vấn dữ liệu từ PostgreSQL.
- [x] **Hệ thống Huy hiệu ([`lib/achievements.ts`](file:///c:/TTCNTT/Games/fun-quiz/lib/achievements.ts))**:
  - [x] Danh sách huy hiệu: *Thần Tốc ⚡*, *Bất Bại 🏆*, *Bậc Thầy Combo 🔥*, *Học Giả AI 🧠*, *Vua Đấu Trường 👑*, *Bậc Thầy Trí Tuệ 💎*.
  - [x] Bộ thẻ huy hiệu mở khóa / chưa đạt trực quan trên tab Leaderboard.

---

### 🎨 Phase 6: Hoàn Thiện & Tối Ưu (Polish & QA)
- [x] **Hiệu ứng âm thanh Web Audio ([`lib/sound.ts`](file:///c:/TTCNTT/Games/fun-quiz/lib/sound.ts))**:
  - [x] Tick đếm ngược, Buzzer chọn đáp án, Ding đúng, Buzz sai, Victory fanfare.
- [x] **Cấu hình cổng khởi chạy `3003`**:
  - [x] Cập nhật file `package.json` với script `"dev": "next dev -p 3003"` và `"start": "next start -p 3003"`.
  - [x] Cập nhật file `.env` với `PORT=3003`.
- [x] **Font chữ hiện đại**:
  - [x] Bộ font Plus Jakarta Sans + Space Grotesk + JetBrains Mono hỗ trợ tiếng Việt hoàn hảo.
- [x] **Bảo mật & Rate Limiting ([`lib/ratelimit.ts`](file:///c:/TTCNTT/Games/fun-quiz/lib/ratelimit.ts))**:
  - [x] Giới hạn tối đa 5 lượt gọi API AI mỗi phút cho mỗi client/IP.
- [x] **Dọn dẹp code không còn sử dụng**:
  - [x] Đã xóa bỏ các file bục trường quay cũ trong `components/arena/` (`JumbotronScreen.tsx`, `PlayerPodium.tsx`, `PodiumGrid.tsx`, `PlayerControls.tsx`, `AudienceSection.tsx`).

---

### 🏛️ Phase 8: Không Gian Trường Thi 3D Tương Tác Kiểu Chùa Sen (Three.js Virtual Exam Hall)
- [x] **Cài đặt & Tích hợp Three.js** (`three`, `@types/three`):
  - [x] Dựng không gian 3D trường thi tương tác hoàn chỉnh tại [`components/arena/ThreeExamHall.tsx`](file:///c:/TTCNTT/Games/fun-quiz/components/arena/ThreeExamHall.tsx).
  - [x] **Toàn màn hình (Full Screen Viewport)**: Canvas phủ toàn bộ màn hình (`100vw x 100vh`), loại bỏ hoàn toàn viền trắng và khung bọc bên ngoài.
- [x] **Đưa Toàn Bộ Thông Tin Lên Màn Hình Đen Lớn 3D & Bấm Trực Tiếp Trên Màn Hình**:
  - [x] Loại bỏ hoàn toàn các thẻ trắng 2D nổi (thanh câu hỏi phía trên và bàn bấm đáp án phía dưới) theo yêu cầu.
  - [x] **Khắc phục triệt để hiện tượng màn hình chập chờn (Anti-Flicker Architecture)**: Tách biệt hoàn toàn vòng lặp WebGL Scene (mount 1 lần duy nhất) và Texture updater; thiết lập `generateMipmaps = false` và đọc state qua refs, giúp màn hình 3D cập nhật đếm ngược mượt mà 60 FPS, không còn bị hủy/tạo lại scene mỗi giây.
  - [x] **Nâng cấp không gian phòng thi sáng sủa & chuyên nghiệp**: Bổ sung `HemisphereLight` trời-đất, hệ thống đèn trần floodlight studio chiếu sáng các dãy bàn thi, sàn gạch phản quang bóng bẩy (`#22384c`), cùng hai trụ đèn kiến trúc neon hai bên sân khấu (`#00E5FF`).
  - [x] Màn hình 3D khổng lồ trên tường sân khấu sử dụng dynamic `CanvasTexture` 1024x512 độ phân giải cao kết hợp ánh đèn chiếu rọi (Cyber Spotlight).
  - [x] Hiển thị trọn vẹn: Tiêu đề bài thi, Tiến độ câu hỏi, Điểm số, Chuỗi combo, Thanh năng lượng thời gian thực, Đồng hồ số đếm ngược, Toàn văn nội dung câu hỏi ngắt dòng tự động.
  - [x] 4 Ô đáp án A - B - C - D hiển thị trực tiếp trên bề mặt màn hình đen với 4 gam màu Quiz.com rực rỡ, đổi trạng thái viền và chữ khi người chơi chọn.
  - [x] **Tương tác bấm chuột trực tiếp trên màn hình 3D**: Sử dụng **Three.js Raycaster UV coordinates** để tính toán chính xác vị trí click vào các ô đáp án và nút "CÂU TIẾP THEO" trên bề mặt màn hình đen; con trỏ chuột tự động đổi thành hình bàn tay (`pointer`) khi rê qua các nút trên màn hình.
  - [x] Lời giải thích chi tiết và nút chuyển câu hỏi được vẽ trực tiếp trên màn hình đen khi kết thúc thời gian câu hỏi.
- [x] **Hàng Bàn Thi 3D & Ghế Thi Đấu (Exam Desks & Chairs)**:
  - [x] 10 Bàn thi đấu thiết kế 3D hiện đại xếp theo hàng (bàn gỗ, chân kim loại, màn hình buzzer, biển số bàn và đèn tín hiệu chuyển màu theo trạng thái làm bài: Xanh khi đúng, Đỏ khi sai, Vàng khi đang chốt).
  - [x] Ghế thi đấu đặt phía sau mỗi bàn thi với điểm ngồi chính xác.
  - [x] Bàn của người chơi hiện tại (Bàn #03) được làm nổi bật với đèn neon xanh rực rỡ và bảng hiệu 3D `★ BÀN CỦA BẠN (Click để ngồi)`.
  - [x] Các bàn còn lại có các thí sinh 3D khác (NPC / người cùng phòng) với bảng tên linh vật floating.
- [x] **Chế Độ Ngồi Vào Bàn Thi Mở Màn Hình Lớn (Desk Seating & Full-Screen Focus Exam Mode)**:
  - [x] **Tự động ngồi vào bàn thi khi vào phòng (`isSeated = true`)**: Nhân vật 3D ngồi đúng tư thế tại ghế Bàn #03, camera tự động lướt mượt mà về góc nhìn cận cảnh hướng thẳng sân khấu.
  - [x] **Giao diện bài thi Full Màn Hình Siêu Rõ Nét**: Hiển thị bảng câu hỏi to bản phong cách Quiz.com Neo-Brutalist trên nền kính mờ (`backdrop-blur`), phông chữ lớn `text-2xl` - `text-3xl` dễ đọc, 4 nút đáp án A/B/C/D to lớn, xúc giác, dễ dàng bấm chọn bằng chuột/ngón tay.
  - [x] **Chuyển đổi linh hoạt giữa Ngồi thi và Đứng dậy đi dạo**:
    - Khi đang ngồi: Bấm nút **"Đứng Dậy Đi Dạo 🚶"** hoặc phím **ESC** hoặc phím **WASD / Mũi tên** để đứng dậy đi lại tự do trong trường thi 3D.
    - Khi đang đứng: Click trực tiếp vào Bàn thi #03 trong không gian 3D, hoặc bấm phím **E**, hoặc bấm nút nổi **"🪑 Ngồi Vào Bàn (Mở Màn Hình Lớn) ↗"** ở góc phải màn hình để ngồi xuống và phóng to màn hình câu hỏi.
- [x] **Mô Hình Người Di Chuyển 3D (Interactive 3D Player Character)**:
  - [x] Nhân vật 3D phong cách hoạt hình với bóng đổ, thân nón, đầu tròn và bảng tên Billboard 3D hiển thị Avatar Emoji + Nickname của người chơi.
  - [x] Cơ chế di chuyển linh hoạt theo 3 cách:
    - **Bàn phím PC:** Phím **W-A-S-D** hoặc các phím **Mũi tên** để đi lại mượt mà với góc xoay tự nhiên và hoạt ảnh nhún chân (bobbing).
    - **Chuột / Pointer:** Click vào bất kỳ vị trí nào trên sàn để nhân vật tự động bước tới điểm đó.
    - **Thiết bị cảm ứng / Mobile:** Cần điều khiển ảo **Virtual Joystick** ở góc trái màn hình để di chuyển nhân vật dễ dàng bằng ngón tay.
  - [x] Chế độ xem Camera kép & Hệ thống xoay góc nhìn 360 độ (3rd-Person Orbit Camera):
    - **Giữ chuột và kéo để xoay tự do 360 độ**: Cho phép người chơi ngắm toàn cảnh trường thi, các thí sinh khác, bục sân khấu và trần đèn studio từ mọi góc độ như trong các game góc nhìn thứ ba AAA.
    - **Di chuyển theo hướng camera**: Nhân vật tự động bước theo hướng góc nhìn camera khi bấm W/A/S/D.
    - **Cuộn chuột (Mouse Wheel)**: Tự do phóng to / thu nhỏ (zoom in/out) khoảng cách camera quanh nhân vật.
    - Đã dọn dẹp các thanh gợi ý ở đáy màn hình và ẩn hoàn toàn logo Next.js dev indicator cho tầm nhìn thông thoáng tối đa.

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```text
fun-quiz/
├── app/
│   ├── actions/             # Server actions (quiz, attempt, leaderboard)
│   ├── leaderboard/         # Bảng xếp hạng và bộ sưu tập huy hiệu Quiz.com
│   ├── lobby/               # Sảnh nhập mã PIN & chọn phòng chơi
│   ├── login/               # Hồ sơ người chơi (Nickname & Avatar linh vật)
│   ├── quiz/create/         # Tạo đề thi thông minh với AI & tài liệu
│   ├── room/[code]/         # Màn thi đấu trắc nghiệm tương tác tốc độ
│   ├── globals.css          # Design system Quiz.com (#FFFDF4, 3D buttons)
│   ├── layout.tsx           # Layout gốc kèm Google Fonts hiện đại
│   └── page.tsx             # Landing page phong cách Quiz.com
├── components/
│   ├── arena/
│   │   ├── ConfettiEffect.tsx   # Hiệu ứng pháo hoa ăn mừng
│   │   └── QuizReviewModal.tsx  # Modal xem lại bài làm chi tiết
│   ├── Navbar.tsx           # Thanh điều hướng Quiz.com
│   └── QuizLogo.tsx         # Logo Quiz.com AI đa sắc
├── lib/
│   ├── ai/generate-quiz.ts  # Gemini AI engine sinh câu hỏi
│   ├── achievements.ts      # Hệ thống huy hiệu
│   ├── player.ts            # Quản lý hồ sơ người chơi
│   ├── scoring.ts           # Thuật toán tính điểm & streak
│   ├── sound.ts             # Web Audio synthesizer
│   ├── ratelimit.ts         # Giới hạn tần suất gọi AI
│   └── prisma.ts            # Singleton Prisma 7 Client
├── prisma/
│   ├── schema.prisma        # Schema cơ sở dữ liệu PostgreSQL
│   ├── clear-data.ts        # Script dọn dẹp dữ liệu
│   └── seed.ts              # Script nạp dữ liệu
├── package.json             # Cấu hình cổng 3003 & dependencies
└── PROJECT_ROADMAP.md       # Tài liệu tiến độ dự án
```
