const express = require("express");
const { askLaporaAI } = require("../services/aiAgentService");
const { searchProducts } = require("../tools/searchProducts");

const router = express.Router();

router.post("/message", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Vui lòng nhập câu hỏi cho AI.",
      });
    }

    const result = await askLaporaAI(message);

    return res.json(result);
  } catch (error) {
    console.error("AI Agent error:", error);

    return res.status(500).json({
      message: "AI hiện chưa thể trả lời. Vui lòng thử lại sau.",
    });
  }
});

router.get("/test-search", async (req, res) => {
  try {
    const products = await searchProducts({
      category: req.query.category,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      ram: req.query.ram,
    });

    return res.json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Search products error:", error.message);

    return res.status(500).json({
      message: "Không thể tìm sản phẩm.",
    });
  }
});

module.exports = router;