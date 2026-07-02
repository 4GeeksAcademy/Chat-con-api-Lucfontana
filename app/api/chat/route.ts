import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type GroqChoice = {
  message?: {
    role?: string;
    content?: string;
  };
};

type GroqResponse = {
  choices?: GroqChoice[];
  usage?: Partial<Usage>;
  model?: string;
};

type RequestBody = {
  messages?: ChatMessage[];
};

const DEFAULT_MODEL = "llama-3.1-8b-instant";

function readEnvFileValue(name: string) {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return "";
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

    if (key !== name) {
      continue;
    }

    return rawValue.replace(/^['"]|['"]$/g, "");
  }

  return "";
}

function getServerApiKey() {
  return (
    process.env.GROQ_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim() ||
    readEnvFileValue("GROQ_API_KEY") ||
    readEnvFileValue("NEXT_PUBLIC_GROQ_API_KEY") ||
    ""
  );
}

function getServerModel() {
  return process.env.GROQ_MODEL?.trim() || readEnvFileValue("GROQ_MODEL") || DEFAULT_MODEL;
}

function normalizeUsage(usage?: Partial<Usage>): Usage {
  return {
    prompt_tokens: Number(usage?.prompt_tokens ?? 0),
    completion_tokens: Number(usage?.completion_tokens ?? 0),
    total_tokens: Number(usage?.total_tokens ?? 0),
  };
}

function isValidMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as ChatMessage;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
}

export async function POST(request: Request) {
  const apiKey = getServerApiKey();
  const model = getServerModel();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Falta configurar GROQ_API_KEY en el entorno del servidor. Temporalmente tambien se acepta NEXT_PUBLIC_GROQ_API_KEY si ya existe en .env.",
      },
      { status: 500 },
    );
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la petición no es JSON válido." },
      { status: 400 },
    );
  }

  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = incomingMessages
    .filter(isValidMessage)
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));

  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Debes enviar al menos un mensaje válido." },
      { status: 400 },
    );
  }

  const startedAt = Date.now();

  let groqResponse: Response;

  try {
    groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con la API de Groq." },
      { status: 502 },
    );
  }

  const responseTimeMs = Date.now() - startedAt;

  if (!groqResponse.ok) {
    const errorText = await groqResponse.text();

    try {
      const parsed = JSON.parse(errorText) as {
        error?: {
          message?: string;
        };
      };

      return NextResponse.json(
        {
          error:
            parsed.error?.message ||
            `Groq devolvió un error ${groqResponse.status}.`,
        },
        { status: groqResponse.status },
      );
    } catch {
      return NextResponse.json(
        {
          error:
            errorText || `Groq devolvió un error ${groqResponse.status}.`,
        },
        { status: groqResponse.status },
      );
    }
  }

  const data = (await groqResponse.json()) as GroqResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    return NextResponse.json(
      { error: "Groq no devolvió contenido en la respuesta." },
      { status: 502 },
    );
  }

  const usage = normalizeUsage(data.usage);
  const tokensPerSecond =
    responseTimeMs > 0
      ? Number(
          (usage.completion_tokens / (responseTimeMs / 1000 || 1)).toFixed(2),
        )
      : null;

  return NextResponse.json({
    content,
    usage,
    model: data.model || model,
    responseTimeMs,
    tokensPerSecond,
  });
}