import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { insforge } from "@/lib/insforge";
import { useInsForgeAuth } from "@/contexts/InsForgeAuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, LogOut, MessageSquarePlus, Trash2, X } from "lucide-react";

type ChatConversation = {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
};

type ChatMessage = {
    id: string;
    role: "user" | "assistant" | "system";
    content: string | null;
    image_url: string | null;
    image_key: string | null;
    created_at: string;
};

const AI_MODEL_ID = "openai/gpt-4o";
const CHAT_BUCKET = "chat-files";

export default function Chat(): JSX.Element {
    const { user, signOut } = useInsForgeAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState("");
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<string | null>(null);
    const [deleteConversationId, setDeleteConversationId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const conversationsQuery = useQuery({
        queryKey: ["chat", "conversations", user?.id],
        enabled: Boolean(user?.id),
        queryFn: async (): Promise<ChatConversation[]> => {
            const { data, error } = await insforge.database
                .from("chat_conversations")
                .select("id,title,created_at,updated_at")
                .order("updated_at", { ascending: false });

            if (error) {
                throw new Error((error as any)?.message || "Failed to load conversations");
            }

            return (data as ChatConversation[] | null) ?? [];
        },
    });

    const activeConversation = useMemo(() => {
        return (conversationsQuery.data || []).find((c) => c.id === activeConversationId) || null;
    }, [conversationsQuery.data, activeConversationId]);

    const messagesQuery = useQuery({
        queryKey: ["chat", "messages", activeConversationId],
        enabled: Boolean(user?.id && activeConversationId),
        queryFn: async (): Promise<ChatMessage[]> => {
            if (!activeConversationId) return [];

            const { data, error } = await insforge.database
                .from("chat_messages")
                .select("id,role,content,image_url,image_key,created_at")
                .eq("conversation_id", activeConversationId)
                .order("created_at", { ascending: true });

            if (error) {
                throw new Error((error as any)?.message || "Failed to load messages");
            }

            return (data as ChatMessage[] | null) ?? [];
        },
    });

    const createConversationMutation = useMutation({
        mutationFn: async (title?: string): Promise<ChatConversation> => {
            if (!user?.id) {
                throw new Error("Not authenticated");
            }

            const { data, error } = await insforge.database
                .from("chat_conversations")
                .insert([{ user_id: user.id, title: title || "New chat" }])
                .select("id,title,created_at,updated_at");

            if (error) {
                throw new Error((error as any)?.message || "Failed to create conversation");
            }

            const created = (data as ChatConversation[] | null)?.[0];
            if (!created) {
                throw new Error("Failed to create conversation");
            }

            return created;
        },
        onSuccess: async (created) => {
            setActiveConversationId(created.id);
            await queryClient.invalidateQueries({ queryKey: ["chat", "conversations", user?.id] });
        },
    });

    const clearMessagesMutation = useMutation({
        mutationFn: async (conversationId: string) => {
            const { data: msgRows } = await insforge.database
                .from("chat_messages")
                .select("image_key")
                .eq("conversation_id", conversationId);

            const keys = (msgRows as Array<{ image_key: string | null }> | null)
                ?.map((r) => r.image_key)
                .filter((k): k is string => Boolean(k));

            if (keys?.length) {
                await Promise.allSettled(keys.map((k) => insforge.storage.from(CHAT_BUCKET).remove(k)));
            }

            const { error } = await insforge.database.from("chat_messages").delete().eq("conversation_id", conversationId);
            if (error) {
                throw new Error((error as any)?.message || "Failed to clear messages");
            }

            await insforge.database
                .from("chat_conversations")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", conversationId);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["chat", "messages", activeConversationId] });
            await queryClient.invalidateQueries({ queryKey: ["chat", "conversations", user?.id] });
            toast({ title: "Cleared", description: "All messages cleared." });
        },
        onError: (e: any) => {
            toast({ title: "Error", description: e?.message || "Failed to clear messages", variant: "destructive" });
        },
    });

    const deleteConversationMutation = useMutation({
        mutationFn: async (conversationId: string) => {
            const { data: msgRows } = await insforge.database
                .from("chat_messages")
                .select("image_key")
                .eq("conversation_id", conversationId);

            const keys = (msgRows as Array<{ image_key: string | null }> | null)
                ?.map((r) => r.image_key)
                .filter((k): k is string => Boolean(k));

            if (keys?.length) {
                await Promise.allSettled(keys.map((k) => insforge.storage.from(CHAT_BUCKET).remove(k)));
            }

            const { error } = await insforge.database.from("chat_conversations").delete().eq("id", conversationId);
            if (error) {
                throw new Error((error as any)?.message || "Failed to delete conversation");
            }
        },
        onSuccess: async () => {
            if (deleteConversationId && deleteConversationId === activeConversationId) {
                setActiveConversationId(null);
            }
            setDeleteConversationId(null);
            await queryClient.invalidateQueries({ queryKey: ["chat", "conversations", user?.id] });
            toast({ title: "Deleted", description: "Conversation deleted." });
        },
        onError: (e: any) => {
            toast({ title: "Error", description: e?.message || "Failed to delete conversation", variant: "destructive" });
        },
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (payload: { conversationId: string; text: string; image?: File | null }) => {
            if (!user?.id) {
                throw new Error("Not authenticated");
            }

            const trimmed = payload.text.trim();
            if (!trimmed && !payload.image) {
                return;
            }

            let uploaded: { url: string; key: string } | null = null;
            if (payload.image) {
                const safeName = payload.image.name.replace(/[^a-zA-Z0-9_.-]/g, "-");
                const randomPart =
                    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                        ? crypto.randomUUID()
                        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
                const path = `users/${user.id}/conversations/${payload.conversationId}/${randomPart}-${safeName}`;
                const { data, error } = await insforge.storage.from(CHAT_BUCKET).upload(path, payload.image);
                if (error) {
                    throw new Error((error as any)?.message || "Failed to upload image");
                }
                if (!data?.url || !data?.key) {
                    throw new Error("Failed to upload image");
                }
                uploaded = { url: data.url, key: data.key };
            }

            const { data: insertedUserMsg, error: insertUserErr } = await insforge.database
                .from("chat_messages")
                .insert([
                    {
                        conversation_id: payload.conversationId,
                        user_id: user.id,
                        role: "user",
                        content: trimmed || null,
                        image_url: uploaded?.url || null,
                        image_key: uploaded?.key || null,
                    },
                ])
                .select("id,role,content,image_url,image_key,created_at");

            if (insertUserErr) {
                throw new Error((insertUserErr as any)?.message || "Failed to save message");
            }

            const currentMessages = (queryClient.getQueryData(["chat", "messages", payload.conversationId]) as ChatMessage[] | undefined) || [];
            const userMsgRow = (insertedUserMsg as ChatMessage[] | null)?.[0];
            const mergedMessages = [...currentMessages, ...(userMsgRow ? [userMsgRow] : [])];

            const aiMessages = mergedMessages
                .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
                .slice(-20)
                .map((m) => {
                    if (m.role === "user" && m.image_url) {
                        const parts: any[] = [];
                        if (m.content) {
                            parts.push({ type: "text", text: m.content });
                        }
                        parts.push({ type: "image_url", image_url: { url: m.image_url } });
                        return { role: m.role, content: parts };
                    }
                    return { role: m.role, content: m.content || "" };
                });

            const completion = await insforge.ai.chat.completions.create({
                model: AI_MODEL_ID,
                messages: aiMessages as any,
            });

            const assistantText = completion?.choices?.[0]?.message?.content;
            if (!assistantText) {
                throw new Error("AI returned an empty response");
            }

            const { error: insertAssistantErr } = await insforge.database.from("chat_messages").insert([
                {
                    conversation_id: payload.conversationId,
                    user_id: user.id,
                    role: "assistant",
                    content: assistantText,
                    image_url: null,
                    image_key: null,
                },
            ]);

            if (insertAssistantErr) {
                throw new Error((insertAssistantErr as any)?.message || "Failed to save assistant message");
            }

            const nowIso = new Date().toISOString();
            await insforge.database
                .from("chat_conversations")
                .update({ updated_at: nowIso })
                .eq("id", payload.conversationId);

            if (activeConversation?.title === "New chat" && trimmed) {
                await insforge.database
                    .from("chat_conversations")
                    .update({ title: trimmed.slice(0, 48) })
                    .eq("id", payload.conversationId);
            }
        },
        onSuccess: async () => {
            setMessageText("");
            setPendingImage(null);
            if (pendingImagePreviewUrl) {
                URL.revokeObjectURL(pendingImagePreviewUrl);
            }
            setPendingImagePreviewUrl(null);

            await queryClient.invalidateQueries({ queryKey: ["chat", "messages", activeConversationId] });
            await queryClient.invalidateQueries({ queryKey: ["chat", "conversations", user?.id] });
        },
        onError: (e: any) => {
            toast({ title: "Error", description: e?.message || "Failed to send message", variant: "destructive" });
        },
    });

    const handlePickImage = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (file: File | null) => {
        if (pendingImagePreviewUrl) {
            URL.revokeObjectURL(pendingImagePreviewUrl);
        }

        setPendingImage(file);
        if (file) {
            setPendingImagePreviewUrl(URL.createObjectURL(file));
        } else {
            setPendingImagePreviewUrl(null);
        }
    };

    const ensureConversation = async (): Promise<string> => {
        if (activeConversationId) return activeConversationId;
        const created = await createConversationMutation.mutateAsync(undefined);
        return created.id;
    };

    const handleSend = async () => {
        const conversationId = await ensureConversation();
        await sendMessageMutation.mutateAsync({
            conversationId,
            text: messageText,
            image: pendingImage,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">AI Chat</h1>
                        <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={async () => {
                                await signOut();
                                navigate("/login2", { replace: true });
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
                    <Card className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="font-semibold">Conversations</div>
                            <Button
                                size="sm"
                                onClick={() => createConversationMutation.mutateAsync(undefined)}
                                disabled={createConversationMutation.isPending}
                            >
                                <MessageSquarePlus className="mr-2 h-4 w-4" />
                                New
                            </Button>
                        </div>
                        <Separator className="my-3" />

                        <ScrollArea className="h-[520px]">
                            <div className="space-y-2 pr-3">
                                {(conversationsQuery.data || []).map((c) => (
                                    <button
                                        key={c.id}
                                        className={cn(
                                            "w-full text-left rounded-md border px-3 py-2 transition-colors",
                                            c.id === activeConversationId
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "hover:bg-accent"
                                        )}
                                        onClick={() => setActiveConversationId(c.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="font-medium truncate">{c.title}</div>
                                                <div className={cn("text-xs mt-0.5", c.id === activeConversationId ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                                    {new Date(c.updated_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <Button
                                                variant={c.id === activeConversationId ? "secondary" : "ghost"}
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setDeleteConversationId(c.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </button>
                                ))}

                                {!conversationsQuery.isLoading && (conversationsQuery.data || []).length === 0 && (
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                        No conversations yet.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>

                    <Card className="p-4 flex flex-col">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="font-semibold truncate">{activeConversation?.title || "Select a conversation"}</div>
                                <div className="text-xs text-muted-foreground">Model: {AI_MODEL_ID}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!activeConversationId || clearMessagesMutation.isPending}
                                    onClick={() => {
                                        if (activeConversationId) {
                                            clearMessagesMutation.mutate(activeConversationId);
                                        }
                                    }}
                                >
                                    Clear messages
                                </Button>
                            </div>
                        </div>

                        <Separator className="my-3" />

                        <ScrollArea className="flex-1 h-[520px] pr-3">
                            <div className="space-y-3">
                                {(messagesQuery.data || []).map((m) => (
                                    <div
                                        key={m.id}
                                        className={cn(
                                            "max-w-[92%] rounded-lg border px-3 py-2",
                                            m.role === "user" ? "ml-auto bg-primary text-primary-foreground border-primary" : "bg-muted"
                                        )}
                                    >
                                        {m.image_url && (
                                            <div className="mb-2">
                                                <img
                                                    src={m.image_url}
                                                    alt="Uploaded"
                                                    className="rounded-md max-h-72 object-contain border"
                                                />
                                            </div>
                                        )}
                                        {m.content && <div className="whitespace-pre-wrap text-sm">{m.content}</div>}
                                        <div className={cn("text-[10px] mt-2", m.role === "user" ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                            {m.role} • {new Date(m.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}

                                {!messagesQuery.isLoading && (messagesQuery.data || []).length === 0 && (
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                        No messages yet.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <Separator className="my-3" />

                        <div className="space-y-3">
                            {pendingImagePreviewUrl && (
                                <div className="flex items-center gap-3 rounded-md border p-2">
                                    <img src={pendingImagePreviewUrl} alt="Preview" className="h-16 w-16 rounded object-cover" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">{pendingImage?.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {(pendingImage?.size ? (pendingImage.size / 1024).toFixed(1) : "0")} KB
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleFileChange(null)}
                                        aria-label="Remove image"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            <Textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type your message…"
                                className="min-h-[90px]"
                                disabled={sendMessageMutation.isPending}
                            />

                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePickImage}
                                        disabled={sendMessageMutation.isPending}
                                    >
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Upload image
                                    </Button>
                                </div>

                                <Button
                                    onClick={handleSend}
                                    disabled={sendMessageMutation.isPending || (!messageText.trim() && !pendingImage)}
                                >
                                    {sendMessageMutation.isPending ? "Sending…" : "Send"}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Dialog open={Boolean(deleteConversationId)} onOpenChange={(open) => !open && setDeleteConversationId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete conversation?</DialogTitle>
                        <DialogDescription>
                            This will delete the conversation and all its messages.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteConversationId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteConversationId) {
                                    deleteConversationMutation.mutate(deleteConversationId);
                                }
                            }}
                            disabled={deleteConversationMutation.isPending}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
