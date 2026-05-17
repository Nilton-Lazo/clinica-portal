import * as React from "react";
import { Link } from "react-router-dom";
import { ficherosToolbarSelectBase, inputBase } from "../utils/crudShared";

export const ficherosToolbarSearchClass = `min-w-50 h-10 flex-1 basis-full sm:basis-0 ${inputBase}`;

export const ficherosToolbarSelectStatusClass = `h-10 min-w-[120px] w-full sm:w-auto ${ficherosToolbarSelectBase}`;

export const ficherosToolbarSelectPerPageClass = `h-10 min-w-[80px] w-full sm:w-auto ${ficherosToolbarSelectBase}`;

export const ficherosToolbarSelectMdClass = `h-10 min-w-[160px] w-full sm:w-auto ${ficherosToolbarSelectBase}`;

export const ficherosToolbarBackLinkClass =
  "inline-flex h-10 shrink-0 w-full items-center justify-center rounded border border-(--border-color-default) bg-(--color-surface) px-4 text-sm font-medium text-(--color-text-primary) shadow-sm transition-colors hover:border-(--color-primary)/50 sm:w-auto";

export function FicherosCrudToolbarRow(props: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-stretch gap-x-6 gap-y-3.5 sm:items-center">
      {props.children}
    </div>
  );
}

export function FicherosCrudToolbarActions(props: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:gap-3">
      {props.children}
    </div>
  );
}

export function FicherosCrudToolbarBackLink(props: { href: string }) {
  return (
    <Link to={props.href} className={ficherosToolbarBackLinkClass}>
      Volver
    </Link>
  );
}
