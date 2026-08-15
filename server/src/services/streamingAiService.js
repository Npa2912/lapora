const Groq = require("groq-sdk");
const { recommendLaptops } = require("./recommendationService");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const tools = [
  {
    type: "function",
    function: {
      name: "recommend_laptops",
      description:
        "Đánh giá và xếp hạng laptop thật trong kho LAPORA theo nhu cầu khách hàng. Kết quả gồm máy AI đề xuất, máy đủ dùng tiết kiệm và lựa chọn đầu tư thêm.",
      parameters: {
        type: "object",
        properties: {
          purposes: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "general",
                "study",
                "programming",
                "office",
                "gaming",
                "design",
              ],
            },
            description:
              "Một hoặc nhiều nhu cầu chính của khách, ví dụ programming, study.",
          },
          category: {
            type: "string",
            enum: ["Gaming", "Văn phòng", "Đồ họa", "Sinh viên"],
            description:
              "Chỉ truyền khi khách nói rõ đúng nhóm sản phẩm này.",
          },
          maxPrice: {
            type: "number",
            description: "Ngân sách tối đa, đơn vị VNĐ.",
          },
          portability: {
            type: "string",
            enum: ["high", "normal", "low"],
            description:
              "high nếu khách cần máy nhẹ, mang đi học/đi làm nhiều.",
          },
          futureProof: {
            type: "string",
            enum: ["high", "normal"],
            description:
              "high nếu khách muốn dùng an tâm khoảng 3 đến 4 năm.",
          },
          buyerContext: {
            type: "string",
            enum: ["student", "parent", "worker", "general"],
            description: "Người mua là ai.",
          },
        },
        required: ["purposes"],
      },
    },
  },
];

const systemPrompt = `
Bạn là LAPORA AI, một nhân viên tư vấn laptop giàu kinh nghiệm, nói tiếng Việt tự nhiên.

Cách tư vấn:
- Không tư vấn chỉ dựa vào RAM. Cân nhắc mục đích, ngân sách, CPU, GPU, RAM, SSD, màn hình, trọng lượng, khả năng dùng lâu dài và đánh đổi thực tế.
- Không biết chính xác khách sẽ dùng phần mềm gì thì không được hỏi dồn các thuật ngữ kỹ thuật như Docker, máy ảo hoặc AI.
- Với phụ huynh mua cho con sắp vào đại học: ưu tiên máy cân bằng, bền, dễ mang theo và dùng an tâm 3 đến 4 năm; chỉ hỏi ngành học nếu thông tin này thực sự cần.
- Nếu máy không mạnh cho mọi việc, vẫn có thể giới thiệu nó là "đủ dùng và tiết kiệm", kèm lưu ý ngắn gọn; không nói "không có máy phù hợp" khi hệ thống vẫn có lựa chọn.
- Nếu có máy chỉ vượt ngân sách nhẹ nhưng đáng để dùng lâu hơn, gọi đó là "đầu tư thêm", không ép mua.
- Khi khách chưa có mục đích hoặc ngân sách: chỉ hỏi đúng một thông tin còn thiếu, bằng câu tự nhiên.
- Khi đã có mục đích và ngân sách: gọi tool recommend_laptops.
- "CNTT", "IT", "lập trình", "code", "phần mềm" => programming.
- "game", "gaming" => gaming.
- "đồ họa", "render", "thiết kế", "dựng video" => design.
- "văn phòng", "Word", "Excel" => office.
- "học", "sinh viên", "đại học" => study.
- "dưới", "tối đa", "chỉ có", "khoảng", "tầm", "đổ lại" N triệu/củ => maxPrice = N * 1000000.
- "từ A đến B triệu" => maxPrice = B * 1000000.
- "nhẹ", "mang đi học", "di chuyển nhiều" => portability = high.
- "dùng lâu", "3 năm", "4 năm", "tương lai" => futureProof = high.
`;

function sanitizeHistory(history = []) {
  return history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
    )
    .slice(-4)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 500),
    }));
}

