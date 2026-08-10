const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

connectDB(); // kết nối MongoDB ngay khi server khởi động

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'LaptopZone API đang chạy!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});