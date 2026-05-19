import type { DataGridColumnDef } from "./types";

function headerTextAlign(align?: "left" | "center" | "right") {
  if (align === "left") return "text-left";
  if (align === "right") return "text-right";
  return "text-center";
}

export function GridHeaderLabel(props: {
  text: string;
  align?: "left" | "center" | "right";
}) {
  const { text, align = "center" } = props;
  const trimmed = text.trim();
  const hAlign = headerTextAlign(align);

  if (!trimmed) {
    return <span className="block w-full">&nbsp;</span>;
  }

  return (
    <span className={`block w-full wrap-break-words whitespace-normal leading-tight ${hAlign}`}>
      {trimmed}
    </span>
  );
}

export function GridHeaderRenderer<T>(props: { col: DataGridColumnDef<T> }) {
  const { col } = props;
  if (typeof col.header !== "string") return <>{col.header}</>;
  if (!col.header.trim()) return <>{"\u00a0"}</>;
  return <GridHeaderLabel text={col.header} align={col.align ?? "center"} />;
}
