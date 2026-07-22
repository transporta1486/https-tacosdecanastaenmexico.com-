import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const data = JSON.parse(readFileSync(path.join(root, 'data', 'municipality-seo.json'), 'utf8'));
const utf8 = new TextEncoder();

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const [file, content] of Object.entries(data)) {
  const filePath = path.join(root, file);
  let html = readFileSync(filePath, 'utf8');

  html = html.replace(/https:\/\/tacoscanasta\.com/g, 'https://tacosdecanastaenmexico.com');

  const introBlock = `
    <section class="delivery-local-intro" aria-label="Cobertura local">
        <div class="delivery-local-intro__inner">
            <p class="delivery-local-intro__text">${content.intro}</p>
        </div>
    </section>
`;

  if (!html.includes('delivery-local-intro')) {
    html = html.replace(
      /(\s*<\/section>\s*\n\s*<section id="como-funciona")/,
      `\n${introBlock}$1`
    );
  } else {
    html = html.replace(
      /<p class="delivery-local-intro__text">[\s\S]*?<\/p>/,
      `<p class="delivery-local-intro__text">${content.intro}</p>`
    );
  }

  const stepTexts = [...html.matchAll(/<p class="delivery-step__text">([\s\S]*?)<\/p>/g)];
  if (stepTexts.length >= 3) {
    content.steps.forEach((text, i) => {
      html = html.replace(stepTexts[i][0], `<p class="delivery-step__text">${text}</p>`);
    });
  }

  html = html.replace(
    /<p class="subtitulo-empresa">[\s\S]*?<\/p>/,
    `<p class="subtitulo-empresa">${content.empresa}</p>`
  );

  writeFileSync(filePath, html);
  console.log('updated', file);
}

const indexPath = path.join(root, 'index.html');
let indexHtml = readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace(/https:\/\/tacoscanasta\.com/g, 'https://tacosdecanastaenmexico.com');
writeFileSync(indexPath, indexHtml);

for (const file of ['privacidad.html', 'terminos.html']) {
  const p = path.join(root, file);
  let h = readFileSync(p, 'utf8');
  h = h.replace(/https:\/\/tacoscanasta\.com/g, 'https://tacosdecanastaenmexico.com');
  writeFileSync(p, h);
  console.log('canonical', file);
}

console.log('Done.');
