// Статический снимок DOM: снимаем скрипты, переводим ассеты на локальные пути.

export async function saveSnapshot(page, outDir, harvester, slug) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  const localize = (text) => {
    let out = String(text);
    for (const [url, record] of harvester.map) {
      out = out.split(url).join(`/demo/${slug}/${record.file}`);
    }
    return out;
  };

  // Абсолютизируем адреса, чтобы их можно было сопоставить с сохранёнными ассетами.
  await page
    .evaluate(() => {
      for (const el of document.querySelectorAll('[src]')) el.setAttribute('src', el.src);
      for (const el of document.querySelectorAll('[href]')) el.setAttribute('href', el.href);
      for (const el of document.querySelectorAll('[poster]')) el.setAttribute('poster', el.poster);
    })
    .catch(() => null);

  const raw = await page.content();
  await fs.writeFile(path.join(outDir, 'dom.raw.html'), raw);

  let html = raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/<meta[^>]+http-equiv="content-security-policy"[^>]*>/gi, '')
    .replace(/\sintegrity="[^"]*"/gi, '');

  html = localize(html);

  const banner = `<!-- Статический снимок для чтения структуры. Скрипты удалены, ассеты локальные. Живой DOM: dom.raw.html -->\n`;
  await fs.writeFile(path.join(outDir, 'reference.html'), banner + html);

  const styles = await page.evaluate(() =>
    Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return `/* ${sheet.href || 'inline'} */\n` + Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
        } catch {
          return `/* ${sheet.href || 'inline'}: правила недоступны из JS */`;
        }
      })
      .join('\n\n')
  );
  await fs.writeFile(path.join(outDir, 'styles') + '.css', localize(styles));
  return { html: 'reference.html', css: 'styles.css' };
}
