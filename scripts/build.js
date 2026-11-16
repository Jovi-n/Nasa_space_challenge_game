const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('[Build] Packaging Orbital Cleanup for Production Deployment...');

// Clean or recreate dist directory
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Items to copy to dist
const itemsToCopy = [
    'index.html',
    'css',
    'js',
    'data',
    'assets',
    'README.md',
    'USER_MANUAL.md'
];

itemsToCopy.forEach(item => {
    const srcPath = path.join(ROOT_DIR, item);
    const destPath = path.join(DIST_DIR, item);
    if (fs.existsSync(srcPath)) {
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
            console.log(`  ✓ Copied directory: ${item}/`);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`  ✓ Copied file: ${item}`);
        }
    }
});

console.log('[Build] Production bundle created in ./dist successfully!');
