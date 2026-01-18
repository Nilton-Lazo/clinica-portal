import type { Notice } from "../hooks/useProgramacionMedica";

export default function NoticeBanner(props: { notice: Notice }) {
  const { notice } = props;
  if (!notice) return null;

  const base =
    "rounded-2xl border border-(--border-color-default) px-4 py-3 text-sm";
  const cls =
    notice.type === "success"
      ? "bg-(--color-surface) text-(--color-text-primary)"
      : "bg-(--color-surface) text-(--color-danger)";

  return <div className={[base, cls].join(" ")}>{notice.text}</div>;
}
