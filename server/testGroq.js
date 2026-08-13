require("dotenv").config();

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function testGroq() {
  try {
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      messages: [
        {
          role: "user",
          content: "Hãy trả lời ngắn gọn: Bạn có thể tư vấn laptop không?",
        },
      ],
    });

    console.log("AI trả lời:");
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("Lỗi Groq:", error.message);
  }
}

testGroq();