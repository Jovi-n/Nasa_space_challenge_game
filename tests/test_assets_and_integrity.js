const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const scriptRegex = /src=["']([^"']+)["']/g;
const linkRegex = /href=["']([^"']+\.css[^"']*)["']/g;

console.log('--- Checking Scripts in index.html ---');
let m;
while ((m = scriptRegex.exec(html)) !== null) {
    const src = m[1];
    const cleanPath = src.split('?')[0];
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        console.log(`[EXTERNAL] ${src}`);
    } else {
        const full = path.join(ROOT, cleanPath);
        const exists = fs.existsSync(full);
        console.log(`[LOCAL] ${cleanPath}: ${exists ? 'EXISTS (OK)' : 'MISSING (ERROR)'}`);
        if (!exists) process.exit(1);
    }
}

console.log('\n--- Checking CSS in index.html ---');
while ((m = linkRegex.exec(html)) !== null) {
    const href = m[1];
    const cleanPath = href.split('?')[0];
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        console.log(`[EXTERNAL] ${href}`);
    } else {
        const full = path.join(ROOT, cleanPath);
        const exists = fs.existsSync(full);
        console.log(`[LOCAL] ${cleanPath}: ${exists ? 'EXISTS (OK)' : 'MISSING (ERROR)'}`);
        if (!exists) process.exit(1);
    }
}

console.log('\nAll scripts and CSS files exist cleanly!');
