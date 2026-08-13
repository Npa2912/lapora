import { useEffect, useState } from "react";
import { Cpu, Monitor, Feather, BatteryFull } from "lucide-react";
import { getHeroProduct } from "../../services/productService";
import type { Product, HeroSpec } from "../../types/product";
import { formatPrice } from "../../utils/formatPrice";

const iconMap: Record<HeroSpec["icon"], typeof Cpu> = {
  cpu: Cpu,
  screen: Monitor,
  weight: Feather,
  battery: BatteryFull,
};

export default function HeroBanner() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHeroProduct()
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !product) {
    return null;
  }

  return (
    <section className="overflow-hidden pb-12 pt-8 lg:pb-16 lg:pt-12">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Nội dung bên trái */}
        <div className="z-10">
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm">
            {product.isNew ? "SẢN PHẨM MỚI" : "NỔI BẬT"}
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
            {product.name}
          </h1>

          {product.heroTagline && (
            <p className="mt-4 max-w-md text-base text-slate-600">
              {product.heroTagline}
            </p>
          )}

          {product.heroSpecs && product.heroSpecs.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-5">
              {product.heroSpecs.map((spec) => {
                const Icon = iconMap[spec.icon];

                return (
                  <div
                    key={spec.label}
                    className="min-w-16 text-center text-xs text-slate-600"
                  >
                    {Icon && (
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                        <Icon size={20} className="text-indigo-600" />
                      </div>
                    )}
                    <p className="font-medium">{spec.label}</p>
                    <p>{spec.value}</p>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-7 text-sm text-slate-500">Giá chỉ từ</p>
          <p className="mt-1 text-3xl font-extrabold text-indigo-600">
            {formatPrice(product.price)}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/products/${product.slug}`}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-300 transition hover:bg-indigo-700"
            >
              KHÁM PHÁ NGAY →
            </a>

            <a
              href={`/products/${product.slug}`}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              XEM CHI TIẾT →
            </a>
          </div>
        </div>

        {/* Laptop bên phải */}
        <div className="relative flex min-h-80 items-center justify-center lg:min-h-460px]">
         

      

          <img
            //src={product.images[0]}
            src={"/images/laptop.png"}
            alt={product.name}
            className="relative z-10 -translate-x-10 -[125%] max-w-3xl object-contain drop-shadow-2xl"
          />

          {product.images.length > 1 && (
            <div className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 rounded-xl bg-white/80 p-2 shadow-lg md:flex">
              {product.images.map((img, index) => (
                <div
                  key={img}
                  className={`h-14 w-14 overflow-hidden rounded-lg border-2 p-1 ${
                    index === 0 ? "border-indigo-600" : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}