import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const snippet = readFileSync(path.join(root, 'partials', 'hero-service-info.html'), 'utf8');

const files = readdirSync(root).filter((f) => f.endsWith('.html') && f !== 'privacidad.html' && f !== 'terminos.html');

for (const file of files) {
  const filePath = path.join(root, file);
  let html = readFileSync(filePath, 'utf8');

  if (html.includes('delivery-hero__service-info')) {
    console.log('skip (already has block):', file);
    continue;
  }

  if (file === 'index.html') {
    html = html.replace(
      /(<p class="delivery-hero__subtitle">[\s\S]*?<\/p>)\s*\n\s*(<a href="https:\/\/wa\.me\/525588180117)/,
      `$1\n\n${snippet}$2`
    );
  } else {
    html = html.replace(
      /(\s*)(<a href="https:\/\/wa\.me\/525588180117\?text=Hola,%20vi%20tu%20pagina%20y%20quiero%20hacer%20un%20pedido%20de%20tacos" target="_blank"\s*\n\s*class="btn-warning)/,
      `\n${snippet}$1$2`
    );
  }

  if (!html.includes('delivery-hero__service-info')) {
    console.error('FAILED to insert in', file);
    continue;
  }

  writeFileSync(filePath, html);
  console.log('updated', file);
}

console.log('Done.');
