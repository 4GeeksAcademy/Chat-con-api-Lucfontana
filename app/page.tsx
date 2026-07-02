"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type TokenTotals = {
  prompt: number;
  completion: number;
  total: number;
};

type ChatApiResponse = {
  content?: string;
  usage?: Partial<Usage>;
  model?: string;
  responseTimeMs?: number;
  tokensPerSecond?: number | null;
  error?: string;
};

type PersistedSession = {
  messages: ChatMessage[];
  lastUsage: Usage;
  tokenTotals: TokenTotals;
  lastModel: string;
  responseTimeMs: number | null;
  tokensPerSecond: number | null;
};

const SESSION_STORAGE_KEY = "groq-ai-chat-session-v1";
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const EMPTY_USAGE: Usage = {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
};
const EMPTY_TOTALS: TokenTotals = {
  prompt: 0,
  completion: 0,
  total: 0,
};
const SUGGESTED_PROMPTS = [
  "Explicame las ventajas de usar Llama 3 8B con Groq frente a GPUs tradicionales.",
  "Ayudame a diseñar una API REST segura en Next.js con ejemplos en TypeScript.",
  "Resumí este problema técnico y proponé un plan de implementación por etapas.",
];

const numberFormatter = new Intl.NumberFormat("es-AR");

function normalizeUsage(usage?: Partial<Usage>): Usage {
  return {
    prompt_tokens: Number(usage?.prompt_tokens ?? 0),
    completion_tokens: Number(usage?.completion_tokens ?? 0),
    total_tokens: Number(usage?.total_tokens ?? 0),
  };
}

function formatMetric(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${numberFormatter.format(value)}${suffix}`;
}

function renderMessageContent(content: string) {
  const blocks = content.split(/```/);

  return blocks.map((block, blockIndex) => {
    if (blockIndex % 2 === 1) {
      const lines = block.replace(/^\n+|\n+$/g, "").split("\n");
      const firstLine = lines[0] || "";
      const hasLanguage = Boolean(firstLine && !firstLine.includes(" "));
      const language = hasLanguage ? firstLine : "text";
      const code = hasLanguage ? lines.slice(1).join("\n") : lines.join("\n");

      return (
        <div
          key={`code-${blockIndex}`}
          className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-lowest"
        >
          <div className="flex items-center justify-between border-b border-outline-variant/40 px-4 py-2 text-xs uppercase tracking-[0.24em] text-muted/70">
            <span>{language}</span>
            <span className="rounded-full border border-outline-variant/40 px-2 py-1 text-[10px] tracking-[0.2em] text-secondary">
              code
            </span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-sm leading-6 whitespace-pre-wrap text-secondary">
            {code}
          </pre>
        </div>
      );
    }

    return (
      <div key={`text-${blockIndex}`} className="space-y-3">
        {block
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
          .map((paragraph, paragraphIndex) => (
            <p
              key={`paragraph-${blockIndex}-${paragraphIndex}`}
              className="whitespace-pre-wrap"
            >
              {paragraph}
            </p>
          ))}
      </div>
    );
  });
}

function StatCard({
  label,
  value,
  accent,
  helper,
}: {
  label: string;
  value: string;
  accent?: "primary" | "secondary" | "tertiary";
  helper?: string;
}) {
  const accentClass =
    accent === "secondary"
      ? "text-secondary"
      : accent === "tertiary"
        ? "text-tertiary"
        : "text-primary";

  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-surface-low px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted/60">{label}</p>
      <p className={`mt-2 font-heading text-2xl font-semibold ${accentClass}`}>{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted/65">{helper}</p> : null}
    </div>
  );
}

