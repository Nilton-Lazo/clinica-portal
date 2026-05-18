import * as React from "react";

export const ficherosCrudToolbarShellClass =
  "w-full shrink-0 rounded border border-dashed border-(--border-color-default) bg-(--color-panel-bg) p-4";

export function FicherosCrudPageLayout(props: {
  toolbar: React.ReactNode;
  children: React.ReactNode;
  topSlot?: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      {props.topSlot}
      <div className={ficherosCrudToolbarShellClass}>
        {props.toolbar}
      </div>
      <div className="flex w-full flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">{props.children}</div>
    </div>
  );
}
