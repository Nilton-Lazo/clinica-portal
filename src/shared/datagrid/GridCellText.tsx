import type { ReactNode } from "react";

export function GridCellText(props: {
  value: ReactNode;
  align?: "left" | "center" | "right";
  title?: string;
  className?: string;
}) {
  const { value, align = "left", title, className } = props;
  const textTitle =
    title ?? (typeof value === "string" && value.trim() && value !== "—" ? value : undefined);

  return (
    <span
      className={[
        "block min-w-0 truncate text-sm",
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
        className ?? "",
      ].join(" ")}
      title={textTitle}
    >
      {value}
    </span>
  );
}
