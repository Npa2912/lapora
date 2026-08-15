const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên sản phẩm"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: [true, "Vui lòng nhập giá"],
      min: 0,
    },
    oldPrice: {
      type: Number,
    },
    images: {
      type: [String],
      required: true,
    },

    specs: {
      cpu: { type: String, required: true },
      gpu: {
        type: String,
        default: "Card đồ họa tích hợp",
      },
      ram: { type: String, required: true },
      storage: { type: String, required: true },
      screen: { type: String, required: true },
      weight: { type: String },
      battery: { type: String },
      ports: { type: [String], default: [] },
    },

    // Dữ liệu để engine/AI tư vấn như nhân viên có kinh nghiệm.
    advice: {
      suitableFor: {
        type: [String],
        default: [],
        // VD: ["Sinh viên", "Lập trình cơ bản", "Văn phòng"]
      },
      notIdealFor: {
        type: [String],
        default: [],
        // VD: ["AI nặng", "Render 3D chuyên nghiệp"]
      },
      strengths: {
        type: [String],
        default: [],
        // VD: ["Nhẹ dễ mang đi học", "Pin tốt", "Màn hình đẹp"]
      },
      limitations: {
        type: [String],
        default: [],
        // VD: ["Không phù hợp game AAA", "RAM không nâng cấp được"]
      },
      upgradeability: {
        ram: {
          type: String,
          default: "Chưa rõ",
          // VD: "Nâng cấp được tối đa 32GB"
        },
        storage: {
          type: String,
          default: "Chưa rõ",
        },
      },
      portability: {
        type: String,
        enum: ["Rất nhẹ", "Nhẹ", "Cân bằng", "Nặng"],
        default: "Cân bằng",
      },
      performanceTier: {
        type: String,
        enum: ["Cơ bản", "Cân bằng", "Hiệu năng cao"],
        default: "Cân bằng",
      },
      expectedUseYears: {
        type: Number,
        min: 1,
        max: 8,
        default: 3,
      },
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    isNew: {
      type: Boolean,
      default: false,
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

    isFeaturedHero: {
      type: Boolean,
      default: false,
    },
    heroTagline: {
      type: String,
    },
    heroBackground: {
      type: String,
    },
    heroSpecs: [
      {
        icon: { type: String },
        label: { type: String },
        value: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);