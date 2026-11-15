const fs = require('fs');
const vm = require('vm');

// 1. Mock DOM Canvas Context
class MockContext {
    constructor() {
        this.fillStyle = '#000000';
        this.strokeStyle = '#000000';
        this.lineWidth = 1;
        this.imageSmoothingEnabled = true;
    }
    fillRect(x, y, w, h) {}
    strokeRect(x, y, w, h) {}
    beginPath() {}
    moveTo(x, y) {}
    lineTo(x, y) {}
    closePath() {}
    stroke() {}
    fill() {}
    arc(x, y, r, sa, ea) {}
    setLineDash(d) {}
    save() {}
    restore() {}
    translate(x, y) {}
    rotate(angle) {}
    clearRect(x, y, w, h) {}
}

global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') {
            return {
                width: 100,
                height: 100,
                getContext: () => new MockContext()
            };
        }
        return {};
    }
};
global.window = global;

const registeredTextures = new Map();
const mockScene = {
    textures: {
        exists: (key) => registeredTextures.has(key),
        remove: (key) => registeredTextures.delete(key),
        addCanvas: (key, canvas) => {
            registeredTextures.set(key, { width: canvas.width, height: canvas.height });
        }
    }
};

// 2. Load and verify graphics.js
vm.runInThisContext(fs.readFileSync('js/graphics.js', 'utf8'));
TextureGenerator.generateAll(mockScene);

console.log('Total Generated Textures:', registeredTextures.size);
for (const [key, meta] of registeredTextures.entries()) {
    console.log(` - ${key.padEnd(24)}: ${meta.width}x${meta.height}`);
}

// 3. Check all codebase references against registered textures
const files = ['js/game.js', 'js/ui.js', 'js/director.js', 'data/missions.js', 'data/parts.js', 'js/data.js'];
const allContent = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const prefixes = ['ship_', 'debris_', 'hazard_', 'equip_', 'particle_', 'station_', 'earth_', 'space_'];
const regex = new RegExp(`['"]((${prefixes.join('|')})[a-z0-9_]+)['"]`, 'g');

let match;
const usedKeys = new Set();
while ((match = regex.exec(allContent)) !== null) {
    usedKeys.add(match[1]);
}

console.log('\nChecking all codebase texture keys against generated textures:');
let missingCount = 0;
for (const key of usedKeys) {
    const exists = registeredTextures.has(key);
    console.log(`[${exists ? 'OK' : 'MISSING'}] ${key}`);
    if (!exists) missingCount++;
}

if (missingCount === 0) {
    console.log('\nSUCCESS: 100% of referenced texture keys exist and are procedurally generated in pixel art!');
    process.exit(0);
} else {
    console.error(`\nFAILURE: ${missingCount} texture keys missing!`);
    process.exit(1);
}
