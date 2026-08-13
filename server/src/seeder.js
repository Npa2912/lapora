const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const products = require('./data/products');

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Product.deleteMany(); // xóa hết sản phẩm cũ
    await Product.insertMany(products); // thêm sản phẩm mẫu

    console.log('✅ Dữ liệu mẫu đã được thêm thành công!');
    process.exit();
  } catch (error) {
    console.error(`❌ Lỗi: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany();

    console.log('🗑️  Đã xóa hết dữ liệu!');
    process.exit();
  } catch (error) {
    console.error(`❌ Lỗi: ${error.message}`);
    process.exit(1);
  }
};

// Kiểm tra tham số dòng lệnh: chạy "node seeder.js -d" để xóa, không có gì thì import
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}