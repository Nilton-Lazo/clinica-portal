export function formatActionIssues(intro: string, issues: string[]): string {
  const cleanIssues = issues.map((x) => x.trim()).filter(Boolean);
  if (cleanIssues.length === 0) return intro;
  return `${intro}: ${cleanIssues.join("; ")}.`;
}

