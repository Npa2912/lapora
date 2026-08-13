const Product = require("../models/Product");

async function searchProducts({
  category,
  minPrice,
  maxPrice,
  ram,
} = {}) {
  const query = {
    stock: { $gt: 0 },
  };

  if (category) {
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.price = {};

    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Ví dụ: "16GB"
  if (ram) {
    query["specs.ram"] = new RegExp(ram, "i");
  }

  const products = await Product.find(query)
    .select("name slug brand category price oldPrice images specs stock description")
    .limit(4)
    .lean();

  return products;
}

module.exports = { searchProducts };