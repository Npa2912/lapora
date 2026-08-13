import { Search, User, ShoppingCart } from "lucide-react";

const navLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Laptop Gaming", href: "/products?category=gaming" },
  { label: "Laptop Văn phòng", href: "/products?category=office" },
  { label: "Phụ kiện", href: "/accessories" },
  { label: "Tin tức", href: "/blog" },
  { label: "Khuyến mãi", href: "/promotions" },
];

export default function Header() {
  return (
    <header className="relative z-30 border-b border-white/30 bg-transparent">
      <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img
            src="/images/logo.jpg"
            alt="LAPORA"
            className="h-9 w-9 rounded object-contain"
          />
          <span className="text-xl font-extrabold text-slate-900">LAPORA</span>
        </a>

        {/* Nav */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-800 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-indigo-600"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden w-56 items-center gap-2 rounded-full border border-slate-200 bg-white/40 px-4 py-2 text-sm text-slate-500 md:flex">
            <span className="flex-1">Bạn cần tìm gì?</span>
            <Search size={16} />
          </div>

          <User size={20} className="cursor-pointer text-slate-700" />

          <div className="relative cursor-pointer">
            <ShoppingCart size={20} className="text-slate-700" />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
              2
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}