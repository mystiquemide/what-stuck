/** Escape text before it goes into an email's HTML. Member replies are untrusted. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain, readable email shell. Inline styles only, since many mail apps strip <style>. */
export function emailLayout(body: string, footer: string, lang = "en"): string {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#faf7f2;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#1c1917;font-size:18px;line-height:1.6;">
${body}
<hr style="border:none;border-top:1px solid #e7e5e4;margin:32px 0 16px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#57534e;">${footer}</div>
</div></body></html>`;
}
