const NodeWebSocket = require("ws");

// Cartesia SDK cần WebSocket client khi chạy ở Node.js.
// Gán ws vào global trước khi import SDK Cartesia.
if (!globalThis.WebSocket) {
  globalThis.WebSocket = NodeWebSocket;
}

let cartesiaClientPromise;

async function getCartesiaClient() {
  if (!cartesiaClientPromise) {
    cartesiaClientPromise = import("@cartesia/cartesia-js").then(
      ({ default: Cartesia }) =>
        new Cartesia({
          apiKey: process.env.CARTESIA_API_KEY,
        })
    );
  }

  return cartesiaClientPromise;
}

async function createCartesiaStream() {
  if (!process.env.CARTESIA_API_KEY || !process.env.CARTESIA_VOICE_ID) {
    throw new Error(
      "Thiếu CARTESIA_API_KEY hoặc CARTESIA_VOICE_ID trong file .env"
    );
  }

  const client = await getCartesiaClient();

  const socket = await client.tts.websocket();

  const context = socket.context({
    model_id: "sonic-3.5",
    voice: {
      mode: "id",
      id: process.env.CARTESIA_VOICE_ID,
    },
    language: "vi",
    output_format: {
      container: "raw",
      encoding: "pcm_f32le",
      sample_rate: 44100,
    },
  });

  return { socket, context };
}

module.exports = { createCartesiaStream };