import { normalizeCustomPanelLines, stripAnsi } from "./ansi";

export type SideChatTranscriptEntry = {
  role: "user" | "assistant" | "thinking" | "tool";
  content: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function textField(entry: Record<string, unknown>, key: "text" | "content"): string {
  return typeof entry[key] === "string" ? entry[key].trim() : "";
}

function parseStructuredTranscript(entries: unknown[]): SideChatTranscriptEntry[] | null {
  if (entries.length === 0) return [];

  const result: SideChatTranscriptEntry[] = [];
  const toolEntryByCallId = new Map<string, number>();
  let recognized = false;

  for (const value of entries) {
    if (!isRecord(value) || typeof value.type !== "string") continue;

    if (value.type === "turn-boundary") {
      recognized = true;
      continue;
    }

    if (value.type === "user-message") {
      recognized = true;
      const content = textField(value, "text");
      if (content) result.push({ role: "user", content });
      continue;
    }

    if (value.type === "assistant-text" || value.type === "thinking") {
      recognized = true;
      const content = textField(value, "text");
      if (content) result.push({ role: value.type === "thinking" ? "thinking" : "assistant", content });
      continue;
    }

    if (value.type === "tool-call") {
      recognized = true;
      const toolName = typeof value.toolName === "string" ? value.toolName : "Tool";
      const args = typeof value.args === "string" ? value.args.trim() : "";
      const index = result.push({ role: "tool", content: `${toolName}${args ? ` · ${args}` : ""}` }) - 1;
      if (typeof value.toolCallId === "string") toolEntryByCallId.set(value.toolCallId, index);
      continue;
    }

    if (value.type === "tool-result") {
      recognized = true;
      const content = textField(value, "content");
      if (!content) continue;
      const callId = typeof value.toolCallId === "string" ? value.toolCallId : "";
      const existingIndex = callId ? toolEntryByCallId.get(callId) : undefined;
      const prefix = value.isError === true ? "↳ error" : value.streaming === true ? "↳ streaming result" : "↳ result";
      const suffix = value.truncated === true ? " (truncated)" : "";
      const rendered = `${prefix}${suffix}\n${content}`;
      if (existingIndex !== undefined) {
        result[existingIndex] = {
          ...result[existingIndex],
          content: `${result[existingIndex].content}\n${rendered}`,
        };
      } else {
        result.push({ role: "tool", content: rendered });
      }
    }
  }

  return recognized ? result : null;
}

function parseVisibleTranscript(lines: string[]): SideChatTranscriptEntry[] {
  const normalized = normalizeCustomPanelLines(lines);
  const transcriptLines = normalized.length >= 5 ? normalized.slice(2, -3) : [];
  const entries: SideChatTranscriptEntry[] = [];
  let current: SideChatTranscriptEntry | null = null;

  const flush = () => {
    if (current?.content.trim()) entries.push({ ...current, content: current.content.trim() });
    current = null;
  };

  for (const ansiLine of transcriptLines) {
    const line = stripAnsi(ansiLine).trimEnd();
    if (/^\s*[─━-]{8,}\s*$/.test(line)) {
      flush();
      continue;
    }
    const header = line.trimStart().match(/^(You|Assistant|Thinking|Tool)\b\s*(.*)$/);
    if (header) {
      flush();
      const role = header[1] === "You"
        ? "user"
        : header[1].toLowerCase() as SideChatTranscriptEntry["role"];
      current = { role, content: header[2].replace(/^▍\s*/, "") };
      continue;
    }
    if (!current) continue;
    const continuation = line.replace(/^\s{4}/, "");
    current.content += `${current.content ? "\n" : ""}${continuation}`;
  }
  flush();
  return entries;
}

export function parseSideChatTranscript(
  lines: string[],
  transcriptEntries?: unknown[],
): SideChatTranscriptEntry[] {
  if (transcriptEntries) {
    const structured = parseStructuredTranscript(transcriptEntries);
    if (structured !== null) return structured;
  }
  return parseVisibleTranscript(lines);
}
