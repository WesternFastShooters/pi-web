"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from "react";
import type { BashExecutionMessage } from "@/lib/types";
import { AnsiText } from "./AnsiText";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  cwd?: string;
  entries: BashExecutionMessage[];
  pending?: { command: string; excludeFromContext: boolean } | null;
  running: boolean;
  onRun: (command: string) => void;
  onAbort: () => void;
  onClose: () => void;
}

const DEFAULT_HEIGHT = 240;
const MIN_HEIGHT = 140;

function clampHeight(height: number): number {
  const viewportMax = typeof window === "undefined" ? 420 : Math.max(MIN_HEIGHT, window.innerHeight - 180);
  return Math.round(Math.max(MIN_HEIGHT, Math.min(viewportMax, height)));
}

export function TerminalPanel({ cwd, entries, pending, running, onRun, onAbort, onClose }: Props) {
  const { t } = useI18n();
  const [command, setCommand] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<{ pointerId: number; startY: number; startHeight: number } | null>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const commandHistory = useMemo(() => entries.map((entry) => entry.command).filter(Boolean), [entries]);

  useEffect(() => {
    const output = outputRef.current;
    if (output) output.scrollTop = output.scrollHeight;
  }, [entries, pending, running]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    try {
      const stored = Number.parseInt(window.localStorage.getItem("pi-terminal-height") ?? "", 10);
      if (Number.isFinite(stored)) setHeight(clampHeight(stored));
    } catch {
      // Resizing still works when browser storage is unavailable.
    }
  }, []);

  const persistHeight = (nextHeight: number) => {
    try { window.localStorage.setItem("pi-terminal-height", String(nextHeight)); } catch {}
  };

  const finishResize = (event: PointerEvent<HTMLDivElement>) => {
    if (resizeRef.current?.pointerId !== event.pointerId) return;
    resizeRef.current = null;
    persistHeight(height);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = command.trim();
    if (!value || running) return;
    onRun(value);
    setCommand("");
    setHistoryIndex(-1);
  };

  return (
    <section id="terminal-panel" className="codex-terminal-panel" aria-label={t("terminal.title")} style={{ flexBasis: height }}>
      <div
        className="codex-terminal-resize-handle"
        role="separator"
        tabIndex={0}
        aria-label={t("terminal.resize")}
        aria-orientation="horizontal"
        aria-valuemin={MIN_HEIGHT}
        aria-valuemax={1000}
        aria-valuenow={height}
        onDoubleClick={() => { setHeight(DEFAULT_HEIGHT); persistHeight(DEFAULT_HEIGHT); }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown" && event.key !== "Enter") return;
          event.preventDefault();
          const nextHeight = event.key === "Enter"
            ? DEFAULT_HEIGHT
            : clampHeight(height + (event.key === "ArrowUp" ? 16 : -16));
          setHeight(nextHeight);
          persistHeight(nextHeight);
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          resizeRef.current = { pointerId: event.pointerId, startY: event.clientY, startHeight: height };
        }}
        onPointerMove={(event) => {
          const drag = resizeRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          event.preventDefault();
          setHeight(clampHeight(drag.startHeight + drag.startY - event.clientY));
        }}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
        onLostPointerCapture={(event) => {
          if (resizeRef.current?.pointerId === event.pointerId) resizeRef.current = null;
        }}
      />
      <header className="codex-terminal-header">
        <div className="codex-terminal-tabs" role="tablist" aria-label={t("terminal.title")}>
          <button type="button" role="tab" aria-selected="true">{t("terminal.title")}</button>
        </div>
        <div className="codex-terminal-context" title={cwd}>{cwd ?? t("terminal.noProject")}</div>
        <button className="codex-terminal-close" type="button" onClick={onClose} title={t("terminal.close")} aria-label={t("terminal.close")}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" />
          </svg>
        </button>
      </header>

      <div ref={outputRef} className="codex-terminal-output" onClick={() => inputRef.current?.focus()}>
        {entries.length === 0 && !pending ? (
          <div className="codex-terminal-empty">{t("terminal.empty")}</div>
        ) : null}
        {entries.map((entry, index) => (
          <div className="codex-terminal-entry" key={`${entry.timestamp ?? "entry"}-${index}`}>
            <div className="codex-terminal-command"><span>$</span> {entry.command}</div>
            {entry.output ? <div className="codex-terminal-result"><AnsiText text={entry.output} /></div> : null}
            {typeof entry.exitCode === "number" && entry.exitCode !== 0 ? (
              <div className="codex-terminal-exit">{t("terminal.exitCode", { code: entry.exitCode })}</div>
            ) : null}
            {entry.cancelled ? <div className="codex-terminal-exit">{t("terminal.cancelled")}</div> : null}
          </div>
        ))}
        {pending ? (
          <div className="codex-terminal-entry is-running">
            <div className="codex-terminal-command"><span>$</span> {pending.command}</div>
            <div className="codex-terminal-running">{t("terminal.running")}</div>
          </div>
        ) : null}
      </div>

      <form className="codex-terminal-prompt" onSubmit={submit}>
        <span aria-hidden="true">$</span>
        <input
          ref={inputRef}
          value={command}
          disabled={running}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            if (commandHistory.length === 0) return;
            event.preventDefault();
            const nextIndex = event.key === "ArrowUp"
              ? Math.min(commandHistory.length - 1, historyIndex + 1)
              : Math.max(-1, historyIndex - 1);
            setHistoryIndex(nextIndex);
            setCommand(nextIndex === -1 ? "" : commandHistory[commandHistory.length - 1 - nextIndex] ?? "");
          }}
          placeholder={running ? t("terminal.running") : t("terminal.placeholder")}
          aria-label={t("terminal.placeholder")}
          autoComplete="off"
          spellCheck={false}
        />
        {running ? (
          <button type="button" onClick={onAbort}>{t("terminal.stop")}</button>
        ) : (
          <button type="submit" disabled={!command.trim()}>{t("terminal.run")}</button>
        )}
      </form>
    </section>
  );
}
