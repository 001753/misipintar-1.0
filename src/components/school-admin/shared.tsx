"use client";

import { useState, useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import { AlertCircle, Check, Copy, LoaderCircle } from "lucide-react";
import type { ActionResult } from "./types";

export type FeedbackState =
  | { kind: "idle" }
  | { kind: "pending"; action: string }
  | { kind: "success"; action: string; message: string; data?: unknown }
  | { kind: "error"; action: string; message: string };

export function useFormActions() {
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function submit(
    action: string,
    message: string,
    formData: FormData,
    callback: (formData: FormData) => Promise<ActionResult>,
    onSuccess?: () => void,
  ) {
    if (isPending) return;
    setFeedback({ kind: "pending", action });
    startTransition(async () => {
      try {
        const result = await callback(formData);
        if (result.success) {
          setFeedback({ kind: "success", action, message, data: result.data });
          onSuccess?.();
        } else {
          setFeedback({ kind: "error", action, message: result.error });
        }
      } catch {
        setFeedback({
          kind: "error",
          action,
          message: "Perubahan belum tersimpan. Periksa koneksi, lalu coba lagi.",
        });
      }
    });
  }

  return { feedback, isPending, submit, setFeedback };
}

export function handleActionSubmit(
  event: FormEvent<HTMLFormElement>,
  action: string,
  message: string,
  callback: (formData: FormData) => Promise<ActionResult>,
  submit: ReturnType<typeof useFormActions>["submit"],
  onSuccess?: () => void,
) {
  event.preventDefault();
  submit(action, message, new FormData(event.currentTarget), callback, onSuccess);
}

export function ActionNotice({ feedback }: { feedback: FeedbackState }) {
  if (feedback.kind !== "error" && feedback.kind !== "success") return null;
  const isError = feedback.kind === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      {isError ? (
        <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{feedback.message}</span>
    </div>
  );
}

export function InvitationLinkNotice({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-[#cfdfd2] bg-[#f2f7f0] p-4">
      <p className="text-sm font-semibold text-[#30473d]">Tautan undangan siap dibagikan</p>
      <p className="mt-1 text-xs leading-relaxed text-[#6e7e75]">
        Berlaku 7 hari dan hanya dapat digunakan sekali. JOBEN tidak mengirim email; bagikan tautan ini melalui saluran yang aman.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a href={path} target="_blank" rel="noreferrer" className="max-w-full break-all text-xs font-semibold text-[#32745b] underline underline-offset-2">
          {path}
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#c8d8cc] bg-white px-3 py-1.5 text-xs font-semibold text-[#365f4d] hover:bg-[#f8faf5]"
        >
          {copied ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
          {copied ? "Tersalin" : "Salin tautan"}
        </button>
      </div>
    </div>
  );
}

export function getInvitationPath(data: unknown): string | null {
  if (
    data !== null
    && typeof data === "object"
    && "inviteUrl" in data
    && typeof data.inviteUrl === "string"
    && data.inviteUrl.startsWith("/school-invite/")
  ) {
    return data.inviteUrl;
  }
  return null;
}

export function SubmitButton({
  pending,
  pendingLabel,
  children,
  className = "",
  disabled = false,
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#245b4a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b4a3b] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b4a] focus-visible:ring-offset-2 ${className}`}
    >
      {pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}

export function Field({
  label,
  name,
  required,
  hint,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  const hintId = `${name}-hint`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-semibold text-[#263c36]">
        {label}
        {required ? <span className="ml-1 text-[#b8533c]" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {hint ? <p id={hintId} className="text-xs leading-relaxed text-[#74847e]">{hint}</p> : null}
    </div>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-lg border border-[#d8e0d9] bg-[#fffefa] px-3.5 py-2.5 text-sm text-[#21352f] shadow-sm outline-none transition placeholder:text-[#9aa69f] focus:border-[#548575] focus:ring-2 focus:ring-[#548575]/15 disabled:bg-[#f1f3ef] disabled:text-[#87948c]";

const statusStyles: Record<string, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-800",
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  INVITED: "border-sky-200 bg-sky-50 text-sky-800",
  SUSPENDED: "border-rose-200 bg-rose-50 text-rose-800",
  INACTIVE: "border-[#d9ded9] bg-[#f1f3ef] text-[#68776f]",
  ARCHIVED: "border-[#d9ded9] bg-[#f1f3ef] text-[#68776f]",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  PENDING_REVIEW: "Menunggu tinjauan",
  PENDING: "Menunggu",
  INVITED: "Undangan terkirim",
  SUSPENDED: "Ditangguhkan",
  INACTIVE: "Nonaktif",
  ARCHIVED: "Diarsipkan",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${
        statusStyles[status] ?? "border-[#d9ded9] bg-[#f1f3ef] text-[#68776f]"
      }`}
    >
      {statusLabels[status] ?? status.replaceAll("_", " ")}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  count,
}: {
  eyebrow: string;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9c654c]">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#223b33]">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#708078]">{description}</p>
      </div>
      {count !== undefined ? (
        <span className="w-fit rounded-full border border-[#dce3dc] bg-[#f8f8f3] px-3 py-1.5 text-xs font-medium text-[#566b61]">
          {count.toLocaleString("id-ID")} data
        </span>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[#d4ddd5] bg-[#fafaf6] px-5 py-8 text-center">
      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9f0e9] text-[#376c58]" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-current" />
      </span>
      <h3 className="text-sm font-semibold text-[#344b41]">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#7c8981]">{description}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-label="Memuat data" className="animate-pulse space-y-3 p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#e6ebe5]" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-1/3 rounded bg-[#e6ebe5]" />
            <div className="h-2.5 w-2/3 rounded bg-[#edf0eb]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "—";
}