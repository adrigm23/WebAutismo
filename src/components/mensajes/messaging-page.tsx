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

// ─── seed data ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "campus_messages_v1";

const SEED_CHANNELS: Channel[] = [
  { id: "ch-general", kind: "channel", name: "General - Neurodiversidad", unread: 0 },
  {
    id: "ch-intervencion",
    kind: "channel",
    name: "Curso Intervención Temprana",
    unread: 3,
  },
];

const SEED_DMS: DirectMessage[] = [
  {
    id: "dm-elena",
    kind: "dm",
    name: "Dra. Elena Ramos",
    initials: "ER",
    role: "Docente / Supervisora",
    department: "Dpto. de Intervención Temprana",
    lastMessage: "Revise el plan de adaptación...",
    lastTime: "10:42",
    unread: 0,
    isOnline: true,
  },
  {
    id: "dm-martin",
    kind: "dm",
    name: "Martín Castro",
    initials: "MC",
    role: "Alumno",
    department: "Curso Neurodiversidad",
    lastMessage: "¿Podrías enviarme el PDF de...",
    lastTime: "Ayer",
    unread: 0,
    isOnline: false,
  },
];

const SEED_MESSAGES: Record<string, Message[]> = {
  "dm-elena": [
    {
      id: "1",
      type: "received",
      senderName: "Dra. Elena Ramos",
      senderInitials: "ER",
      content:
        "Hola, revisé el plan de adaptación curricular para el nuevo grupo. Me parece excelente la forma en que estructuraste los módulos de reducción de carga sensorial.",
      time: "10:30",
      dateGroup: "Hoy",
    },
    {
      id: "2",
      type: "sent",
      senderName: "Tú",
      senderInitials: "TÚ",
      content:
        "¡Gracias Elena! Intenté mantener la estética limpia que discutimos. Adjunto el borrador final del PDF para que lo tengas a mano.",
      time: "10:35",
      dateGroup: "Hoy",
      attachment: { name: "Plan_Adaptacion_V2.pdf", size: "2.4 MB" },
    },
  ],
  "dm-martin": [],
  "ch-general": [],
  "ch-intervencion": [],
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function nowTime() {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadMessages(): Record<string, Message[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...SEED_MESSAGES, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...SEED_MESSAGES };
}

function saveMessages(map: Record<string, Message[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
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
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isSent
              ? "rounded-tr-sm bg-[#1e3a5f] text-white"
              : "rounded-tl-sm border border-[#e5e7eb] bg-white text-[#1a1f2e]",
          )}
        >
          {msg.content}
        </div>

        {msg.attachment && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-3.5",
              isSent ? "rounded-tr-sm" : "rounded-tl-sm",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a1f2e]">{msg.attachment.name}</p>
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
  viewerName: string;
  viewerInitials: string;
  extraChannels?: Array<{ id: string; name: string }>;
  extraContacts?: Array<{
    id: string;
    name: string;
    initials: string;
    role: string;
    department: string;
  }>;
};

