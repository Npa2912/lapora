const express = require("express");
const multer = require("multer");
const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");

const { normalizeAudio } = require("../tools/audioProcessor");
const { askLaporaAI } = require("../services/aiAgentService");

const router = express.Router();

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || ".webm";
    cb(null, `${Date.now()}-${file.fieldname}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function deleteFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, () => {});
  }
}

function hasLaptopIntent(text, history = []) {
  const normalized = text.toLowerCase().trim();

  // Các câu Whisper thường tự bịa khi audio là tiếng ồn/video/loa.
  const garbagePatterns = [
    /đăng ký kênh/,
    /like và subscribe/,
    /hãy subscribe/,
    /cảm ơn.*theo dõi/,
    /hẹn gặp lại/,
    /trong video/,
    /kênh youtube/,
    /bản quyền/,
    /nhạc nền/,
  ];

  if (garbagePatterns.some((pattern) => pattern.test(normalized))) {
    return false;
  }

  // Câu đầu tiên bắt buộc có ngữ cảnh mua laptop rõ ràng.
  const laptopPatterns = [
    /laptop/,
    /máy tính/,
    /mua máy/,
    /mua laptop/,
    /ngân sách/,
    /\b\d{1,2}\s*(triệu|tr|trieu)\b/,
    /ram/,
    /ssd/,
    /cpu/,
    /core i/,
    /ryzen/,
    /gaming/,
    /chơi game/,
    /đồ họa/,
    /thiết kế/,
    /lập trình/,
    /code/,
    /cntt/,
    /công nghệ thông tin/,
    /\bit\b/,
    /văn phòng/,
    /sinh viên/,
  ];

  if (laptopPatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  // Chỉ cho phép câu hỏi tiếp nối khi thực sự đã có hội thoại trước đó.
  if (history.length === 0) {
    return false;
  }

  const validFollowUpPatterns = [
    /máy này/,
    /máy đó/,
    /mẫu này/,
    /mẫu đó/,
    /sản phẩm này/,
    /sản phẩm đó/,
    /rẻ hơn/,
    /mạnh hơn/,
    /nhẹ hơn/,
    /tốt hơn/,
    /thêm vào giỏ/,
    /so sánh/,
    /bao nhiêu tiền/,
    /còn hàng/,
    /\b\d{1,2}\s*(triệu|tr|trieu)\b/,
  ];

  return validFollowUpPatterns.some((pattern) => pattern.test(normalized));
}

// Test riêng: Audio -> normalize -> Whisper -> text
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  let cleanAudioPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng gửi file audio với key là audio.",
      });
    }

    cleanAudioPath = await normalizeAudio(req.file.path);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(cleanAudioPath),
      model: "whisper-large-v3",
      language: "vi",
      temperature: 0,
      response_format: "verbose_json",
      prompt:
        "Hội thoại tiếng Việt tư vấn mua laptop. Chỉ chép lời nói nghe rõ, không tự tạo câu từ tiếng ồn hoặc im lặng.",
    });

    return res.json({
      text: transcription.text?.trim() || "",
      segments: transcription.segments || [],
    });
  } catch (error) {
    console.error("Voice transcription error:", error);

    return res.status(500).json({
      message: "Không thể chuyển giọng nói thành văn bản.",
      error: error.message,
    });
  } finally {
    deleteFile(req.file?.path);
    deleteFile(cleanAudioPath);
  }
});

// Text -> Cartesia TTS
router.post("/speak", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
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
          transcript: text.trim(),
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

// Audio -> normalize -> Whisper -> chặn nhiễu -> Agent -> products
router.post("/consult", upload.single("audio"), async (req, res) => {
  let cleanAudioPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng gửi file audio với key là audio.",
      });
    }

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

    cleanAudioPath = await normalizeAudio(req.file.path);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(cleanAudioPath),
      model: "whisper-large-v3",
      language: "vi",
      temperature: 0,
      response_format: "verbose_json",
      prompt:
        "Hội thoại tiếng Việt tư vấn mua laptop. Chỉ chép lời nói nghe rõ, không tự tạo câu từ tiếng ồn hoặc im lặng.",
    });

    const userMessage = transcription.text?.trim() || "";
    const segments = transcription.segments || [];

    console.log("Whisper transcript:", userMessage);
    console.log("Whisper segments:", segments);

    const hasReliableSpeech = segments.some((segment) => {
      const confidence = segment.avg_logprob ?? -10;
      const noSpeechProbability = segment.no_speech_prob ?? 1;

      return confidence > -1.8 && noSpeechProbability < 0.8;
    });

    // Chặn audio rỗng, không rõ hoặc nhiễu.
   const hasValidLaptopIntent = hasLaptopIntent(
  userMessage,
  conversationHistory
);

// Chỉ bỏ qua khi Whisper không có nội dung hoặc nội dung không liên quan laptop.
// Không chặn chỉ vì confidence audio thấp nữa.
if (userMessage.length < 3 || !hasValidLaptopIntent) {
  console.log("Bỏ transcript rác/không liên quan:", userMessage);

  return res.json({
    ignored: true,
    transcript: "",
    reply: "",
    products: [],
    history: conversationHistory,
  });
}

// Chỉ log cảnh báo để theo dõi, nhưng vẫn cho AI xử lý
// nếu transcript có ý định mua laptop rõ ràng.
if (!hasReliableSpeech) {
  console.warn("Audio confidence thấp nhưng có ý định laptop rõ:", {
    userMessage,
    segments,
  });
}

    const aiResult = await askLaporaAI(userMessage, conversationHistory);

    return res.json({
      ignored: false,
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
    deleteFile(req.file?.path);
    deleteFile(cleanAudioPath);
  }
});

module.exports = router;