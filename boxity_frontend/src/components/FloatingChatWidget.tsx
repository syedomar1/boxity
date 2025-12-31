import { useEffect, useMemo, useRef, useState } from "react";
import { insforge } from "@/lib/insforge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, X } from "lucide-react";

type ChatMsg = {
    role: "user" | "assistant";
    content: string;
};

const AI_MODEL_ID = "openai/gpt-4o";

export default function FloatingChatWidget(): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState<ChatMsg[]>([
        {
            role: "assistant",
            content: "Hi! Ask me anything about Boxity — batches, verification, or how to use the demo.",
        },
    ]);

    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [isOpen, messages.length]);

    const aiMessages = useMemo(() => {
        const base = [{ role: "system", content: "You are Boxity's helpful assistant." }];
        const rest = messages.map((m) => ({ role: m.role, content: m.content }));
        return [...base, ...rest];
    }, [messages]);

    const send = async () => {
        const text = input.trim();
        if (!text || isSending) return;

        setInput("");
        setIsSending(true);

        setMessages((prev) => [...prev, { role: "user", content: text }]);

        try {
            const completion = await insforge.ai.chat.completions.create({
                model: AI_MODEL_ID,
                messages: [...aiMessages, { role: "user", content: text }] as any,
            });

            const assistantText =
                (completion as any)?.choices?.[0]?.message?.content ||
                (completion as any)?.data?.choices?.[0]?.message?.content;

            if (!assistantText) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "I couldn't generate a reply right now. Please try again." },
                ]);
                return;
            }

            setMessages((prev) => [...prev, { role: "assistant", content: String(assistantText) }]);
        } catch (e: any) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: e?.message
                        ? `Sorry — I ran into an error: ${e.message}`
                        : "Sorry — I ran into an error. Please try again.",
                },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {isOpen && (
                <div className="fixed bottom-24 right-4 z-[60] w-[92vw] sm:w-96 max-w-[420px]">
                    <Card className="overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 backdrop-blur bg-white/90 dark:bg-slate-950/80">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
                            <div className="font-semibold">Boxity Assistant</div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div ref={scrollRef} className="max-h-[50vh] sm:max-h-[420px] overflow-y-auto px-4 py-3 space-y-3">
                            {messages.map((m, idx) => (
                                <div
                                    key={idx}
                                    className={
                                        m.role === "user"
                                            ? "flex justify-end"
                                            : "flex justify-start"
                                    }
                                >
                                    <div
                                        className={
                                            m.role === "user"
                                                ? "max-w-[85%] rounded-2xl px-3 py-2 bg-primary text-primary-foreground text-sm"
                                                : "max-w-[85%] rounded-2xl px-3 py-2 bg-slate-100 dark:bg-slate-900 text-sm"
                                        }
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60">
                            <div className="flex gap-2 items-end">
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="min-h-[44px] max-h-28"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            void send();
                                        }
                                    }}
                                />
                                <Button onClick={() => void send()} disabled={isSending || !input.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Press Enter to send, Shift+Enter for a new line.
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <Button
                onClick={() => setIsOpen((v) => !v)}
                className="fixed bottom-6 right-4 z-[60] h-14 w-14 rounded-full shadow-xl bg-gradient-to-r from-primary to-indigo-500 hover:opacity-95"
                size="icon"
                aria-label="Open chat"
            >
                <MessageCircle className="w-6 h-6" />
            </Button>
        </>
    );
}
