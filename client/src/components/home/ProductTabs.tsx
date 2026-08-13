import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../product/ProductCard";
import { getProducts } from "../../services/productService";
import type { Product } from "../../types/product";

const tabs = ["Tất cả", "Mới nhất", "Bán chạy", "Gaming", "Văn phòng", "Đồ họa"];

export default function ProductTabs() {
  const [active, setActive] = useState("Tất cả");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setError("Không tải được sản phẩm. Kiểm tra lại server backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts =
    active === "Tất cả"
      ? products
      : products.filter((p) => p.category === active || (active === "Mới nhất" && p.isNew));

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">SẢN PHẨM NỔI BẬT</h2>
        <a href="/products" className="text-sm font-medium text-blue-600">Xem tất cả sản phẩm →</a>
      </div>

      <div className="mb-6 flex gap-6 border-b border-gray-100 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`pb-3 font-medium transition-colors ${
              active === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-400">Đang tải sản phẩm...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="relative">
          <button className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow">
            <ChevronLeft size={18} />
          </button>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {filteredProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          <button className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}