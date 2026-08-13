const Product = require('../models/Product');

// @desc    Lấy danh sách tất cả sản phẩm
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message,
    });
  }
};

// @desc    Lấy chi tiết 1 sản phẩm theo id
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message,
    });
  }
};

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi tạo sản phẩm: ' + error.message,
    });
  }
};


// @desc    Lấy sản phẩm đang được đánh dấu hiển thị ở Hero Banner
// @route   GET /api/products/hero
const getHeroProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ isFeaturedHero: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có sản phẩm nào được đặt làm Hero Banner',
      });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  getHeroProduct, // thêm dòng này vào export
};