function escapeHtml(raw: string): string {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitizeHttpUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString();
    return null;
  } catch {
    return null;
  }
}

export function renderBioMarkup(raw: string): string {
  const escaped = escapeHtml(raw);
  const withLinks = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
    const safe = sanitizeHttpUrl(url.replaceAll('&amp;', '&'));
    if (!safe) return `${label}`;
    return `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  return withLinks
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bio-inline-code">$1</code>')
    .replace(/\|\|(.+?)\|\|/g, '<span class="bio-spoiler" tabindex="0" role="button" onclick="this.classList.toggle(\'revealed\')">$1</span>')
    .replace(/\r?\n/g, '<br>');
}
