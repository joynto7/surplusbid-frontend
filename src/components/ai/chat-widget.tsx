"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { LuBot, LuMessageSquare, LuRotateCcw, LuSend, LuSparkles, LuX } from "react-icons/lu";
import { LotImage } from "@/components/shared/lot-image";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AiMode, AssistantLot, ChatTurn } from "@/types/api";
import { RichText } from "./rich-text";

interface Message extends ChatTurn {
  lots?: AssistantLot[];
  mode?: AiMode;
}

const STORAGE_KEY = "surplusbid.chat";
const WELCOME: Message = {
  role: "assistant",
  content:
    'Hi! I\'m the SurplusBid Assistant. Ask me to find lots ("forklifts under $25,000 in California") or about deposits, bidding, payments, verification and selling.',
};
const STARTERS = [
  "Find forklifts under $25,000",
  "How do deposit holds work?",
  "What happens after I win?",
  "How do I sell surplus equipment?",
];

const AskAiContext = createContext<(question?: string) => void>(() => {});

/** Opens the assistant from anywhere on the public site, optionally asking a question straight away. */
export function useAskAi() {
  return useContext(AskAiContext);
}

function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Message[]) : null;
    return parsed?.length ? parsed : [WELCOME];
  } catch {
    return [WELCOME];
  }
}

export function AskAiProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const ask = useCallback((question?: string) => {
    setPending(question ?? null);
    setOpen(true);
  }, []);
  return (
    <AskAiContext.Provider value={ask}>
      {children}
      <ChatWidget open={open} onOpenChange={setOpen} pendingQuestion={pending} onPendingSent={() => setPending(null)} />
    </AskAiContext.Provider>
  );
}

/**
 * The AI assistant. Answers policy questions and searches the catalogue
 * (Claude with lot-search tools when configured, the built-in assistant
 * otherwise). On a lot page it knows which lot you're looking at.
 */
function ChatWidget({
  open,
  onOpenChange,
  pendingQuestion,
  onPendingSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingQuestion: string | null;
  onPendingSent: () => void;
}) {
  const pathname = usePathname();
  const lotId = pathname.match(/^\/lots\/([0-9a-f-]{36})$/)?.[1];
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(STARTERS);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setMessages(loadHistory()), []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* private mode: the conversation just won't survive a reload */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const chat = useMutation({
    mutationFn: (history: Message[]) =>
      api.aiChat(
        // The conversation sent to the model starts at the first user message (the greeting is UI only).
        history
          .slice(
            Math.max(
              0,
              history.findIndex((m) => m.role === "user"),
            ),
          )
          .slice(-12)
          .map(({ role, content }) => ({ role, content: content.slice(0, 2000) })),
        lotId,
      ),
    onSuccess: (reply) => {
      setMessages((m) => [...m, { role: "assistant", content: reply.reply, lots: reply.lots, mode: reply.mode }]);
      setSuggestions(reply.suggestions);
    },
    onError: (e) =>
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Sorry, I couldn't answer that just now (${errorMessage(e)}). Please try again.`,
        },
      ]),
    meta: { errorToast: false },
  });

  const send = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q || chat.isPending) return;
      const next: Message[] = [...messages, { role: "user", content: q }];
      setMessages(next);
      setInput("");
      chat.mutate(next);
    },
    [chat, messages],
  );

  useEffect(() => {
    if (open && pendingQuestion) {
      send(pendingQuestion);
      onPendingSent();
    }
  }, [open, pendingQuestion, onPendingSent, send]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const reset = () => {
    setMessages([WELCOME]);
    setSuggestions(STARTERS);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-medium text-primary-foreground text-sm shadow-xl transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6"
          aria-label="Open the AI assistant"
        >
          <LuSparkles className="size-4" aria-hidden /> Ask AI
        </button>
      )}
      {open && (
        <section
          aria-label="SurplusBid AI assistant"
          className="fixed inset-x-2 bottom-2 z-50 flex h-[min(78vh,40rem)] flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]"
        >
          <header className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/15">
              <LuBot className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">SurplusBid Assistant</p>
              <p className="truncate text-primary-foreground/80 text-xs">
                {lotId ? "Ask about this lot or anything else" : "Finds lots and answers in seconds"}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-md p-1.5 hover:bg-primary-foreground/15"
              aria-label="Start a new conversation"
              title="New conversation"
            >
              <LuRotateCcw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1.5 hover:bg-primary-foreground/15"
              aria-label="Close the assistant"
            >
              <LuX className="size-4" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
            {messages.map((m, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: messages are append-only
              <div key={i} className={cn("flex gap-2", m.role === "user" && "justify-end")}>
                {m.role === "assistant" && (
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <LuSparkles className="size-3.5" aria-hidden />
                  </span>
                )}
                <div className={cn("max-w-[85%] space-y-2", m.role === "user" && "items-end")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted",
                    )}
                  >
                    {m.role === "assistant" ? <RichText text={m.content} /> : m.content}
                  </div>
                  {m.lots?.map((lot) => (
                    <Link
                      key={lot.id}
                      href={`/lots/${lot.id}`}
                      className="flex items-center gap-2.5 rounded-xl border bg-background p-2 transition-colors hover:border-primary/40"
                    >
                      <LotImage
                        src={lot.image ?? undefined}
                        alt=""
                        className="size-12 shrink-0 rounded-lg"
                        sizes="48px"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 font-medium text-sm">{lot.title}</span>
                        <span className="block text-muted-foreground text-xs">
                          {formatMoney(lot.currentPriceCents)} · {lot.location || lot.category}
                        </span>
                      </span>
                    </Link>
                  ))}
                  {m.role === "assistant" && m.mode && (
                    <p className="text-[11px] text-muted-foreground">
                      {m.mode === "ai" ? "Answered by Claude" : "Answered from the SurplusBid knowledge base"}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {chat.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Spinner className="size-3.5" />
                </span>
                Thinking…
              </div>
            )}
          </div>

          {suggestions.length > 0 && !chat.isPending && (
            <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-none">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="shrink-0 rounded-full border bg-background px-3 py-1 text-xs transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t p-3"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Message the assistant
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={lotId ? "Ask about this lot…" : "Ask anything about SurplusBid…"}
              className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            />
            <Button
              type="submit"
              size="icon"
              className="size-10 rounded-xl"
              disabled={!input.trim() || chat.isPending}
              aria-label="Send"
            >
              <LuSend />
            </Button>
          </form>
          <p className="flex items-center gap-1 px-4 pb-2 text-[11px] text-muted-foreground">
            <LuMessageSquare className="size-3" aria-hidden /> AI answers can be wrong. Check the lot page before you
            bid.
          </p>
        </section>
      )}
    </>
  );
}
