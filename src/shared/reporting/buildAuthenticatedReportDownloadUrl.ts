import { tokenStore } from "../api/tokenStore";
import type { ReportFormat } from "./reportFormat";
import { buildReportRequestUrl } from "./reportRequestUrl";

export function buildAuthenticatedReportDownloadUrl(
  path: string,
  format: ReportFormat = "pdf",
  query?: Record<string, string | number | boolean | undefined | null>
): string | null {
  const token = tokenStore.get();
  if (!token) {
    return null;
  }

  return buildReportRequestUrl(
    path,
    format,
    {
      ...query,
      access_token: token,
    },
    { absolute: true }
  );
}
