"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircleQuestion, Mic, MicOff, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { RichText } from "@/components/rich-text";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Is dairy bad for PMOS?",
  "Why am I always tired?",
  "What is a good breakfast for PMOS?",
  "Can PMOS go away?",
];

export function LearnChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestAssistantRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
  if (loading) {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }
}, [loading]);

useEffect(() => {
  if (!loading && messages.length > 0 && messages[messages.length - 1].role === "assistant") {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }
}, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMessage: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setMessages([...newMessages, {
          role: "assistant",
          content: data.content,
        }]);
      }
    } catch {
      setError("Couldn't reach MyPMOS. Try again?");
    } finally {
      setLoading(false);
    }
  }

  function toggleMic() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition isn't supported in your browser. Try Chrome or Safari.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="mt-4 rounded-3xl bg-candy p-5 shadow-girly-pop">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircleQuestion size={20} className="text-white" />
        <p className="font-cute text-lg font-bold text-white">Ask MyPMOS</p>
      </div>
      <p className="mt-0.5 text-sm font-semibold text-white/90">
        Answers grounded in peer-reviewed PMOS research. Not medical advice.
      </p>

      {/* Conversation history */}
      {messages.length > 0 && (
        <div ref={containerRef} className="mt-3 max-h-72 overflow-y-auto space-y-3 rounded-2xl bg-white/10 p-3">
          {messages.map((m, i) => {
  const isLatestAssistant = m.role === "assistant" && i === messages.length - 1;
  return (
    <div
      key={i}
      ref={isLatestAssistant ? latestAssistantRef : undefined}
      className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
    >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm font-medium leading-relaxed",
                  m.role === "user"
                    ? "bg-white text-g-pink-deep rounded-br-sm"
                    : "bg-white/20 text-white rounded-bl-sm"
                )}
              >
                {m.role === "assistant" ? (
                  <RichText text={m.content} />
                ) : (
                  m.content
                )}
              </div>
            </div>
  );
})}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/20 rounded-2xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          {error && (
            <p className="text-xs font-bold text-white/80">💔 {error}</p>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Suggestions — only show before first message */}
      {messages.length === 0 && !loading && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="shrink-0 rounded-full bg-white/25 px-3 py-1.5 text-xs font-bold text-white active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-2 py-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder={listening ? "Listening…" : "e.g. is dairy bad for PMOS?"}
          className="flex-1 bg-transparent px-3 py-1.5 text-base font-semibold text-g-ink outline-none placeholder:text-g-ink-3"
        />
        <button
          onClick={toggleMic}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full transition active:scale-90",
            listening ? "bg-red-100 text-red-500" : "bg-g-canvas text-g-ink-3"
          )}
          aria-label={listening ? "Stop listening" : "Use microphone"}
        >
          {listening ? <MicOff size={15} /> : <Mic size={15} />}
        </button>
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="grid h-8 w-8 place-items-center rounded-full bg-candy text-white disabled:opacity-40 active:scale-95 transition"
          aria-label="Send"
        >
          <Send size={14} />
        </button>
      </div>

      {/* Reset conversation */}
      {messages.length > 0 && (
        <button
          onClick={() => { setMessages([]); setError(null); }}
          className="mt-2 text-xs font-bold text-white/70 active:scale-95"
        >
          Start over
        </button>
      )}

      <p className="mt-2 text-[0.6rem] font-semibold text-white/60 text-center">
        General info only · MyPMOS never diagnoses · Always see your provider
      </p>
    </div>
  );
}
