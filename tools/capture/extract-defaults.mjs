// Извлекает базовый профиль из createDefaultProfile(), чтобы не держать вторую копию defaults.
// Запуск: node tools/capture/extract-defaults.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const sourcePath = path.join(root, 'web', 'src', 'lib', 'schema', 'profile.ts');
const outPath = path.join(here, 'base-profile.json');

export function extractDefaults(text) {
  const start = text.indexOf('export function createDefaultProfile');
  if (start < 0) throw new Error('createDefaultProfile не найден');
  const open = text.indexOf('return {', start);
  if (open < 0) throw new Error('return { не найден');
  const rest = text.slice(open);
  const match = /\r?\n  \};\r?\n\}/.exec(rest);
  if (!match) throw new Error('конец литерала не найден');
  const literal = rest
    .slice('return '.length, match.index + match[0].indexOf(';') + 1)
    .replace(/;\s*$/, '')
    .replace(/(^|[\s{(,])\/\/[^\r\n]*/g, '$1')
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
    .replace(/'/g, '"')
    .replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(literal);
}

const text = await fs.readFile(sourcePath, 'utf8');
const defaults = extractDefaults(text);
await fs.writeFile(outPath, JSON.stringify(defaults, null, 2) + '\n');
console.log(`записано ${outPath}: ${Object.keys(defaults).length} корневых полей`);
