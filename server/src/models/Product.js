const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên sản phẩm'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true, // không cho trùng, dùng để tạo URL đẹp: /products/macbook-air-m3
    },
    brand: {
      type: String,
      required: true, // Apple, Dell, Asus, Lenovo...
    },
    category: {
      type: String,
      required: true, // Gaming, Văn phòng, Đồ họa, Sinh viên
    },
    price: {
      type: Number,
      required: [true, 'Vui lòng nhập giá'],
      min: 0,
    },
    oldPrice: {
      type: Number, // giá gốc trước khuyến mãi, không bắt buộc
    },
    images: {
      type: [String], // mảng các URL ảnh
      required: true,
    },
    specs: {
      cpu: { type: String, required: true },
      ram: { type: String, required: true },
      storage: { type: String, required: true },
      screen: { type: String, required: true },
    },
    stock: {
      type: Number,
      required: true,
      default: 0, // số lượng còn trong kho
    },
    isNew: {
      type: Boolean,
      default: false, // để gắn badge "MỚI" như trong ảnh
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true, // tự động thêm createdAt, updatedAt
  }
);

module.exports = mongoose.model('Product', productSchema);