function compactProductForAI(product) {
  if (!product) {
    return null;
  }

  return {
    id: String(product._id),
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    cpu: product.specs?.cpu,
    gpu: product.specs?.gpu,
    ram: product.specs?.ram,
    storage: product.specs?.storage,
    screen: product.specs?.screen,
    recommendation: {
      label: product.recommendation?.label,
      priceStatus: product.recommendation?.priceStatus,
      reasons: product.recommendation?.reasons || [],
      considerations: product.recommendation?.considerations || [],
    },
  };
}

async function streamLaporaAI({ message, history = [], onTextDelta }) {
  const cleanHistory = sanitizeHistory(history);

  const baseMessages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...cleanHistory,
    {
      role: "user",
      content: message,
    },
  ];

  let recommendation = {
    primary: null,
    products: [],
  };

  // Lượt 1: AI chỉ hiểu nhu cầu và quyết định có cần gọi engine không.
  const planningCompletion = await groq.chat.completions.create({
    model: "qwen/qwen3.6-27b",
    reasoning_effort: "none",
    reasoning_format: "hidden",
    messages: baseMessages,
    tools,
    tool_choice: "auto",
    temperature: 0.2,
    max_completion_tokens: 160,
  });

  const planningMessage = planningCompletion.choices[0]?.message;

  if (!planningMessage) {
    throw new Error("Groq không trả về kết quả xử lý.");
  }

  // Lượt 1 không được stream sang Cartesia.
  // Nó có thể chứa XML tool_call của Qwen.
  if (planningMessage.tool_calls?.length) {
    for (const toolCall of planningMessage.tool_calls) {
      if (toolCall.function.name !== "recommend_laptops") {
        continue;
      }

      let profile = {};

      try {
        profile = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        console.error(
          "Recommendation profile không hợp lệ:",
          toolCall.function.arguments
        );
      }

      recommendation = await recommendLaptops(profile);
    }
  }

  const compactRecommendation = {
    primary: compactProductForAI(recommendation.primary),
    products: recommendation.products.map(compactProductForAI),
  };

  // Lượt 2: chỉ nói chuyện tự nhiên, không gọi tool nữa.
  const finalMessages = [
    ...baseMessages,
    {
      role: "system",
      content: `
Dưới đây là kết quả đánh giá thật từ hệ thống LAPORA:
${JSON.stringify(compactRecommendation)}

Quy tắc trả lời cuối:
- Chỉ trả lời bằng tiếng Việt tự nhiên, tối đa 2 câu ngắn, phù hợp để đọc bằng giọng nói.
- Nếu có primary: chỉ giới thiệu primary là máy em đánh giá phù hợp nhất.
- Chỉ nêu giá và tối đa 2 lý do liên quan trực tiếp nhu cầu khách; không đọc danh sách cấu hình.
- Phải nói ngắn rằng các lựa chọn khác đã được hiện trên màn hình.
- Không giới thiệu toàn bộ danh sách bằng giọng nói.
- Nếu primary có lưu ý, chỉ nêu khi nó ảnh hưởng quan trọng đến nhu cầu khách.
- Nếu chưa có kết quả đánh giá vì thiếu thông tin, chỉ hỏi đúng một thông tin còn thiếu.
- Không trả XML, HTML, JSON, Markdown, <tool_call>, <function> hoặc <parameter>.
      `.trim(),
    },
  ];

  const stream = await groq.chat.completions.create({
    model: "qwen/qwen3.6-27b",
    reasoning_effort: "none",
    reasoning_format: "hidden",
    messages: finalMessages,
    stream: true,
    temperature: 0.25,
    max_completion_tokens: 120,
  });

  let reply = "";

  for await (const chunk of stream) {
    const textDelta = chunk.choices?.[0]?.delta?.content || "";

    if (!textDelta) {
      continue;
    }

    reply += textDelta;
    await onTextDelta(textDelta);
  }

  if (!reply.trim()) {
    reply =
      "Dạ, bạn cho em biết thêm mục đích sử dụng hoặc ngân sách để em tư vấn chính xác nhé.";

    await onTextDelta(reply);
  }

  return {
    reply: reply.trim(),

    // Frontend nhận mảng này ở stream_end để hiện ProductCard.
    products: recommendation.products,

    history: [
      ...cleanHistory,
      { role: "user", content: message },
      { role: "assistant", content: reply.trim() },
    ],
  };
}

module.exports = { streamLaporaAI };