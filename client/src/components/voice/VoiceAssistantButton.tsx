import { useEffect, useRef, useState } from "react";
import { Bot, Mic, MicOff } from "lucide-react";
import { MicVAD } from "@ricky0123/vad-web";

const API_URL = "http://localhost:5000";

function float32ToWavBlob(
  samples: Float32Array,
  sampleRate = 16000
): Blob {
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  const writeText = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(
      44 + index * bytesPerSample,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true
    );
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export default function VoiceAssistantButton() {
  const [isListening, setIsListening] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [status, setStatus] = useState("Bấm robot để bắt đầu tư vấn");

  const vadRef = useRef<MicVAD | null>(null);
  const rawMicStreamRef = useRef<MediaStream | null>(null);
  const micAudioContextRef = useRef<AudioContext | null>(null);
  const aiAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const ttsAbortRef = useRef<AbortController | null>(null);
  const consultAbortRef = useRef<AbortController | null>(null);

  const isListeningRef = useRef(false);
  const turnIdRef = useRef(0);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const stopAiVoice = () => {
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;

    if (aiAudioRef.current) {
      aiAudioRef.current.pause();
      aiAudioRef.current.currentTime = 0;
      aiAudioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const speakAiReply = async (text: string, turnId: number) => {
    try {
      stopAiVoice();

      const controller = new AbortController();
      ttsAbortRef.current = controller;

      setStatus("AI đang trả lời...");

      const response = await fetch(`${API_URL}/api/voice/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Không thể tạo giọng nói AI.");
      }

      if (!isListeningRef.current || turnId !== turnIdRef.current) {
        return;
      }

      const audioBlob = await response.blob();

      if (!isListeningRef.current || turnId !== turnIdRef.current) {
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      aiAudioRef.current = audio;

      audio.onended = () => {
        if (audioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          audioUrlRef.current = null;
        }

        if (isListeningRef.current && turnId === turnIdRef.current) {
          setStatus("Trợ lý đang chờ bạn nói...");
        }
      };

      await audio.play();
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("TTS error:", error);

        if (isListeningRef.current) {
          setStatus("Không thể phát giọng AI. Bạn hãy nói tiếp.");
        }
      }
    }
  };

  const sendAudioToAI = async (
    audioSamples: Float32Array,
    turnId: number
  ) => {
    try {
      const audioBlob = float32ToWavBlob(audioSamples);

      if (audioBlob.size < 4000) {
        console.log("Bỏ qua audio quá ngắn");
        setStatus("Trợ lý đang chờ bạn nói...");
        return;
      }

      setStatus("AI đang suy nghĩ...");

      consultAbortRef.current?.abort();

      const controller = new AbortController();
      consultAbortRef.current = controller;

      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-message.wav");
      formData.append("history", JSON.stringify(historyRef.current));

      const response = await fetch(`${API_URL}/api/voice/consult`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi audio đến AI.");
      }

      if (!isListeningRef.current || turnId !== turnIdRef.current) {
        return;
      }

      // Backend đã xác định đây là tiếng nhiễu / transcript không liên quan.
      if (data.ignored) {
        console.log("AI bỏ qua audio nhiễu");
        setStatus("Trợ lý đang chờ bạn nói...");
        return;
      }

      console.log("Bạn nói:", data.transcript);
      console.log("AI trả lời:", data.reply);
      console.log("Sản phẩm:", data.products);

      if (data.history) {
        historyRef.current = data.history;
      }

      if (data.reply) {
        await speakAiReply(data.reply, turnId);
      } else {
        setStatus("Trợ lý đang chờ bạn nói...");
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }

      console.error("Voice consult error:", error);

      if (isListeningRef.current) {
        setStatus("Có lỗi xảy ra. Bạn nói lại giúp em nhé.");
      }
    }
  };

  const stopAssistant = () => {
    isListeningRef.current = false;
    turnIdRef.current += 1;

    consultAbortRef.current?.abort();
    consultAbortRef.current = null;

    stopAiVoice();

    vadRef.current?.pause();
    vadRef.current = null;

    setIsListening(false);
    setIsUserSpeaking(false);
    setStatus("Bấm robot để bắt đầu tư vấn");
  };

  const startAssistant = async () => {
    try {
      isListeningRef.current = true;
      setIsListening(true);
      setStatus("Đang khởi động microphone...");

      const vad = await MicVAD.new({
        // Dùng CDN để tránh lỗi Vite với ort-wasm-simd-threaded.mjs
        baseAssetPath:
          "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
        onnxWASMBasePath:
          "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",

        model: "v5",

        getStream: async () =>
          navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }),

        // Không quá nhạy như code đo volume cũ.
        positiveSpeechThreshold: 0.17,
        negativeSpeechThreshold: 0.1,

        minSpeechMs: 70,
        redemptionMs: 2200,
        preSpeechPadMs: 1000,

        // Chỉ khi Silero xác nhận là người thực sự nói
        // mới được cắt tiếng AI.
        onSpeechRealStart: () => {
          if (!isListeningRef.current) return;

          console.log("Silero: xác nhận người dùng đang nói");

          turnIdRef.current += 1;
          consultAbortRef.current?.abort();
          stopAiVoice();

          setIsUserSpeaking(true);
          setStatus("Đang nghe bạn...");
        },

        // Audio này đã bao gồm phần đầu câu nhờ preSpeechPadMs.
        onSpeechEnd: async (audio) => {
          if (!isListeningRef.current) return;

          const currentTurnId = turnIdRef.current;

          console.log("Silero: kết thúc câu nói", {
            durationSeconds: (audio.length / 16000).toFixed(2),
          });

          setIsUserSpeaking(false);
          setStatus("Đang gửi yêu cầu đến AI...");

          await sendAudioToAI(audio, currentTurnId);
        },

        // Tiếng động quá ngắn sẽ vào đây, không gửi Whisper,
        // không tắt tiếng AI.
        onVADMisfire: () => {
          console.log("Silero: bỏ qua tiếng động ngắn/nhiễu");

          if (isListeningRef.current) {
            setIsUserSpeaking(false);
            setStatus("Trợ lý đang chờ bạn nói...");
          }
        },
      });

      vadRef.current = vad;

      if (!isListeningRef.current) {
        vad.pause();
        return;
      }

      vad.start();
      setStatus("Trợ lý đang chờ bạn nói...");
    } catch (error) {
      console.error("Không thể khởi tạo Silero VAD:", error);

      isListeningRef.current = false;
      setIsListening(false);
      setStatus("Không thể mở microphone. Kiểm tra quyền micro.");
    }
  };

  const toggleAssistant = () => {
    if (isListeningRef.current) {
      stopAssistant();
      return;
    }

    startAssistant();
  };

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      vadRef.current?.pause();
      stopAiVoice();
      consultAbortRef.current?.abort();
    };
  }, []);

  return (
    <>
      {isListening && (
        <div className="fixed bottom-24 left-6 z-50 w-72 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          <p className="font-semibold">{status}</p>
        </div>
      )}

      <button
        type="button"
        onClick={toggleAssistant}
        title={isListening ? "Dừng trợ lý AI" : "Mở trợ lý AI"}
        className={`fixed bottom-6 left-6 z-50 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105 ${
          isListening
            ? "bg-red-500 shadow-red-300"
            : "bg-indigo-600 shadow-indigo-300"
        }`}
      >
        {isListening ? <MicOff size={27} /> : <Bot size={29} />}

        {isListening && isUserSpeaking && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-500">
            <Mic size={12} />
          </span>
        )}
      </button>
    </>
  );
}