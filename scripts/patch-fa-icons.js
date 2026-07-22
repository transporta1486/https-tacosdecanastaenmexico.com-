import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const file of readdirSync(root).filter((f) => f.endsWith('.html'))) {
  const filePath = path.join(root, file);
  let html = readFileSync(filePath, 'utf8');
  const original = html;

  html = html.replace(/class="fa fa-phone"/g, 'class="fas fa-phone"');
  html = html.replace(/fas fa-phone-alt/g, 'fas fa-phone');

  if (html !== original) {
    writeFileSync(filePath, html);
    console.log('patched', file);
  }
}

console.log('Done.');
