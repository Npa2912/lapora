import { Heart, ShoppingCart } from "lucide-react";
import type { Product } from "../../types/product";
import { formatPrice } from "../../utils/formatPrice";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group rounded-xl border border-gray-100 bg-white p-4 hover:shadow-lg transition-shadow">
      <div className="relative">
        {product.isNew && (
          <span className="absolute left-0 top-0 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            MỚI
          </span>
        )}
        <Heart size={18} className="absolute right-0 top-0 text-gray-300 cursor-pointer hover:text-red-500" />
        <img
          src={product.images[0]}
          alt={product.name}
          className="mx-auto h-32 object-contain py-4"
        />
        <span className="absolute bottom-0 right-0 rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
          360°
        </span>
      </div>

      <h3 className="mt-2 line-clamp-1 text-sm font-semibold text-gray-900">{product.name}</h3>
      <p className="mt-1 line-clamp-1 text-xs text-gray-400">
        {product.specs.cpu} / {product.specs.ram} / {product.specs.storage}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-blue-600">{formatPrice(product.price)}</span>
        <button className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors">
          <ShoppingCart size={16} />
        </button>
      </div>
    </div>
  );
}