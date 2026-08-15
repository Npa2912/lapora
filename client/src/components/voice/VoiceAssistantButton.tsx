import { useEffect, useRef, useState } from "react";
import { Bot, Mic, MicOff } from "lucide-react";
import { MicVAD } from "@ricky0123/vad-web";
import { setAiRecommendations } from "../../store/aiRecommendationStore";

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
  const consultAbortRef = useRef<AbortController | null>(null);

  const isListeningRef = useRef(false);
  const turnIdRef = useRef(0);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const voiceSocketRef = useRef<WebSocket | null>(null);
  const activeStreamRequestIdRef = useRef<string | null>(null);

  // Audio PCM streaming do Cartesia trả về.
  const streamAudioContextRef = useRef<AudioContext | null>(null);
  const nextAudioStartTimeRef = useRef(0);
  const streamAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const stopStreamingAiAudio = () => {
    streamAudioSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Audio source đã phát xong.
      }
    });

    streamAudioSourcesRef.current = [];
    nextAudioStartTimeRef.current = 0;
  };

  const playPcmChunk = async (
    base64Audio: string,
    sampleRate = 44100
  ) => {
    let audioContext = streamAudioContextRef.current;

    if (!audioContext) {
      audioContext = new AudioContext({ sampleRate });
      streamAudioContextRef.current = audioContext;
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const pcmSamples = new Float32Array(bytes.buffer);

    if (!pcmSamples.length) {
      return;
    }

    const audioBuffer = audioContext.createBuffer(
      1,
      pcmSamples.length,
      sampleRate
    );

    audioBuffer.copyToChannel(pcmSamples, 0);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    // Xếp audio chunk nối tiếp nhau, tránh tiếng nói bị giật.
    const startAt = Math.max(
      audioContext.currentTime + 0.05,
      nextAudioStartTimeRef.current
    );

    source.start(startAt);

    nextAudioStartTimeRef.current = startAt + audioBuffer.duration;
    streamAudioSourcesRef.current.push(source);

    source.onended = () => {
      streamAudioSourcesRef.current =
        streamAudioSourcesRef.current.filter((item) => item !== source);
    };
  };

  const stopAiVoice = () => {
    stopStreamingAiAudio();
  };

  const connectVoiceSocket = () => {
    return new Promise<void>((resolve, reject) => {
      const currentSocket = voiceSocketRef.current;

      if (currentSocket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (currentSocket?.readyState === WebSocket.CONNECTING) {
        currentSocket.addEventListener("open", () => resolve(), {
          once: true,
        });

        currentSocket.addEventListener(
          "error",
          () => reject(new Error("Không thể kết nối Voice WebSocket.")),
          { once: true }
        );

        return;
      }

      const ws = new WebSocket("ws://localhost:5000/ws/voice");

      ws.onopen = () => {
        console.log("Voice WebSocket: đã kết nối");
        ws.send(JSON.stringify({ type: "ping" }));
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          console.log("Voice WebSocket nhận:", data);

          // Bỏ audio thuộc câu cũ khi người dùng đã chen ngang.
          if (
            data.requestId &&
            data.requestId !== activeStreamRequestIdRef.current
          ) {
            return;
          }

          if (data.type === "audio_chunk") {
            void playPcmChunk(data.audio, data.sampleRate);
            return;
          }

          if (data.type === "stream_start") {
            setStatus("AI đang trả lời...");
            return;
          }

          if (data.type === "stream_end") {
            if (data.history) {
              historyRef.current = data.history;
            }

            if (data.products?.length) {
              setAiRecommendations(data.products);

              if (!window.location.pathname.startsWith("/products")) {
                window.history.pushState({}, "", "/products?source=ai");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }
            }

            console.log("AI trả lời xong:", data.reply);
            console.log("Sản phẩm AI chọn:", data.products);

            setStatus("Trợ lý đang chờ bạn nói...");
            return;
          }

          if (data.type === "stream_error") {
            console.error("Streaming AI lỗi:", data.message);
            setStatus("Streaming AI gặp lỗi. Bạn hãy nói lại.");
          }
        } catch {
          console.log("Voice WebSocket nhận raw:", event.data);
        }
      };

      ws.onerror = (error) => {
        console.error("Voice WebSocket lỗi:", error);
        reject(new Error("Không thể kết nối Voice WebSocket."));
      };

      ws.onclose = () => {
        console.log("Voice WebSocket: đã đóng");
        voiceSocketRef.current = null;
      };

      voiceSocketRef.current = ws;
    });
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

      setStatus("Đang nghe và chuyển giọng nói thành chữ...");

      consultAbortRef.current?.abort();

      const controller = new AbortController();
      consultAbortRef.current = controller;

      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-message.wav");
      

      // Chỉ gọi Whisper để lấy transcript.
      const response = await fetch(`${API_URL}/api/voice/transcribe`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể chuyển giọng nói thành chữ.");
      }

      if (!isListeningRef.current || turnId !== turnIdRef.current) {
        return;
      }

      const transcript = data.text?.trim() || "";

      if (transcript.length < 2) {
        console.log("Whisper không nghe được nội dung đủ rõ");
        setStatus("Em chưa nghe rõ. Bạn nói lại giúp em nhé.");
        return;
      }

      console.log("Bạn nói:", transcript);

      const socket = voiceSocketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error("Kết nối streaming AI chưa sẵn sàng.");
      }

      const requestId = crypto.randomUUID();

      // Từ thời điểm này chỉ phát audio của câu hỏi mới.
      activeStreamRequestIdRef.current = requestId;

      socket.send(
        JSON.stringify({
          type: "ai_stream",
          requestId,
          message: transcript,
          history: historyRef.current,
        })
      );

      setStatus("AI đang trả lời...");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }

      console.error("Voice transcription/stream error:", error);

      if (isListeningRef.current) {
        setStatus("Có lỗi xảy ra. Bạn nói lại giúp em nhé.");
      }
    }
  };

  const stopAssistant = () => {
    isListeningRef.current = false;
    turnIdRef.current += 1;
    activeStreamRequestIdRef.current = null;

    consultAbortRef.current?.abort();
    consultAbortRef.current = null;

    stopAiVoice();

    vadRef.current?.pause();
    vadRef.current = null;

    voiceSocketRef.current?.close();
    voiceSocketRef.current = null;

    setIsListening(false);
    setIsUserSpeaking(false);
    setStatus("Bấm robot để bắt đầu tư vấn");
  };

  const startAssistant = async () => {
    try {
      setStatus("Đang kết nối trợ lý AI...");
      await connectVoiceSocket();

      isListeningRef.current = true;
      setIsListening(true);
      setStatus("Đang khởi động microphone...");

      const vad = await MicVAD.new({
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

        positiveSpeechThreshold: 0.17,
        negativeSpeechThreshold: 0.1,
        minSpeechMs: 70,
        redemptionMs: 2200,
        preSpeechPadMs: 1000,

        onSpeechRealStart: () => {
          if (!isListeningRef.current) {
            return;
          }

          console.log("Silero: xác nhận người dùng đang nói");

          turnIdRef.current += 1;

          // Hủy Whisper đang chờ, không phát câu AI cũ nữa.
          consultAbortRef.current?.abort();
          activeStreamRequestIdRef.current = null;
          stopAiVoice();

          setIsUserSpeaking(true);
          setStatus("Đang nghe bạn...");
        },

        onSpeechEnd: async (audio) => {
          if (!isListeningRef.current) {
            return;
          }

          const currentTurnId = turnIdRef.current;

          console.log("Silero: kết thúc câu nói", {
            durationSeconds: (audio.length / 16000).toFixed(2),
          });

          setIsUserSpeaking(false);
          setStatus("Đang gửi yêu cầu đến AI...");

          await sendAudioToAI(audio, currentTurnId);
        },

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
      console.error("Không thể khởi tạo trợ lý giọng nói:", error);

      isListeningRef.current = false;
      setIsListening(false);
      setStatus("Không thể mở trợ lý. Kiểm tra server và quyền micro.");
    }
  };

  const toggleAssistant = () => {
    if (isListeningRef.current) {
      stopAssistant();
      return;
    }

    void startAssistant();
  };

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      vadRef.current?.pause();
      consultAbortRef.current?.abort();
      stopAiVoice();
      voiceSocketRef.current?.close();

      streamAudioContextRef.current?.close();
      streamAudioContextRef.current = null;
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