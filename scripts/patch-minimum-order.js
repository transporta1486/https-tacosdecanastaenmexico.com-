import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const file of readdirSync(root).filter((f) => f.endsWith('.html'))) {
  const filePath = path.join(root, file);
  let html = readFileSync(filePath, 'utf8');
  const original = html;

  html = html.replace(
    /<strong>Pedido mínimo:<\/strong> 20 tacos/g,
    '<strong>Pedido mínimo:</strong> 20 personas (100 tacos)'
  );
  html = html.replace(
    /<span class="delivery-wa-order__label">Cantidad<\/span>/g,
    '<span class="delivery-wa-order__label">Personas</span>'
  );
  html = html.replace(/Mínimo 20 tacos/g, 'Mín. 20 personas = 100 tacos (5 c/u)');

  if (html !== original) {
    writeFileSync(filePath, html);
    console.log('patched', file);
  }
}

console.log('Done.');
