export {
  PRESERVE_CASE_ATTR,
  installTextInputUppercase,
  normalizeTextInputUppercase,
  prepareFormText,
  shouldUppercaseTextFieldProps,
  shouldUppercaseTextInput,
  syncUppercaseInTextInput,
  wrapInputElementProps,
  wrapTextareaElementProps,
} from "./uppercaseTextInput";
export { default as TextInputUppercaseBinder } from "./TextInputUppercaseBinder";

import { PRESERVE_CASE_ATTR } from "./uppercaseTextInput";

export const preserveCaseProps = { [PRESERVE_CASE_ATTR]: true } as const;
