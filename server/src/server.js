const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const aiRoutes = require("./routes/aiRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const http = require("http");
const { setupVoiceGateway } = require("./realtime/voiceGateway");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/ai", aiRoutes);
app.use("/api/voice", voiceRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'LAPORA API đang chạy!' });
});

app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

setupVoiceGateway(server);

server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});