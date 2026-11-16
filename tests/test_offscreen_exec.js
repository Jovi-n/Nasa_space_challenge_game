const fs = require('fs');

global.window = {};
global.Phaser = {
    Math: {
        Distance: {
            Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
        },
        Angle: {
            Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1)
        },
        Clamp: (v, min, max) => Math.min(Math.max(v, min), max)
    }
};

const mockGraphics = () => ({
    clear: () => {},
    fillStyle: () => {},
    lineStyle: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fillPath: () => {},
    strokePath: () => {},
    lineBetween: () => {},
    fillRect: () => {},
    strokeRect: () => {}
});

const gameCode = fs.readFileSync('js/game.js', 'utf8');

const extractMethod = (methodName) => {
    const lines = gameCode.split('\n');
    let start = -1;
    let end = -1;
    let depth = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith(`${methodName}(`) && start === -1) {
            start = i;
        }
        if (start !== -1) {
            depth += (lines[i].match(/{/g) || []).length;
            depth -= (lines[i].match(/}/g) || []).length;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    return lines.slice(start, end + 1).join('\n');
};

const offscreenCode = extractMethod('drawHUDOffscreenPointers');
console.log('Testing drawHUDOffscreenPointers...');

const scene = {
    player: { x: 500, y: 500 },
    cameras: { main: { width: 800, height: 600, scrollX: 100, scrollY: 100 } },
    hudGraphics: mockGraphics(),
    station: { x: 400, y: 400 },
    hazardGroup: {
        getChildren: () => [
            { active: true, x: 2500, y: 3500 },
            { active: true, x: -500, y: 500 },
            { active: true, x: 500, y: -500 },
            { active: false, x: 100, y: 100 }
        ]
    }
};

const fn = new Function(offscreenCode.replace('drawHUDOffscreenPointers()', ''));
try {
    fn.call(scene);
    console.log('[PASS] drawHUDOffscreenPointers executed cleanly without errors!');
} catch (e) {
    console.error('[FAIL] drawHUDOffscreenPointers threw error:', e);
}
