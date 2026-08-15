const { WebSocketServer } = require("ws");
const { streamLaporaAI } = require("../services/streamingAiService");
const {
  createCartesiaStream,
} = require("../services/cartesiaStreamingService");

function sendJson(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function setupVoiceGateway(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws/voice",
  });

  wss.on("connection", (ws) => {
    console.log("Voice WebSocket: client đã kết nối");

    sendJson(ws, {
      type: "connected",
      message: "Voice streaming đã kết nối",
    });

    ws.on("message", async (rawMessage) => {
      let cartesiaSocket;

      try {
        const data = JSON.parse(rawMessage.toString());

        if (data.type === "ping") {
          sendJson(ws, { type: "pong" });
          return;
        }

        if (data.type !== "ai_stream") {
          return;
        }

        const message = data.message?.trim();
        const history = Array.isArray(data.history) ? data.history : [];
        const requestId = data.requestId || Date.now().toString();

        if (!message) {
          sendJson(ws, {
            type: "stream_error",
            requestId,
            message: "Thiếu nội dung câu hỏi.",
          });
          return;
        }

        console.log("Voice stream user:", message);

        sendJson(ws, {
          type: "stream_start",
          requestId,
        });

        // Kết nối Cartesia trước để sẵn sàng nhận text từ Groq.
        const cartesia = await createCartesiaStream();
        cartesiaSocket = cartesia.socket;

        // Nhận audio từ Cartesia song song với lúc Groq tạo text.
        const receiveAudioTask = (async () => {
          for await (const event of cartesia.context.receive()) {
            if (event.type === "chunk" && event.audio) {
              const base64Audio = Buffer.from(event.audio).toString("base64");

              sendJson(ws, {
                type: "audio_chunk",
                requestId,
                audio: base64Audio,
                sampleRate: 44100,
                encoding: "pcm_f32le",
              });
            }

            if (event.type === "done") {
              break;
            }
          }
        })();

        // Groq trả từng đoạn chữ -> gửi web và gửi ngay sang Cartesia.
        const result = await streamLaporaAI({
          message,
          history,

          onTextDelta: async (text) => {
            sendJson(ws, {
              type: "text_delta",
              requestId,
              text,
            });

            await cartesia.context.push({
              transcript: text,
            });
          },
        });

        // Báo Cartesia không còn text mới.
        await cartesia.context.no_more_inputs();

        // Chờ Cartesia gửi hết audio.
        await receiveAudioTask;

        cartesiaSocket.close();

        sendJson(ws, {
          type: "stream_end",
          requestId,
          reply: result.reply,
          products: result.products,
          history: result.history,
        });
      } catch (error) {
        console.error(
          "Voice WebSocket stream error:",
          error?.stack || error
        );

        if (cartesiaSocket) {
          cartesiaSocket.close();
        }

        sendJson(ws, {
          type: "stream_error",
          message: error?.message || "Không thể xử lý streaming AI.",
        });
      }
    });

    ws.on("close", () => {
      console.log("Voice WebSocket: client đã ngắt kết nối");
    });

    ws.on("error", (error) => {
      console.error("Voice WebSocket error:", error.message);
    });
  });

  return wss;
}

module.exports = { setupVoiceGateway };