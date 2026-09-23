export function renderTemplate(
  template: string,
  fields: { firstName?: string; company?: string; title?: string }
): string {
  return template
    .replace(/\{\{\s*firstName\s*\}\}/gi, fields.firstName ?? "there")
    .replace(/\{\{\s*company\s*\}\}/gi, fields.company ?? "your company")
    .replace(/\{\{\s*title\s*\}\}/gi, fields.title ?? "your role");
}

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
