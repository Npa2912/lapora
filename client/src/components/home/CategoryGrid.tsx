const categories = [
  {
    title: "Laptop Gaming",
    sub: "Hiệu năng đỉnh cao\ncho mọi tựa game",
    bg: "bg-violet-100",
    img: "/images/laptop_gaming.png",
  },
  {
    title: "Laptop Văn phòng",
    sub: "Mỏng nhẹ, bền bỉ\nlàm việc hiệu quả",
    bg: "bg-sky-100",
    img: "/images/laptop_vanphong.png",
  },
  {
    title: "Laptop Đồ họa",
    sub: "Màn hình chuẩn màu\nhiệu năng mạnh mẽ",
    bg: "bg-emerald-100",
    img: "/images/laptop_dohoa.png",
  },
  {
    title: "Laptop Sinh viên",
    sub: "Giá tốt, cấu hình ổn\nđáp ứng mọi nhu cầu",
    bg: "bg-lime-100",
    img: "/images/laptop_sinhvien.png",
  },
];

export default function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          DANH MỤC NỔI BẬT
        </h2>

        <a
          href="/categories"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Xem tất cả danh mục →
        </a>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {categories.map((category) => (
          <div
            key={category.title}
            className={`relative min-h-[170px] overflow-hidden rounded-2xl p-5 ${category.bg}`}
          >
            {/* Nội dung chữ */}
            <div className="relative z-10">
              <h3 className="font-bold text-gray-900">{category.title}</h3>

              <p className="mt-1 whitespace-pre-line text-xs leading-5 text-gray-500">
                {category.sub}
              </p>

              <a
                href="/products"
                className="mt-3 inline-block text-xs font-semibold text-gray-800 hover:text-blue-600"
              >
                Xem ngay →
              </a>
            </div>

            {/* Laptop ở góc dưới phải */}
            <img
              src={category.img}
              alt={category.title}
              className="absolute bottom-0 right-0 h-[145px] w-[70%] object-contain object-bottom-right transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}