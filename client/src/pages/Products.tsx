import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, Sparkles, X } from "lucide-react";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";

import { getProducts } from "../services/productService";
import type { Product } from "../types/product";

import {
  clearAiRecommendations,
  useAiRecommendations,
} from "../store/aiRecommendationStore";

const categories = [
  "Tất cả",
  "Gaming",
  "Văn phòng",
  "Đồ họa",
  "Sinh viên",
];

type SortType = "default" | "low-to-high" | "high-to-low";

export default function Products() {
  const aiRecommendations = useAiRecommendations();

  const isAiMode =
    new URLSearchParams(window.location.search).get("source") === "ai";

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!isAiMode);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [selectedBrand, setSelectedBrand] = useState("Tất cả");
  const [sortType, setSortType] = useState<SortType>("default");

  useEffect(() => {
    if (isAiMode) {
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();
        setAllProducts(data);
      } catch {
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isAiMode]);

  const sourceProducts = isAiMode ? aiRecommendations : allProducts;

  const brands = useMemo(() => {
    return ["Tất cả", ...new Set(sourceProducts.map((product) => product.brand))];
  }, [sourceProducts]);

  const displayedProducts = useMemo(() => {
    let products = [...sourceProducts];

    if (activeCategory !== "Tất cả") {
      products = products.filter(
        (product) => product.category === activeCategory
      );
    }

    if (selectedBrand !== "Tất cả") {
      products = products.filter(
        (product) => product.brand === selectedBrand
      );
    }

    if (sortType === "low-to-high") {
      products.sort((first, second) => first.price - second.price);
    }

    if (sortType === "high-to-low") {
      products.sort((first, second) => second.price - first.price);
    }

    return products;
  }, [sourceProducts, activeCategory, selectedBrand, sortType]);

  const showAllProducts = () => {
    clearAiRecommendations();
    window.history.pushState({}, "", "/products");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff] text-slate-900">
      <Header />

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 lg:px-6">
        {isAiMode ? (
          <section className="mb-8 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 p-6 text-white shadow-xl shadow-indigo-100 md:p-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-100">
                  <Sparkles size={18} />
                  KẾT QUẢ TỪ LAPORA AI
                </div>

                <h1 className="text-2xl font-extrabold md:text-3xl">
                  Những laptop phù hợp với nhu cầu của bạn
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
                  AI đã đánh giá nhu cầu, ngân sách và khả năng dùng lâu dài để
                  chọn các lựa chọn phù hợp nhất.
                </p>
              </div>

              <button
                type="button"
                onClick={showAllProducts}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
              >
                <X size={17} />
                Xem tất cả sản phẩm
              </button>
            </div>
          </section>
        ) : (
          <section className="mb-8 rounded-3xl border border-slate-100 bg-gradient-to-r from-white via-blue-50 to-indigo-50 px-6 py-8 shadow-sm md:px-8">
            <p className="text-sm font-bold text-indigo-600">LAPTOP LAPORA</p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Tìm chiếc laptop phù hợp với bạn
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Khám phá các mẫu laptop chính hãng cho học tập, văn phòng, gaming
              và sáng tạo nội dung.
            </p>
          </section>
        )}

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-slate-500">
              {isAiMode
                ? "Danh sách được AI xếp hạng theo độ phù hợp."
                : "Tất cả laptop đang có tại LAPORA."}
            </p>

            <h2 className="mt-1 text-xl font-extrabold text-slate-900">
              {isAiMode ? "Lựa chọn dành cho bạn" : "Tất cả sản phẩm"}
              <span className="ml-2 text-base font-medium text-slate-400">
                ({displayedProducts.length})
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
              <SlidersHorizontal size={16} className="text-indigo-600" />

              <select
                value={sortType}
                onChange={(event) =>
                  setSortType(event.target.value as SortType)
                }
                className="cursor-pointer bg-transparent font-medium outline-none"
              >
                <option value="default">Sắp xếp mặc định</option>
                <option value="low-to-high">Giá thấp đến cao</option>
                <option value="high-to-low">Giá cao đến thấp</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeCategory === category
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:block">
            <h3 className="font-bold text-slate-900">Thương hiệu</h3>

            <div className="mt-4 space-y-2">
              {brands.map((brand) => (
                <label
                  key={brand}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
                >
                  <input
                    type="radio"
                    name="brand"
                    checked={selectedBrand === brand}
                    onChange={() => setSelectedBrand(brand)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  {brand}
                </label>
              ))}
            </div>

            <div className="my-5 h-px bg-slate-100" />

            <h3 className="font-bold text-slate-900">Tư vấn nhanh</h3>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Bấm biểu tượng robot để LAPORA AI giúp bạn chọn máy theo nhu cầu
              và ngân sách.
            </p>
          </aside>

          <section>
            {loading && (
              <p className="py-16 text-center text-sm text-slate-400">
                Đang tải sản phẩm...
              </p>
            )}

            {error && (
              <p className="py-16 text-center text-sm text-red-500">{error}</p>
            )}

            {!loading && !error && displayedProducts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <p className="font-bold text-slate-800">
                  Chưa có sản phẩm phù hợp với bộ lọc này.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("Tất cả");
                    setSelectedBrand("Tất cả");
                  }}
                  className="mt-3 text-sm font-bold text-indigo-600"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {!loading && !error && displayedProducts.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {displayedProducts.map((product, index) => (
                  <div key={product._id} className="relative">
                    {isAiMode && product.recommendation?.label && (
                      <span
                        className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-bold text-white shadow ${
                          index === 0
                            ? "bg-indigo-600"
                            : product.recommendation.label.includes("Đầu tư")
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      >
                        {product.recommendation.label}
                      </span>
                    )}

                    <ProductCard product={product} />

                    {isAiMode &&
                      product.recommendation?.reasons?.[0] && (
                        <p className="mt-2 px-2 text-xs leading-5 text-slate-500">
                          {product.recommendation.reasons[0]}
                        </p>
                      )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}