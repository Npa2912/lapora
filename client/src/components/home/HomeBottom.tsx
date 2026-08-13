import {
  BadgeCheck,
  ChevronRight,
  Headphones,
  MessageCircle,
  RotateCcw,
  SearchCheck,
  Settings,
  ShieldCheck,
  Truck,
} from "lucide-react";

const promotions = [
  {
    title: "TRẢ GÓP 0%\nLÃI SUẤT",
    text: "Duyệt nhanh trong 5 phút",
    button: "Xem chi tiết →",
    image: "/images/laptop1.webp",
    bg: "from-blue-50 to-violet-100",
  },
  {
    title: "THU CŨ\nĐỔI MỚI",
    text: "Trợ giá lên đến 5.000.000đ",
    button: "Xem chi tiết →",
    image: "/images/laptop_gaming.png",
    bg: "from-sky-50 to-cyan-100",
  },
  {
    title: "ƯU ĐÃI HỘI VIÊN",
    text: "Giảm đến 10%, nhiều ưu đãi độc quyền",
    button: "Tham gia ngay →",
    image: "/images/macbookm3.jpg",
    bg: "from-indigo-100 to-violet-200",
  },
];

const news = [
  {
    image: "/images/macbookm3.jpg",
    date: "20/05/2024",
    title: "So sánh MacBook Air M3 và MacBook Air M2: Nên nâng cấp?",
  },
  {
    image: "/images/laptop_gaming.png",
    date: "16/05/2024",
    title: "Top 5 laptop gaming đáng mua nhất năm 2024",
  },
  {
    image: "/images/laptop1.webp",
    date: "15/05/2024",
    title: "Hướng dẫn chọn laptop phù hợp cho sinh viên",
  },
  {
    image: "/images/cat-office.png",
    date: "10/05/2024",
    title: "Cách bảo vệ pin laptop và tăng tuổi thọ hiệu quả",
  },
];

export default function HomeBottom() {
  return (
    <section className="mx-auto max-w-7xl space-y-10 px-6 pb-14">
      {/* Ưu đãi */}
      <div className="grid gap-4 md:grid-cols-3">
        {promotions.map((item) => (
          <a
            key={item.title}
            href="/promotions"
            className={`group relative min-h-[150px] overflow-hidden rounded-2xl bg-gradient-to-r ${item.bg} p-6`}
          >
            <div className="relative z-10 max-w-[58%]">
              <h3 className="whitespace-pre-line text-lg font-extrabold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-xs text-slate-600">{item.text}</p>
              <span className="mt-4 inline-block rounded-md bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {item.button}
              </span>
            </div>

            <img
              src={item.image}
              alt=""
              className="absolute bottom-0 right-0 h-[130px] w-[48%] object-contain transition duration-300 group-hover:scale-105"
            />
          </a>
        ))}
      </div>

      {/* Cam kết */}
      <div className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-white via-blue-50 to-sky-100 p-7 md:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              MUA LAPTOP AN TÂM HƠN
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
              Chính sách rõ ràng, dịch vụ tận tâm
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Đồng hành cùng bạn trong suốt quá trình chọn mua và sử dụng laptop.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <SearchCheck className="text-indigo-600" size={25} />
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  Kiểm tra máy
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Kiểm tra kỹ lưỡng trước khi thanh toán.
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <RotateCcw className="text-indigo-600" size={25} />
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  Đổi trả 30 ngày
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Đổi trả dễ dàng nếu máy có lỗi.
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <Headphones className="text-indigo-600" size={25} />
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  Bảo hành tận nơi
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Hỗ trợ nhanh chóng, tận tâm.
                </p>
              </div>
            </div>

            <a
              href="/policies"
              className="mt-6 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Xem chính sách <ChevronRight size={17} />
            </a>
          </div>

          <div className="relative hidden min-h-[250px] items-center justify-center lg:flex">
            <div className="absolute h-48 w-48 rounded-full bg-blue-300/30 blur-3xl" />
            <ShieldCheck size={180} strokeWidth={1.2} className="relative text-indigo-500" />
            <BadgeCheck
              size={60}
              className="absolute bottom-5 right-10 rounded-full bg-white p-2 text-blue-600 shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Quy trình hỗ trợ */}
      <div className="rounded-3xl border border-slate-100 bg-white px-6 py-9 shadow-sm">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-slate-900">
            HỖ TRỢ TỪ LÚC CHỌN ĐẾN KHI DÙNG
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Đồng hành cùng bạn trong suốt hành trình sử dụng laptop.
          </p>
        </div>

        <div className="mt-9 grid gap-7 md:grid-cols-4">
          {[
            {
              number: "1",
              icon: MessageCircle,
              title: "Tư vấn đúng nhu cầu",
              text: "Tư vấn chuyên sâu, gợi ý cấu hình phù hợp.",
            },
            {
              number: "2",
              icon: Truck,
              title: "Giao nhanh 2H",
              text: "Giao siêu tốc trong 2 giờ tại nội thành.",
            },
            {
              number: "3",
              icon: Settings,
              title: "Cài đặt miễn phí",
              text: "Hỗ trợ cài phần mềm và tối ưu máy.",
            },
            {
              number: "4",
              icon: Headphones,
              title: "Chăm sóc trọn đời",
              text: "Hỗ trợ kỹ thuật 24/7, luôn bên bạn.",
            },
          ].map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.number} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon size={27} />
                </div>
                <span className="absolute left-[calc(50%-35px)] top-10 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {step.number}
                </span>
                <h3 className="mt-4 text-sm font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{step.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tin tức */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">TIN TỨC - CÔNG NGHỆ</h2>
          <a href="/blog" className="text-sm font-medium text-indigo-600">
            Xem tất cả bài viết →
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {news.map((article) => (
            <a key={article.title} href="/blog" className="group">
              <div className="h-36 overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={article.image}
                  alt={article.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <p className="mt-3 text-xs text-slate-400">{article.date}</p>
              <h3 className="mt-1 text-sm font-bold leading-5 text-slate-800 group-hover:text-indigo-600">
                {article.title}
              </h3>
            </a>
          ))}
        </div>
      </div>

      {/* Thương hiệu */}
      <div>
        <h2 className="mb-5 text-xl font-bold text-slate-900">
          THƯƠNG HIỆU NỔI BẬT
        </h2>

        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-100 bg-white sm:grid-cols-4 lg:grid-cols-7">
          {["Apple", "ASUS", "DELL", "HP", "Lenovo", "acer", "MSI"].map((brand) => (
            <div
              key={brand}
              className="flex h-20 items-center justify-center border-b border-r border-slate-100 text-lg font-extrabold text-slate-700 last:border-r-0"
            >
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}