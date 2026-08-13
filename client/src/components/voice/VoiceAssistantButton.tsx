import { useEffect, useRef, useState } from "react";
import { Bot, Mic, MicOff } from "lucide-react";

const API_URL = "http://localhost:5000";

export default function VoiceAssistantButton() {
  const [isListening, setIsListening] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [status, setStatus] = useState("Bấm robot để bắt đầu tư vấn");

  const streamRef = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const aiAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVoiceTimeRef = useRef(0);
  const isListeningRef = useRef(false);
  const isUserSpeakingRef = useRef(false);
  const turnIdRef = useRef(0);

  const stopAiVoice = () => {
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;

    if (aiAudioRef.current) {
      aiAudioRef.current.pause();
      aiAudioRef.current.currentTime = 0;
      aiAudioRef.current = null;
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Không thể tạo giọng nói AI.");
      }

      // Nếu bạn đã nói câu mới khi Cartesia đang xử lý thì bỏ audio cũ.
      if (turnId !== turnIdRef.current || !isListeningRef.current) {
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      aiAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);

        if (isListeningRef.current && turnId === turnIdRef.current) {
          setStatus("Trợ lý đang chờ bạn nói...");
        }
      };

      await audio.play();
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Cartesia playback error:", error);
        setStatus("Không thể phát giọng AI. Bạn vẫn có thể nói tiếp.");
      }
    }
  };

  const sendAudioToAI = async (audioBlob: Blob, turnId: number) => {
    if (!audioBlob.size) return;

    try {
      setStatus("AI đang suy nghĩ...");

      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-message.webm");

      const response = await fetch(`${API_URL}/api/voice/consult`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi giọng nói đến AI.");
      }

      // Nếu đây là câu cũ thì không cho nó trả lời đè lên câu mới.
      if (turnId !== turnIdRef.current || !isListeningRef.current) {
        return;
      }

      console.log("Bạn nói:", data.transcript);
      console.log("AI trả lời:", data.reply);
      console.log("Sản phẩm:", data.products);

      if (data.reply) {
        await speakAiReply(data.reply, turnId);
      }
    } catch (error) {
      console.error("Voice AI error:", error);

      if (isListeningRef.current) {
        setStatus("Có lỗi xảy ra. Hãy thử nói lại.");
      }
    }
  };

  const startRecording = () => {
    const stream = streamRef.current;

    if (!stream || mediaRecorderRef.current?.state === "recording") {
      return;
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });

    const audioChunks: Blob[] = [];
    const currentTurnId = turnIdRef.current;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      console.log("Audio gửi đi:", {
  size: audioBlob.size,
  seconds: (audioBlob.size / 16000).toFixed(1),
});

const debugUrl = URL.createObjectURL(audioBlob);
const debugAudio = new Audio(debugUrl);
debugAudio.play();

      if (audioBlob.size > 1000) {
        sendAudioToAI(audioBlob, currentTurnId);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setStatus("Đang nghe bạn...");
  };

  const stopRecordingAndSend = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "recording") {
      recorder.stop();
    }
  };

  const stopAssistant = () => {
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    audioContextRef.current?.close();
    audioContextRef.current = null;
    animationFrameRef.current = null;

    // Không gửi tiếp audio khi người dùng chủ động tắt robot.
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    
    stopAiVoice();

    streamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;
    isListeningRef.current = false;
    isUserSpeakingRef.current = false;

    setIsListening(false);
    setIsUserSpeaking(false);
    setStatus("Bấm robot để bắt đầu tư vấn");
  };


  const startVoiceDetection = (stream: MediaStream) => {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);

  analyser.fftSize = 1024;
  source.connect(analyser);

  audioContextRef.current = audioContext;

  const data = new Uint8Array(analyser.fftSize);

  // Nhiễu nền của bạn khoảng 0.02, nên đặt cao hơn.
  const voiceThreshold = 0.010;
  const minVoiceDuration = 200;
  const silenceDuration = 900;

  let voiceStartedAt = 0;

  const detectVoice = () => {
    if (!isListeningRef.current) return;

    analyser.getByteTimeDomainData(data);

    let total = 0;

    for (const value of data) {
      total += Math.abs(value - 128);
    }

    const volume = total / data.length / 128;
    const now = Date.now();

    if (volume > voiceThreshold) {
      lastVoiceTimeRef.current = now;

      if (!voiceStartedAt) {
        voiceStartedAt = now;
      }

      const hasSpokenLongEnough = now - voiceStartedAt >= minVoiceDuration;

      if (!isUserSpeakingRef.current && hasSpokenLongEnough) {
        console.log("Mic: phát hiện bắt đầu nói", { volume });

        isUserSpeakingRef.current = true;
        turnIdRef.current += 1;

        // Dừng giọng AI nếu khách bắt đầu chen ngang.
        stopAiVoice();

        setIsUserSpeaking(true);
        startRecording();
      }
    } else {
      // Nhiễu ngắn không đủ 250ms sẽ không được tính là câu nói.
      if (!isUserSpeakingRef.current) {
        voiceStartedAt = 0;
      }
    }

    if (
      isUserSpeakingRef.current &&
      now - lastVoiceTimeRef.current > silenceDuration
    ) {
      console.log("Mic: phát hiện kết thúc nói", { volume });

      voiceStartedAt = 0;
      isUserSpeakingRef.current = false;
      setIsUserSpeaking(false);
      setStatus("Đang gửi yêu cầu đến AI...");
      stopRecordingAndSend();
    }

    animationFrameRef.current = requestAnimationFrame(detectVoice);
  };

  detectVoice();
};

const toggleAssistant = async () => {
  if (isListeningRef.current) {
    stopAssistant();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    streamRef.current = stream;
    isListeningRef.current = true;

    setIsListening(true);
    setStatus("Trợ lý đang chờ bạn nói...");

    startVoiceDetection(stream);
  } catch (error) {
    console.error("Không thể mở microphone:", error);
    alert("Bạn cần cho phép website sử dụng microphone.");
  }
};

  useEffect(() => {
    return () => stopAssistant();
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