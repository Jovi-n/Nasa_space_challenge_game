const fs = require('fs');

// Mock Phaser & Browser
global.window = {};
global.Phaser = {
    Math: {
        Distance: {
            Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
        },
        Angle: {
            Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1)
        },
        Clamp: (v, min, max) => Math.min(Math.max(v, min), max),
        Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
    },
    Input: {
        Keyboard: {
            JustDown: () => false
        }
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

// Let's create an instance of OrbitalGameScene or test handleProximityRadar directly
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

console.log('Extracted handleProximityRadar:');
const proximityCode = extractMethod('handleProximityRadar');
console.log(proximityCode.slice(0, 150) + '...');

// Test execution with various hazard configurations
const scene = {
    player: { x: 500, y: 500 },
    cameras: { main: { width: 800, height: 600, scrollX: 100, scrollY: 100 } },
    time: { now: 1000 },
    effectiveRadarMultiplier: 1.0,
    radarMultiplier: 1.0,
    fxGraphics: mockGraphics(),
    hudGraphics: mockGraphics(),
    drawHUDOffscreenPointers: function() {},
    hazardGroup: {
        getChildren: () => [
            { active: true, x: 550, y: 520, hazardMeta: { warningRadius: 320 } },
            { active: true, x: 2000, y: 2000, hazardMeta: { warningRadius: 320 } }
        ]
    }
};

// Evaluate method on scene
const fn = new Function('dt', proximityCode.replace('handleProximityRadar(dt)', ''));
try {
    fn.call(scene, 0.016);
    console.log('[PASS] handleProximityRadar executed cleanly without errors!');
} catch (e) {
    console.error('[FAIL] handleProximityRadar threw error:', e);
}
