export function slugifyCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function cleanSnippet(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/\.\.\./g, "")
    .replace(/\r\n/g, "\n")
    .replace(/<b>/g, "")
    .replace(/<\/b>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function formatSalary(salary: string): string {
  return salary.replace(/[\d,]+/g, (match) =>
    Number(match.replace(/,/g, "")).toLocaleString()
  );
}
