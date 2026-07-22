import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const orderForm = readFileSync(path.join(root, 'partials', 'hero-whatsapp-order.html'), 'utf8');

const files = readdirSync(root).filter(
    (f) => f.endsWith('.html') && f !== 'privacidad.html' && f !== 'terminos.html'
);

for (const file of files) {
    const filePath = path.join(root, file);
    let html = readFileSync(filePath, 'utf8');

    html = html.replace(/wa\.me\/5588180117/g, 'wa.me/525588180117');
    html = html.replace(/href="tel:5588180117"/g, 'href="tel:+525588180117"');

    if (!html.includes('id="hero-wa-order"')) {
        html = html.replace(
            /(<\/ul>\s*\n)(\s*)(<a href="https:\/\/wa\.me\/525588180117)/,
            `$1\n${orderForm}\n$2$3`
        );
    }

    if (!html.includes('whatsapp.js')) {
        html = html.replace(
            /<script src="app\.js"><\/script>/,
            '<script src="whatsapp.js"></script>\n    <script src="app.js"></script>'
        );
    }

    writeFileSync(filePath, html);
    console.log('updated', file);
}

console.log('Done.');
