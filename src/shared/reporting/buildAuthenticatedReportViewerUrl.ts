import { tokenStore } from "../api/tokenStore";
import type { ReportFormat } from "./reportFormat";
import { buildReportRequestUrl } from "./reportRequestUrl";

export function buildAuthenticatedReportViewerUrl(
  path: string,
  format: ReportFormat = "pdf",
  query?: Record<string, string | number | boolean | undefined | null>
): string | null {
  const token = tokenStore.get();
  if (!token) {
    return null;
  }

  const base = buildReportRequestUrl(
    path,
    format,
    {
      ...query,
      inline: 1,
      access_token: token,
    },
    { absolute: true }
  );

  return `${base}#view=FitH&toolbar=1&navpanes=0&pagemode=none&scrollbar=1`;
}
