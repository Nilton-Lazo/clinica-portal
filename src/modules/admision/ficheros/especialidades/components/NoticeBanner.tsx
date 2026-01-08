import type { Notice } from "../hooks/useEspecialidades";

export default function NoticeBanner({ notice }: { notice: Notice }) {
  if (!notice) return null;

  return (
    <div
      role="status"
      className={[
        "rounded-2xl border px-4 py-3 text-sm",
        notice.type === "success"
          ? "border-[var(--color-success)] text-[var(--color-success)]"
          : "border-[var(--color-danger)] text-[var(--color-danger)]",
      ].join(" ")}
    >
      {notice.text}
    </div>
  );
}
