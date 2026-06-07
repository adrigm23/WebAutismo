"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Edit3,
  FileText,
  GraduationCap,
  Hash,
  Paperclip,
  Phone,
  Send,
  Smile,
  User,
  Video,
  MoreVertical,
  Search,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  type: "received" | "sent";
  senderName: string;
  senderInitials: string;
  content: string;
  time: string;
  dateGroup: string;
  attachment?: { name: string; size: string };
};

type Channel = {
  id: string;
  kind: "channel";
  name: string;
  unread: number;
};

type DirectMessage = {
  id: string;
  kind: "dm";
  name: string;
  initials: string;
  role: string;
  department: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  isOnline: boolean;
};

type Conversation = Channel | DirectMessage;

// ─── helpers ─────────────────────────────────────────────────────────────────

function nowTime() {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(date: Date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function getInitialsLocal(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Avatar({
  initials,
  size = "md",
  online = false,
}: {
  initials: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
}) {
  const sizes = {
    sm: "h-8 w-8 text-[0.6rem]",
    md: "h-9 w-9 text-xs",
    lg: "h-10 w-10 text-sm",
    xl: "h-16 w-16 text-lg",
  };
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-[var(--color-primary)] font-bold text-white",
          sizes[size],
        )}
      >
        {initials}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="rounded-full bg-[#e5e7eb] px-3 py-1 text-[0.72rem] font-medium text-[#6b7280]">
        {label}
      </span>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isSent = msg.type === "sent";

  return (
    <div className={cn("flex items-end gap-2.5", isSent ? "flex-row-reverse" : "flex-row")}>
      <Avatar initials={msg.senderInitials} size="md" />

      <div className={cn("flex max-w-[72%] flex-col gap-1.5", isSent ? "items-end" : "items-start")}>
        <div
          className={cn(
            "flex items-baseline gap-2 text-xs text-[#9ba3af]",
            isSent ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="font-medium">{isSent ? "Tú" : msg.senderName}</span>
          <span>{msg.time}</span>
        </div>

        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm leading-relaxed",
            isSent
              ? "rounded-tr-sm bg-[var(--color-primary)] text-white"
              : "rounded-tl-sm border border-[#e5e7eb] bg-white text-[var(--color-primary)]",
          )}
        >
          {msg.content}
        </div>

        {msg.attachment && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white p-3.5",
              isSent ? "rounded-tr-sm" : "rounded-tl-sm",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">{msg.attachment.name}</p>
              <p className="text-xs text-[#9ba3af]">{msg.attachment.size}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export type MessagingPageProps = {
  channels: Array<{ id: string; name: string }>;
  contacts: Array<{ id: string; name: string; initials: string; role: string }>;
  viewerId: string;
  viewerName: string;
  viewerInitials: string;
};

export function MessagingPage({
  channels,
  contacts,
  viewerName,
  viewerInitials,
}: MessagingPageProps) {
  const allChannels: Channel[] = channels.map((c) => ({
    id: c.id,
    kind: "channel" as const,
    name: c.name,
    unread: 0,
  }));

  const allDMs: DirectMessage[] = contacts.map((c) => ({
    id: c.id,
    kind: "dm" as const,
    name: c.name,
    initials: c.initials,
    role: c.role,
    department: "Campus Autismo",
    lastMessage: "",
    lastTime: "",
    unread: 0,
    isOnline: false,
  }));

  const [conversations, setConversations] = useState<Conversation[]>([
    ...allChannels,
    ...allDMs,
  ]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [active, setActive] = useState<Conversation | null>(
    allDMs[0] ?? allChannels[0] ?? null
  );
  const [draftText, setDraftText] = useState("");
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation metadata on mount
  useEffect(() => {
    fetch("/api/messages/conversations")
      .then((r) => r.json())
      .then(
        (
          convs: Array<{
            partnerId: string;
            lastMessage: string;
            lastTime: string;
            unreadCount: number;
          }>
        ) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.kind === "dm") {
                const conv = convs.find((cv) => cv.partnerId === c.id);
                if (conv) {
                  return {
                    ...c,
                    lastMessage: conv.lastMessage,
                    lastTime: new Date(conv.lastTime).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    unread: conv.unreadCount,
                  };
                }
              }
              return c;
            })
          );
        }
      )
      .catch(() => {});
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, active]);

  // Load messages when active DM changes
  useEffect(() => {
    if (!active || active.kind !== "dm") return;
    setLoadingMessages(true);
    fetch(`/api/messages/${active.id}`)
      .then((r) => r.json())
      .then(
        (
          msgs: Array<{
            id: string;
            body: string;
            createdAt: string;
            isMine: boolean;
            senderName: string;
          }>
        ) => {
          const mapped: Message[] = msgs.map((m) => ({
            id: m.id,
            type: m.isMine ? ("sent" as const) : ("received" as const),
            senderName: m.isMine ? viewerName : m.senderName,
            senderInitials: m.isMine ? viewerInitials : getInitialsLocal(m.senderName),
            content: m.body,
            time: new Date(m.createdAt).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            dateGroup: isToday(new Date(m.createdAt))
              ? "Hoy"
              : new Date(m.createdAt).toLocaleDateString("es-ES"),
          }));
          setMessages((prev) => ({ ...prev, [active.id]: mapped }));
        }
      )
      .catch(() => {})
      .finally(() => setLoadingMessages(false));
  }, [active?.id, active?.kind, viewerName, viewerInitials]);

  // Polling — reload messages every 10 seconds for active DM
  useEffect(() => {
    if (!active || active.kind !== "dm") return;
    const interval = setInterval(() => {
      fetch(`/api/messages/${active.id}`)
        .then((r) => r.json())
        .then(
          (
            msgs: Array<{
              id: string;
              body: string;
              createdAt: string;
              isMine: boolean;
              senderName: string;
            }>
          ) => {
            const mapped: Message[] = msgs.map((m) => ({
              id: m.id,
              type: m.isMine ? ("sent" as const) : ("received" as const),
              senderName: m.isMine ? viewerName : m.senderName,
              senderInitials: m.isMine
                ? viewerInitials
                : getInitialsLocal(m.senderName),
              content: m.body,
              time: new Date(m.createdAt).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              dateGroup: isToday(new Date(m.createdAt))
                ? "Hoy"
                : new Date(m.createdAt).toLocaleDateString("es-ES"),
            }));
            setMessages((prev) => ({ ...prev, [active.id]: mapped }));
          }
        )
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [active?.id, active?.kind, viewerName, viewerInitials]);

  function selectConversation(conv: Conversation) {
    if (conv.kind === "channel") {
      window.location.assign(`/mis-cursos/${conv.id}/foro`);
      return;
    }
    setActive(conv);
  }

  async function handleSend() {
    if (!draftText.trim() || !active || active.kind !== "dm" || sending) return;
    const body = draftText.trim();
    setDraftText("");
    setSending(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      type: "sent",
      senderName: viewerName,
      senderInitials: viewerInitials,
      content: body,
      time: nowTime(),
      dateGroup: "Hoy",
    };
    setMessages((prev) => ({
      ...prev,
      [active.id]: [...(prev[active.id] ?? []), tempMsg],
    }));

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: active.id, body }),
      });
      if (!res.ok) throw new Error("Failed");
      // Reload to get server-confirmed message
      const msgs = await fetch(`/api/messages/${active.id}`).then((r) => r.json());
      const mapped: Message[] = (
        msgs as Array<{
          id: string;
          body: string;
          createdAt: string;
          isMine: boolean;
          senderName: string;
        }>
      ).map((m) => ({
        id: m.id,
        type: m.isMine ? ("sent" as const) : ("received" as const),
        senderName: m.isMine ? viewerName : m.senderName,
        senderInitials: m.isMine ? viewerInitials : getInitialsLocal(m.senderName),
        content: m.body,
        time: new Date(m.createdAt).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        dateGroup: isToday(new Date(m.createdAt))
          ? "Hoy"
          : new Date(m.createdAt).toLocaleDateString("es-ES"),
      }));
      setMessages((prev) => ({ ...prev, [active.id]: mapped }));
    } catch {
      // Revert optimistic on failure
      setMessages((prev) => ({
        ...prev,
        [active.id]: (prev[active.id] ?? []).filter((m) => m.id !== tempId),
      }));
      setDraftText(body);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const channelList = conversations.filter(
    (c): c is Channel => c.kind === "channel"
  );
  const dmList = conversations.filter(
    (c): c is DirectMessage => c.kind === "dm"
  );

  const filteredChannels = search
    ? channelList.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : channelList;
  const filteredDms = search
    ? dmList.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : dmList;

  // Mobile: 'list' shows conversations, 'chat' shows active conversation
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  function selectConversationMobile(conv: Conversation) {
    selectConversation(conv);
    setMobileView("chat");
  }

  const currentMessages = active ? (messages[active.id] ?? []) : [];

  // Group messages by dateGroup
  const groupedMessages: Array<{ date: string; messages: Message[] }> = [];
  for (const msg of currentMessages) {
    const last = groupedMessages.at(-1);
    if (last && last.date === msg.dateGroup) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date: msg.dateGroup, messages: [msg] });
    }
  }

  // Recent shared files in current conversation
  const sharedFiles = currentMessages
    .filter((m) => m.attachment)
    .map((m) => ({ ...m.attachment!, time: m.time }));

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-white">
      {/* ── LEFT: Conversations sidebar ─────────────────────────────── */}
      {/* Mobile: full screen when mobileView==='list', hidden when 'chat' */}
      <aside className={[
        "flex shrink-0 flex-col border-r border-[#e5e7eb]",
        // Desktop: fixed width sidebar always visible
        "md:flex md:w-72",
        // Mobile: full width, hidden when chat is active
        mobileView === "list" ? "flex w-full" : "hidden",
      ].join(" ")}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-lg font-bold text-[var(--color-primary)]">Mensajes</h1>
          <div className="flex items-center gap-1">
            <Link
              href="/mis-cursos"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[var(--color-primary)]"
              title="Volver al campus"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[var(--color-primary)]"
              type="button"
              title="Nueva conversación"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#f3f4f6] px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#9ba3af]" />
            <input
              className="flex-1 bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[#9ba3af] focus:outline-none"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversaciones..."
              type="text"
              value={search}
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto">
          {/* Channels */}
          {filteredChannels.length > 0 && (
            <div className="mb-1">
              <button
                className="flex w-full items-center justify-between px-4 py-2 text-left"
                onClick={() => setChannelsOpen((v) => !v)}
                type="button"
              >
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9ba3af]">
                  Canales
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-[#9ba3af] transition-transform",
                    !channelsOpen && "-rotate-90",
                  )}
                />
              </button>

              {channelsOpen && (
                <div className="space-y-0.5 px-2">
                  {filteredChannels.map((ch) => (
                    <button
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition",
                        active?.id === ch.id
                          ? "bg-[var(--color-primary)] text-white"
                          : "text-[#4b5563] hover:bg-[#f3f4f6]",
                      )}
                      key={ch.id}
                      onClick={() => selectConversationMobile(ch)}
                      type="button"
                    >
                      {ch.name.startsWith("Curso") ? (
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Hash className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="flex-1 truncate">{ch.name}</span>
                      {ch.unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[0.6rem] font-bold text-white">
                          {ch.unread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Direct messages */}
          {filteredDms.length > 0 && (
            <div>
              <button
                className="flex w-full items-center justify-between px-4 py-2 text-left"
                onClick={() => setDmsOpen((v) => !v)}
                type="button"
              >
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9ba3af]">
                  Mensajes Directos
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-[#9ba3af] transition-transform",
                    !dmsOpen && "-rotate-90",
                  )}
                />
              </button>

              {dmsOpen && (
                <div className="space-y-0.5 px-2">
                  {filteredDms.map((dm) => (
                    <button
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                        active?.id === dm.id
                          ? "bg-[var(--color-primary)]"
                          : "hover:bg-[#f3f4f6]",
                      )}
                      key={dm.id}
                      onClick={() => selectConversationMobile(dm)}
                      type="button"
                    >
                      <Avatar initials={dm.initials} online={dm.isOnline} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "text-sm font-semibold truncate",
                              active?.id === dm.id ? "text-white" : "text-[var(--color-primary)]",
                            )}
                          >
                            {dm.name}
                          </span>
                          {dm.lastTime && (
                            <span
                              className={cn(
                                "shrink-0 text-[0.65rem]",
                                active?.id === dm.id ? "text-white/60" : "text-[#9ba3af]",
                              )}
                            >
                              {dm.lastTime}
                            </span>
                          )}
                        </div>
                        {dm.lastMessage && (
                          <p
                            className={cn(
                              "truncate text-xs",
                              active?.id === dm.id ? "text-white/60" : "text-[#9ba3af]",
                            )}
                          >
                            {dm.lastMessage}
                          </p>
                        )}
                      </div>
                      {dm.unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[0.6rem] font-bold text-white">
                          {dm.unread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── CENTER: Chat area ────────────────────────────────────────── */}
      {/* Mobile: full screen when mobileView==='chat', hidden when 'list' */}
      <div className={[
        "flex min-w-0 flex-col bg-[#f7f4ef]",
        "md:flex md:flex-1",
        mobileView === "chat" ? "flex flex-1" : "hidden",
      ].join(" ")}>
        {/* Chat header */}
        {active ? (
          <header className="flex h-[3.75rem] shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-3 sm:px-5">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back button — mobile only */}
              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[var(--color-primary)] md:hidden"
                onClick={() => setMobileView("list")}
                type="button"
                aria-label="Volver a conversaciones"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {active.kind === "dm" ? (
                <Avatar initials={active.initials} online={active.isOnline} size="lg" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)]">
                  <Hash className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--color-primary)]">{active.name}</p>
                {active.kind === "dm" && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {active.isOnline ? "Activa ahora" : "Desconectada"}
                  </p>
                )}
                {active.kind === "channel" && (
                  <p className="text-xs text-[#9ba3af]">Canal del curso</p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {[Phone, Video, MoreVertical].map((Icon, i) => (
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[var(--color-primary)]"
                  key={i}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </header>
        ) : null}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-[#9ba3af]">Cargando mensajes...</p>
            </div>
          ) : currentMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-[#9ba3af]">
                {active?.kind === "channel"
                  ? "Sé el primero en escribir en este canal."
                  : "Inicia la conversación enviando un mensaje."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  <DateSeparator label={group.date} />
                  <div className="space-y-4">
                    {group.messages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-[#e5e7eb] bg-white px-5 py-4">
          <div className="rounded-xl border border-[#e5e7eb] bg-white">
            <textarea
              className="w-full resize-none rounded-t-2xl px-4 pt-3.5 text-sm text-[var(--color-primary)] placeholder:text-[#9ba3af] focus:outline-none"
              onKeyDown={handleKeyDown}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Escribe un mensaje..."
              ref={textareaRef}
              rows={2}
              value={draftText}
            />
            <div className="flex items-center justify-between border-t border-[#f0f0f0] px-4 py-2.5">
              <div className="flex items-center gap-1">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[var(--color-primary)]"
                  type="button"
                  title="Adjuntar archivo"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[var(--color-primary)]"
                  type="button"
                  title="Emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
              </div>
              <button
                className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                disabled={!draftText.trim() || sending}
                onClick={() => void handleSend()}
                type="button"
              >
                Enviar
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Profile / info panel ─────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 flex-col border-l border-[#e5e7eb] xl:flex">
        {active?.kind === "dm" ? (
          <>
            {/* Profile */}
            <div className="flex flex-col items-center border-b border-[#e5e7eb] px-5 py-6 text-center">
              <Avatar initials={active.initials} size="xl" />
              <h2 className="mt-3 text-base font-bold text-[var(--color-primary)]">{active.name}</h2>
              <span className="mt-1.5 rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
                {active.role}
              </span>
              <p className="mt-2 text-xs text-[#9ba3af]">{active.department}</p>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] py-2 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#f3f4f6]">
                <User className="h-3.5 w-3.5" />
                Ver Ficha Académica
              </button>
            </div>

            {/* Recent files */}
            {sharedFiles.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9ba3af]">
                  Archivos Recientes
                </p>
                <div className="mt-3 space-y-3">
                  {sharedFiles.map((file, i) => (
                    <div className="flex items-center gap-3" key={i}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
                        <FileText className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[var(--color-primary)]">{file.name}</p>
                        <p className="text-[0.65rem] text-[#9ba3af]">Hoy, {file.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : active?.kind === "channel" ? (
          <div className="px-5 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface)]">
              <Hash className="h-7 w-7 text-[var(--color-primary)]" />
            </div>
            <p className="mt-3 text-sm font-bold text-[var(--color-primary)]">{active.name}</p>
            <p className="mt-1 text-xs text-[#9ba3af]">Canal del curso</p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
