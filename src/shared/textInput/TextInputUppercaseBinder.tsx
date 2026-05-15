import * as React from "react";
import { installTextInputUppercase } from "./uppercaseTextInput";

export default function TextInputUppercaseBinder() {
  React.useEffect(() => installTextInputUppercase(), []);
  return null;
}
