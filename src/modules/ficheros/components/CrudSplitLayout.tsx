import * as React from "react";

export interface CrudSplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  rightRef?: React.RefObject<HTMLDivElement | null>;
  formWidth?: string;
}

const DEFAULT_FORM_WIDTH = "380px";
export function CrudSplitLayout({
  left,
  right,
  rightRef,
  formWidth = DEFAULT_FORM_WIDTH,
}: CrudSplitLayoutProps) {
  return (
    <div
      className="flex flex-col gap-4 min-h-0 flex-1 overflow-hidden lg:grid lg:items-stretch lg:gap-2"
      style={
        {
          ["--form-width" as string]: formWidth,
          gridTemplateColumns: "minmax(0, 1fr) var(--form-width)",
        } as React.CSSProperties
      }
    >
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:min-w-0">
        {left}
      </div>
      <div
        ref={rightRef}
        className="min-w-0 shrink-0 lg:h-full lg:max-h-full lg:overflow-y-auto app-scrollbar-thin lg:w-(--form-width) lg:min-w-(--form-width)"
      >
        <div className="w-full min-h-full lg:h-full">
          {right}
        </div>
      </div>
    </div>
  );
}