function MetricsPanel({
  lastUsage,
  tokenTotals,
  lastModel,
  responseTimeMs,
  tokensPerSecond,
  totalMessages,
}: {
  lastUsage: Usage;
  tokenTotals: TokenTotals;
  lastModel: string;
  responseTimeMs: number | null;
  tokensPerSecond: number | null;
  totalMessages: number;
}) {
  return (
    <aside className="flex h-full flex-col gap-4 rounded-[28px] border border-outline-variant/60 bg-black/20 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
        <div>
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-muted/75">
            Metrics Panel
          </p>
          <p className="mt-1 text-sm text-muted/60">Uso y rendimiento de la sesión</p>
        </div>
        <div className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
          Live
        </div>
      </div>

      <StatCard label="Model Engine" value={lastModel} accent="secondary" helper="Modelo activo" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-2">
        <StatCard
          label="Prompt"
          value={formatMetric(lastUsage.prompt_tokens)}
          accent="tertiary"
          helper="Última respuesta"
        />
        <StatCard
          label="Completion"
          value={formatMetric(lastUsage.completion_tokens)}
          accent="primary"
          helper="Última respuesta"
        />
        <StatCard
          label="Total"
          value={formatMetric(lastUsage.total_tokens)}
          accent="secondary"
          helper="Última respuesta"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Prompt acumulado"
          value={formatMetric(tokenTotals.prompt)}
          helper="Sesión actual"
        />
        <StatCard
          label="Completion acumulado"
          value={formatMetric(tokenTotals.completion)}
          helper="Sesión actual"
        />
        <StatCard
          label="Tokens acumulados"
          value={formatMetric(tokenTotals.total)}
          accent="secondary"
          helper="Sesión actual"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <StatCard
          label="Tiempo de respuesta"
          value={formatMetric(responseTimeMs, " ms")}
          helper="Última llamada"
        />
        <StatCard
          label="Tokens por segundo"
          value={formatMetric(tokensPerSecond)}
          accent="secondary"
          helper="Completion / tiempo"
        />
        <StatCard
          label="Mensajes en sesión"
          value={formatMetric(totalMessages)}
          accent="tertiary"
          helper="Persistidos localmente"
        />
      </div>
    </aside>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${
        isUser ? "justify-end pr-5 pl-2" : "justify-start pl-5 pr-2"
      }`}
    >
      <div
        className={`flex max-w-[90%] flex-col gap-2 md:max-w-[85%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          {isUser ? (
            <>
              <span className="text-primary">You</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary-strong text-xs font-bold text-black">
                U
              </span>
            </>
          ) : (
            <>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-secondary-strong/20 text-xs font-bold text-secondary">
                AI
              </span>
              <span className="text-secondary">Groq AI</span>
            </>
          )}
        </div>

        <div
          className={
            isUser
              ? "rounded-[24px] rounded-tr-md border border-outline-variant/60 bg-surface-highest px-5 py-4 text-base leading-7 text-foreground shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
              : "rounded-[24px] rounded-tl-md border border-outline-variant/50 bg-surface-low px-5 py-4 text-base leading-7 text-foreground shadow-[0_18px_40px_rgba(0,0,0,0.18)] ring-1 ring-secondary/10"
          }
        >
          <div className="space-y-4">{renderMessageContent(message.content)}</div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUsage, setLastUsage] = useState<Usage>(EMPTY_USAGE);
  const [tokenTotals, setTokenTotals] = useState<TokenTotals>(EMPTY_TOTALS);
  const [lastModel, setLastModel] = useState(DEFAULT_MODEL);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [tokensPerSecond, setTokensPerSecond] = useState<number | null>(null);

  const feedRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sessionLoadedRef = useRef(false);
  const didInitialScrollRef = useRef(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);

      if (!saved) {
        sessionLoadedRef.current = true;
        return;
      }

      const parsed = JSON.parse(saved) as Partial<PersistedSession>;

      setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
      setLastUsage(normalizeUsage(parsed.lastUsage));
      setTokenTotals({
        prompt: Number(parsed.tokenTotals?.prompt ?? 0),
        completion: Number(parsed.tokenTotals?.completion ?? 0),
        total: Number(parsed.tokenTotals?.total ?? 0),
      });
      setLastModel(parsed.lastModel || DEFAULT_MODEL);
      setResponseTimeMs(
        typeof parsed.responseTimeMs === "number" ? parsed.responseTimeMs : null,
      );
      setTokensPerSecond(
        typeof parsed.tokensPerSecond === "number" ? parsed.tokensPerSecond : null,
      );
    } catch {
      setError("No se pudo restaurar la sesión guardada en este navegador.");
    } finally {
      sessionLoadedRef.current = true;
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!sessionLoadedRef.current) {
      return;
    }

    const payload: PersistedSession = {
      messages,
      lastUsage,
      tokenTotals,
      lastModel,
      responseTimeMs,
      tokensPerSecond,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  }, [
    lastModel,
    lastUsage,
    messages,
    responseTimeMs,
    tokenTotals,
    tokensPerSecond,
  ]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    const container = feedRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: didInitialScrollRef.current ? "smooth" : "auto",
    });
    didInitialScrollRef.current = true;
  }, [error, isLoading, messages]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMetricsOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSubmit(prefilledMessage?: string) {
    const trimmedMessage = (prefilledMessage ?? input).trim();

    if (!trimmedMessage || isLoading) {
      return;
    }

    const nextUserMessage: ChatMessage = {
      role: "user",
      content: trimmedMessage,
    };
    const nextMessages: ChatMessage[] = [...messages, nextUserMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = (await response.json()) as ChatApiResponse;

      if (!response.ok) {
        throw new Error(data.error || "No se pudo obtener respuesta de Groq.");
      }

      const usage = normalizeUsage(data.usage);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.content || "La IA no devolvió contenido.",
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
      setLastUsage(usage);
      setTokenTotals((currentTotals) => ({
        prompt: currentTotals.prompt + usage.prompt_tokens,
        completion: currentTotals.completion + usage.completion_tokens,
        total: currentTotals.total + usage.total_tokens,
      }));
      setLastModel(data.model || DEFAULT_MODEL);
      setResponseTimeMs(
        typeof data.responseTimeMs === "number" ? data.responseTimeMs : null,
      );
      setTokensPerSecond(
        typeof data.tokensPerSecond === "number" ? data.tokensPerSecond : null,
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Ocurrió un error inesperado al consultar la IA.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    setInput("");
    setError(null);
    setIsLoading(false);
    setLastUsage(EMPTY_USAGE);
    setTokenTotals(EMPTY_TOTALS);
    setLastModel(DEFAULT_MODEL);
    setResponseTimeMs(null);
    setTokensPerSecond(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  function toggleMetricsPanel() {
    setIsMetricsOpen((currentValue) => !currentValue);
  }

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-outline-variant/60 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 font-heading text-xl font-bold tracking-tight text-primary">
              bolt
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-primary">
                Groq AI Chat
              </h1>
              <p className="text-sm text-muted/75">Instant Intelligence Engine</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 font-heading text-sm text-muted/80 md:flex">
            <span className="text-primary">Chat</span>
            <span>History</span>
            <span>Settings</span>
          </nav>

          <button
            type="button"
            onClick={toggleMetricsPanel}
            className="inline-flex items-center rounded-full border border-outline-variant/60 bg-surface-low/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary transition hover:border-secondary/40 sm:hidden"
            aria-expanded={isMetricsOpen}
            aria-controls="mobile-metrics-panel"
          >
            {isMetricsOpen ? "Cerrar métricas" : "Ver métricas"}
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-black/45 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${
          isMetricsOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMetricsOpen(false)}
        aria-hidden={!isMetricsOpen}
      >
        <div
          id="mobile-metrics-panel"
          className={`absolute right-0 top-0 h-full w-full max-w-[88vw] border-l border-outline-variant/60 bg-[#121212]/95 p-4 shadow-[-24px_0_60px_rgba(0,0,0,0.35)] transition-transform duration-300 ${
            isMetricsOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Panel de métricas"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-muted/70">
                Metrics Panel
              </p>
              <p className="mt-1 text-sm text-muted/60">Uso y rendimiento de la sesión</p>
            </div>
            <button
              type="button"
              onClick={toggleMetricsPanel}
              className="rounded-full border border-outline-variant/60 px-3 py-2 text-xs font-semibold text-muted"
            >
              Cerrar
            </button>
          </div>

          <div className="chat-scrollbar h-[calc(100%-4.5rem)] overflow-y-auto pr-1">
            <MetricsPanel
              lastUsage={lastUsage}
              tokenTotals={tokenTotals}
              lastModel={lastModel}
              responseTimeMs={responseTimeMs}
              tokensPerSecond={tokensPerSecond}
              totalMessages={messages.length}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden lg:px-4 lg:py-4 xl:flex-row xl:gap-4">
        <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-[32px] border border-outline-variant/40 bg-black/10 shadow-[0_24px_80px_rgba(0,0,0,0.2)] xl:flex-row">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div ref={feedRef} className="chat-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
              <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-6">
                {messages.length === 0 ? (
                  <div className="overflow-hidden rounded-[32px] border border-outline-variant/60 bg-surface-low/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 font-heading font-bold text-secondary">
                        AI
                      </div>
                      <div>
                        <p className="font-heading text-lg font-semibold text-secondary">Groq AI</p>
                        <p className="text-sm text-muted/70">Listo para responder con Llama 3</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4 text-base leading-8 text-foreground">
                      <p>
                        Escribí un mensaje para iniciar la conversación. La sesión se guarda en este navegador y cada nueva consulta se envía a Groq con el contexto completo del historial.
                      </p>
                      <p className="text-muted/80">
                        La interfaz replica la estructura del diseño de referencia: historial lateral, conversación central y panel de métricas en tiempo real.
                      </p>
                    </div>

                    <div className="mt-8 grid gap-3 md:grid-cols-3">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSubmit(prompt)}
                          disabled={isLoading}
                          className="rounded-2xl border border-outline-variant/60 bg-black/10 px-4 py-4 text-left text-sm leading-6 text-muted transition hover:border-secondary/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {messages.map((message, index) => (
                  <MessageBubble key={`${message.role}-${index}-${message.content.slice(0, 12)}`} message={message} />
                ))}

                {isLoading ? (
                  <div className="flex justify-start">
                    <div className="flex max-w-[85%] flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted/80">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-secondary/10 text-xs font-bold text-secondary">
                          AI
                        </span>
                        <span>Pensando...</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-low px-4 py-3">
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-secondary [animation-delay:-0.3s]" />
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-secondary [animation-delay:-0.15s]" />
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-secondary" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-outline-variant/40 bg-black/20 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                {error ? (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                ) : null}

                <form
                  className="rounded-[28px] border border-outline-variant/60 bg-surface-low/90 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit();
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleSubmit();
                        }
                      }}
                      placeholder="Escribe un mensaje a Groq..."
                      className="min-h-[64px] w-full flex-1 resize-none rounded-2xl border border-outline-variant/50 bg-surface-lowest/60 px-4 py-4 text-base text-foreground outline-none transition placeholder:text-muted/45 focus:border-secondary/50"
                    />

                    <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                      <button
                        type="button"
                        onClick={clearConversation}
                        className="rounded-2xl border border-outline-variant/60 px-4 py-3 text-sm font-semibold text-muted transition hover:border-primary/40 hover:text-primary"
                      >
                        Limpiar historial
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || input.trim().length === 0}
                        className="rounded-2xl bg-primary-strong px-6 py-3 font-heading text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? "Enviando..." : "Enviar"}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="flex flex-col gap-2 px-2 text-xs text-muted/65 sm:flex-row sm:items-center sm:justify-between">
                  <p>Tu conversación se guarda localmente en esta sesión.</p>
                  <p>La API key vive solo en el servidor mediante variables de entorno.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="hidden h-full w-[340px] shrink-0 border-l border-outline-variant/50 p-5 xl:block">
            <MetricsPanel
              lastUsage={lastUsage}
              tokenTotals={tokenTotals}
              lastModel={lastModel}
              responseTimeMs={responseTimeMs}
              tokensPerSecond={tokensPerSecond}
              totalMessages={messages.length}
            />
          </div>
        </main>
      </div>

      <div className="hidden border-t border-outline-variant/40 p-4 sm:block xl:hidden">
        <div className="mx-auto max-w-[1600px]">
          <MetricsPanel
            lastUsage={lastUsage}
            tokenTotals={tokenTotals}
            lastModel={lastModel}
            responseTimeMs={responseTimeMs}
            tokensPerSecond={tokensPerSecond}
            totalMessages={messages.length}
          />
        </div>
      </div>
    </div>
  );
}
