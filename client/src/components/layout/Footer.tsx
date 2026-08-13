import { Mail, MapPin, Phone, Send } from "lucide-react";

export default function Footer() {
  return (
    <>
      {/* Đăng ký nhận tin */}
      <section className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50">
              <Mail size={23} className="text-indigo-600" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">ĐĂNG KÝ NHẬN TIN</h3>
              <p className="text-sm text-slate-500">
                Nhận thông tin sản phẩm mới, ưu đãi và khuyến mãi đặc biệt.
              </p>
            </div>
          </div>

          <form className="flex w-full max-w-xl overflow-hidden rounded-lg border border-slate-200">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Send size={16} />
              ĐĂNG KÝ
            </button>
          </form>
        </div>
      </section>

      <footer className="bg-slate-50 pt-12 text-slate-600">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Thông tin shop */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2">
              <img
                src="/images/logo.jpg"
                alt="LAPORA"
                className="h-10 w-10 rounded object-contain"
              />
              <span className="text-xl font-extrabold text-slate-900">
                LAPORA
              </span>
            </a>

            <p className="mt-4 max-w-sm text-sm leading-6">
              LAPORA chuyên cung cấp laptop chính hãng, cấu hình đa dạng và
              dịch vụ hỗ trợ tận tâm.
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <a
                href="tel:19001234"
                className="flex items-center gap-2 transition hover:text-indigo-600"
              >
                <Phone size={16} />
                1900 1234
              </a>

              <a
                href="mailto:support@lapora.vn"
                className="flex items-center gap-2 transition hover:text-indigo-600"
              >
                <Mail size={16} />
                support@lapora.vn
              </a>

              <p className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh
              </p>
            </div>
          </div>

          {/* Cột liên kết */}
          <div>
            <h3 className="font-bold text-slate-900">VỀ CHÚNG TÔI</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="/about" className="hover:text-indigo-600">Giới thiệu</a></li>
              <li><a href="/contact" className="hover:text-indigo-600">Tuyển dụng</a></li>
              <li><a href="/stores" className="hover:text-indigo-600">Hệ thống cửa hàng</a></li>
              <li><a href="/blog" className="hover:text-indigo-600">Tin tức</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">CHÍNH SÁCH</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="/" className="hover:text-indigo-600">Chính sách bảo hành</a></li>
              <li><a href="/" className="hover:text-indigo-600">Chính sách đổi trả</a></li>
              <li><a href="/" className="hover:text-indigo-600">Chính sách thanh toán</a></li>
              <li><a href="/" className="hover:text-indigo-600">Chính sách bảo mật</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">HỖ TRỢ</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="/" className="hover:text-indigo-600">Hướng dẫn mua hàng</a></li>
              <li><a href="/" className="hover:text-indigo-600">Câu hỏi thường gặp</a></li>
              <li><a href="/" className="hover:text-indigo-600">Kiểm tra đơn hàng</a></li>
              <li><a href="/" className="hover:text-indigo-600">Liên hệ hỗ trợ</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 LAPORA. All rights reserved.</p>
            <p>Thanh toán an toàn: Visa · Mastercard · VNPay</p>
          </div>
        </div>
      </footer>
    </>
  );
}