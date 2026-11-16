const fs = require('fs');
const css = fs.readFileSync('css/style.css', 'utf8');
let depth = 0, line = 1, col = 0, errors = [];
for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    col++;
    if (ch === '\n') { line++; col = 0; }
    if (ch === '{') depth++;
    if (ch === '}') {
        depth--;
        if (depth < 0) {
            errors.push('Extra closing brace at line ' + line + ', col ' + col);
            depth = 0;
        }
    }
}
if (depth > 0) errors.push('Unclosed opening braces: ' + depth);
if (errors.length) {
    console.error('Errors found:', errors);
    process.exit(1);
} else {
    console.log('CSS braces perfectly balanced! Depth = 0');
}