export function MessagingPage({
  viewerName,
  viewerInitials,
  extraChannels = [],
  extraContacts = [],
}: MessagingPageProps) {
  const [selectedId, setSelectedId] = useState("dm-elena");
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setMessagesMap(loadMessages());
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, selectedId]);

  const channels: Channel[] = [
    ...SEED_CHANNELS,
    ...extraChannels.map(
      (c): Channel => ({
        id: `ch-extra-${c.id}`,
        kind: "channel",
        name: c.name,
        unread: 0,
      }),
    ),
  ];

  const dms: DirectMessage[] = [
    ...SEED_DMS,
    ...extraContacts.map(
      (c): DirectMessage => ({
        id: `dm-extra-${c.id}`,
        kind: "dm",
        name: c.name,
        initials: c.initials,
        role: c.role,
        department: c.department,
        lastMessage: "",
        lastTime: "",
        unread: 0,
        isOnline: false,
      }),
    ),
  ];

  const allConversations: Conversation[] = [...channels, ...dms];

  const selectedConversation = allConversations.find((c) => c.id === selectedId);
  const currentMessages = messagesMap[selectedId] ?? [];

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

  function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      type: "sent",
      senderName: viewerName,
      senderInitials: viewerInitials,
      content: text,
      time: nowTime(),
      dateGroup: "Hoy",
    };

    const updated = {
      ...messagesMap,
      [selectedId]: [...(messagesMap[selectedId] ?? []), newMsg],
    };

    setMessagesMap(updated);
    saveMessages(updated);
    setInput("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const filteredChannels = search
    ? channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : channels;
  const filteredDms = search
    ? dms.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : dms;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* ── LEFT: Conversations sidebar ─────────────────────────────── */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-[#e5e7eb]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-lg font-bold text-[#1a1f2e]">Mensajes</h1>
          <div className="flex items-center gap-1">
            <Link
              href="/mis-cursos"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[#1a1f2e]"
              title="Volver al campus"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[#1a1f2e]"
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
              className="flex-1 bg-transparent text-sm text-[#1a1f2e] placeholder:text-[#9ba3af] focus:outline-none"
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
                      selectedId === ch.id
                        ? "bg-[#1e3a5f] text-white"
                        : "text-[#4b5563] hover:bg-[#f3f4f6]",
                    )}
                    key={ch.id}
                    onClick={() => setSelectedId(ch.id)}
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

          {/* Direct messages */}
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
                      selectedId === dm.id
                        ? "bg-[#1e3a5f]"
                        : "hover:bg-[#f3f4f6]",
                    )}
                    key={dm.id}
                    onClick={() => setSelectedId(dm.id)}
                    type="button"
                  >
                    <Avatar initials={dm.initials} online={dm.isOnline} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-sm font-semibold truncate",
                            selectedId === dm.id ? "text-white" : "text-[#1a1f2e]",
                          )}
                        >
                          {dm.name}
                        </span>
                        {dm.lastTime && (
                          <span
                            className={cn(
                              "shrink-0 text-[0.65rem]",
                              selectedId === dm.id ? "text-white/60" : "text-[#9ba3af]",
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
                            selectedId === dm.id ? "text-white/60" : "text-[#9ba3af]",
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
        </div>
      </aside>

      {/* ── CENTER: Chat area ────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#f8f9fa]">
        {/* Chat header */}
        {selectedConversation ? (
          <header className="flex h-[3.75rem] shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-5">
            <div className="flex items-center gap-3">
              {selectedConversation.kind === "dm" ? (
                <Avatar
                  initials={selectedConversation.initials}
                  online={selectedConversation.isOnline}
                  size="lg"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)]">
                  <Hash className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-[#1a1f2e]">{selectedConversation.name}</p>
                {selectedConversation.kind === "dm" && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {selectedConversation.isOnline ? "Activa ahora" : "Desconectada"}
                  </p>
                )}
                {selectedConversation.kind === "channel" && (
                  <p className="text-xs text-[#9ba3af]">Canal del curso</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[Phone, Video, MoreVertical].map((Icon, i) => (
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[#1a1f2e]"
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
          {currentMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-[#9ba3af]">
                {selectedConversation?.kind === "channel"
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
          <div className="rounded-2xl border border-[#e5e7eb] bg-white">
            <textarea
              className="w-full resize-none rounded-t-2xl px-4 pt-3.5 text-sm text-[#1a1f2e] placeholder:text-[#9ba3af] focus:outline-none"
              onKeyDown={handleKeyDown}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              ref={textareaRef}
              rows={3}
              value={input}
            />
            <div className="flex items-center justify-between border-t border-[#f0f0f0] px-4 py-2.5">
              <div className="flex items-center gap-1">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[#1a1f2e]"
                  type="button"
                  title="Adjuntar archivo"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-[#f3f4f6] hover:text-[#1a1f2e]"
                  type="button"
                  title="Emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
              </div>
              <button
                className="flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                disabled={!input.trim()}
                onClick={sendMessage}
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
        {selectedConversation?.kind === "dm" ? (
          <>
            {/* Profile */}
            <div className="flex flex-col items-center border-b border-[#e5e7eb] px-5 py-6 text-center">
              <Avatar initials={selectedConversation.initials} size="xl" />
              <h2 className="mt-3 text-base font-bold text-[#1a1f2e]">{selectedConversation.name}</h2>
              <span className="mt-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {selectedConversation.role}
              </span>
              <p className="mt-2 text-xs text-[#9ba3af]">{selectedConversation.department}</p>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] py-2 text-xs font-semibold text-[#1a1f2e] transition hover:bg-[#f3f4f6]">
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
                        <p className="truncate text-xs font-semibold text-[#1a1f2e]">{file.name}</p>
                        <p className="text-[0.65rem] text-[#9ba3af]">Hoy, {file.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : selectedConversation?.kind === "channel" ? (
          <div className="px-5 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface)]">
              <Hash className="h-7 w-7 text-[var(--color-primary)]" />
            </div>
            <p className="mt-3 text-sm font-bold text-[#1a1f2e]">{selectedConversation.name}</p>
            <p className="mt-1 text-xs text-[#9ba3af]">Canal del curso</p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
