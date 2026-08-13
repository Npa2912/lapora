const express = require("express");
const multer = require("multer");
const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const { askLaporaAI } = require("../services/aiAgentService");

const router = express.Router();

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || ".webm";
    cb(null, `${Date.now()}-${file.fieldname}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng gửi file audio với key là audio.",
      });
    }

    const audioStream = fs.createReadStream(req.file.path);

    const transcription = await groq.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-large-v3-turbo",
      language: "vi",
      response_format: "json",
      prompt: "Đây là hội thoại tư vấn mua laptop bằng tiếng Việt.",
    });

    return res.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error("Voice transcription error:", error);

    return res.status(500).json({
      message: "Không thể chuyển giọng nói thành văn bản.",
      error: error.message,
    });
  } finally {
    // Xóa file audio tạm sau khi xử lý, tránh đầy ổ đĩa
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

// voice AI
router.post("/speak", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        message: "Vui lòng gửi text để chuyển thành giọng nói.",
      });
    }

    const cartesiaResponse = await fetch(
      "https://api.cartesia.ai/tts/bytes",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CARTESIA_API_KEY}`,
          "Cartesia-Version": "2026-03-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_id: "sonic-3.5",
          transcript: text,
          language: "vi",
          voice: {
            mode: "id",
            id: process.env.CARTESIA_VOICE_ID,
          },
          output_format: {
            container: "wav",
            encoding: "pcm_s16le",
            sample_rate: 44100,
          },
          generation_config: {
            speed: 1,
            volume: 1,
          },
        }),
      }
    );

    if (!cartesiaResponse.ok) {
      const errorText = await cartesiaResponse.text();

      return res.status(cartesiaResponse.status).json({
        message: "Cartesia không thể tạo giọng nói.",
        error: errorText,
      });
    }

    const audioBuffer = Buffer.from(await cartesiaResponse.arrayBuffer());

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="lapora-ai-response.wav"'
    );

    return res.send(audioBuffer);
  } catch (error) {
    console.error("Cartesia TTS error:", error);

    return res.status(500).json({
      message: "Không thể chuyển text thành giọng nói.",
      error: error.message,
    });
  }
});


//
router.post("/consult", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng gửi file audio với key là audio.",
      });
    }

    // 1. Audio -> chữ
    const audioStream = fs.createReadStream(req.file.path);

    const transcription = await groq.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-large-v3-turbo",
      language: "vi",
      response_format: "json",
      prompt: "Đây là hội thoại tư vấn mua laptop bằng tiếng Việt.",
    });

    const userMessage = transcription.text.trim();

let conversationHistory = [];

try {
  conversationHistory = req.body.history
    ? JSON.parse(req.body.history)
    : [];
} catch {
  return res.status(400).json({
    message: "Lịch sử hội thoại không hợp lệ.",
  });
}

const aiResult = await askLaporaAI(userMessage, conversationHistory);

    // 3. Trả kết quả để kiểm tra
    return res.json({
      transcript: userMessage,
      reply: aiResult.reply,
      products: aiResult.products,
      history: aiResult.history,
    });
  } catch (error) {
    console.error("Voice consult error:", error);

    return res.status(500).json({
      message: "Không thể xử lý yêu cầu tư vấn bằng giọng nói.",
      error: error.message,
    });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
});
module.exports = router;