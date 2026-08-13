const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  getHeroProduct,
} = require('../controllers/productController');

router.get('/hero', getHeroProduct); 
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);

module.exports = router;