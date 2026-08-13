import { Truck, ShieldCheck, RefreshCcw, Headset } from "lucide-react";

const benefits = [
  { icon: Truck, title: "Miễn phí vận chuyển", sub: "Đơn hàng từ 1.000.000đ" },
  { icon: ShieldCheck, title: "Bảo hành chính hãng", sub: "Lên đến 24 tháng" },
  { icon: RefreshCcw, title: "1 đổi 1 trong 30 ngày", sub: "Nếu có lỗi từ nhà sản xuất" },
  { icon: Headset, title: "Hỗ trợ 24/7", sub: "Tận tâm - Nhanh chóng" },
];

export default function BenefitsBar() {
  return (
    <div className="mx-auto -mt-8 max-w-7xl px-6">
      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-md lg:grid-cols-4">
        {benefits.map((b) => (
          <div key={b.title} className="flex items-center gap-3">
            <b.icon size={24} className="text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">{b.title}</p>
              <p className="text-xs text-gray-400">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}