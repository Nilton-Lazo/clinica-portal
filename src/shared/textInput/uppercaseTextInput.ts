import type * as React from "react";

const EXCLUDED_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "date",
  "datetime-local",
  "email",
  "file",
  "hidden",
  "image",
  "month",
  "number",
  "password",
  "radio",
  "range",
  "reset",
  "search",
  "submit",
  "tel",
  "time",
  "url",
  "week",
]);

const EXCLUDED_INPUT_MODES = new Set(["decimal", "email", "numeric", "tel", "url"]);

const EXCLUDED_AUTOCOMPLETE = new Set([
  "current-password",
  "email",
  "new-password",
  "one-time-code",
  "username",
]);

export const PRESERVE_CASE_ATTR = "data-preserve-case";
const WRAPPED_ATTR = "data-uppercase-wrapped";

export function normalizeTextInputUppercase(value: string): string {
  return value.toLocaleUpperCase("es-PE");
}

export function prepareFormText(value: string): string {
  return normalizeTextInputUppercase(value.trim());
}

function hasPreserveCaseAncestor(el: Element): boolean {
  return Boolean(el.closest(`[${PRESERVE_CASE_ATTR}]`));
}

type TextFieldProps = {
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLElement>["inputMode"];
  autoComplete?: string;
  readOnly?: boolean;
  disabled?: boolean;
  [PRESERVE_CASE_ATTR]?: unknown;
  [WRAPPED_ATTR]?: unknown;
};

export function shouldUppercaseTextFieldProps(props: TextFieldProps): boolean {
  if (props[WRAPPED_ATTR] || props[PRESERVE_CASE_ATTR]) return false;
  if (props.disabled || props.readOnly) return false;

  const type = String(props.type ?? "text")
    .trim()
    .toLowerCase();
  if (EXCLUDED_TYPES.has(type)) return false;

  const inputMode = props.inputMode?.trim().toLowerCase();
  if (inputMode && EXCLUDED_INPUT_MODES.has(inputMode)) return false;

  const autocomplete = props.autoComplete?.trim().toLowerCase();
  if (autocomplete && EXCLUDED_AUTOCOMPLETE.has(autocomplete)) return false;

  return true;
}

export function shouldUppercaseTextInput(
  el: HTMLInputElement | HTMLTextAreaElement
): boolean {
  if (el.disabled || el.readOnly) return false;
  if (el.hasAttribute(PRESERVE_CASE_ATTR) || hasPreserveCaseAncestor(el)) return false;

  if (el instanceof HTMLTextAreaElement) return true;

  const type = (el.getAttribute("type") ?? "text").trim().toLowerCase();
  if (EXCLUDED_TYPES.has(type)) return false;

  const inputMode = el.getAttribute("inputmode")?.trim().toLowerCase();
  if (inputMode && EXCLUDED_INPUT_MODES.has(inputMode)) return false;

  const autocomplete = el.getAttribute("autocomplete")?.trim().toLowerCase();
  if (autocomplete && EXCLUDED_AUTOCOMPLETE.has(autocomplete)) return false;

  return true;
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
}

function restoreSelection(
  el: HTMLInputElement | HTMLTextAreaElement,
  start: number | null,
  end: number | null
) {
  if (start === null || end === null) return;
  try {
    el.setSelectionRange(start, end);
  } catch {
    void 0;
  }
}

export function syncUppercaseInTextInput(el: HTMLInputElement | HTMLTextAreaElement): boolean {
  if (!shouldUppercaseTextInput(el)) return false;

  const current = el.value;
  const next = normalizeTextInputUppercase(current);
  if (current === next) return false;

  const start = el.selectionStart;
  const end = el.selectionEnd;
  setNativeValue(el, next);
  restoreSelection(el, start, end);
  return true;
}

function patchChangeEvent<E extends React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>>(
  event: E,
  value: string
): E {
  if (event.target.value === value) return event;
  return {
    ...event,
    target: { ...event.target, value },
    currentTarget: { ...event.currentTarget, value },
  } as E;
}

function wrapOnChange<P extends TextFieldProps & { onChange?: React.ChangeEventHandler<HTMLElement> }>(
  props: P
): P {
  const { onChange } = props;
  if (!onChange) return props;

  const wrapped = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = normalizeTextInputUppercase(event.target.value);
    onChange(patchChangeEvent(event, next) as React.ChangeEvent<HTMLElement>);
  };

  return {
    ...props,
    [WRAPPED_ATTR]: true,
    onChange: wrapped as P["onChange"],
  };
}

export function wrapInputElementProps<P extends React.InputHTMLAttributes<HTMLInputElement>>(props: P): P {
  if (!shouldUppercaseTextFieldProps(props)) return props;
  return wrapOnChange(props);
}

export function wrapTextareaElementProps<P extends React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  props: P
): P {
  if (!shouldUppercaseTextFieldProps(props)) return props;
  return wrapOnChange(props);
}

function isCompositionInputEvent(event: Event): boolean {
  return event instanceof InputEvent && event.isComposing;
}

export function installTextInputUppercase(): () => void {
  const onInputCapture = (event: Event) => {
    if (isCompositionInputEvent(event)) return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    syncUppercaseInTextInput(target);
  };

  const onBlurCapture = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    syncUppercaseInTextInput(target);
  };

  document.addEventListener("input", onInputCapture, true);
  document.addEventListener("blur", onBlurCapture, true);

  return () => {
    document.removeEventListener("input", onInputCapture, true);
    document.removeEventListener("blur", onBlurCapture, true);
  };
}
