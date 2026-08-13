const Groq = require("groq-sdk");
const { searchProducts } = require("../tools/searchProducts");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const tools = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Tìm laptop thật đang còn hàng trong database LAPORA theo nhu cầu và ngân sách của khách.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["Gaming", "Văn phòng", "Đồ họa", "Sinh viên"],
            description: "Danh mục laptop phù hợp",
          },
          minPrice: {
            type: "number",
            description: "Giá tối thiểu, đơn vị VNĐ",
          },
          maxPrice: {
            type: "number",
            description: "Ngân sách tối đa, đơn vị VNĐ",
          },
          ram: {
            type: "string",
            description: "RAM cần thiết, ví dụ: 8GB hoặc 16GB",
          },
        },
      },
    },
  },
];

async function askLaporaAI(message, conversationHistory = []) {
  const messages = [
    {
      role: "system",
      content: `
Bạn là LAPORA AI, tư vấn laptop bằng tiếng Việt. Trả lời tự nhiên, ngắn gọn, phù hợp để đọc bằng giọng nói.

- Dùng lịch sử hội thoại; không hỏi lại thông tin khách đã cung cấp.
- Chỉ giới thiệu sản phẩm do search_products trả về. Không bịa giá, cấu hình, tồn kho hoặc khuyến mãi.
- Khi có mục đích + ngân sách, gọi search_products ngay.
- Chỉ có ngân sách: hỏi đúng 1 câu về mục đích sử dụng.
- Chỉ có mục đích: hỏi đúng 1 câu về ngân sách.
- "CNTT", "IT", "lập trình", "code", "phần mềm" => nhu cầu lập trình: ưu tiên RAM 16GB, SSD 512GB, CPU Core i5/Ryzen 5 trở lên.
- "game", "gaming" => Gaming. "đồ họa", "render", "thiết kế", "dựng video" => Đồ họa. "văn phòng", "Word", "Excel" => Văn phòng.
- "dưới", "tối đa", "chỉ có", "khoảng", "tầm", "đổ lại" N triệu/củ => maxPrice = N * 1000000.
- "từ A đến B triệu" => minPrice = A * 1000000, maxPrice = B * 1000000.
- Chỉ truyền category khi chắc chắn khớp đúng category trong database; nếu không chắc thì bỏ category.
- Sau khi tool trả kết quả: nêu tối đa 2 máy tốt nhất, mỗi máy gồm tên, giá và tối đa 2 lý do phù hợp.
- Không dùng Markdown, bảng, hay câu trả lời dài.
- Không có kết quả: nói ngắn gọn và hỏi khách có thể thay đổi ngân sách/yêu cầu không.
`,
    },
    ...conversationHistory,
    {
      role: "user",
      content: message,
    }, 
  ];

  let completion = await groq.chat.completions.create({
    model: "qwen/qwen3.6-27b",
    messages,
    tools,
    tool_choice: "auto",
  });

  let assistantMessage = completion.choices[0].message;
  let products = [];

  if (assistantMessage.tool_calls?.length) {
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

      let toolResult = [];

      if (toolName === "search_products") {
        toolResult = await searchProducts(toolArgs);
        products = toolResult;
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolName,
        content: JSON.stringify(toolResult),
      });
    }

    completion = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      messages,
      tools,
    });

    assistantMessage = completion.choices[0].message;
  }

  return {
  reply: assistantMessage.content,
  products,
  history: [
    ...conversationHistory,
    {
      role: "user",
      content: message,
    },
    {
      role: "assistant",
      content: assistantMessage.content || "",
    },
  ],
};
}

module.exports = { askLaporaAI };