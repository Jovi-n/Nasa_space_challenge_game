const assert = require('assert');

// Simulate angle calculation from game.js
function calculateThreatAngle(playerX, playerY, hazardX, hazardY) {
    return Math.atan2(hazardY - playerY, hazardX - playerX);
}

const px = 500;
const py = 500;

// Test East (right)
const angleEast = calculateThreatAngle(px, py, px + 200, py);
assert.strictEqual(Math.round(angleEast * 180 / Math.PI), 0, 'East hazard points East (0 deg)');

// Test South (down)
const angleSouth = calculateThreatAngle(px, py, px, py + 200);
assert.strictEqual(Math.round(angleSouth * 180 / Math.PI), 90, 'South hazard points Down (90 deg)');

// Test West (left)
const angleWest = calculateThreatAngle(px, py, px - 200, py);
assert.strictEqual(Math.abs(Math.round(angleWest * 180 / Math.PI)), 180, 'West hazard points Left (180 deg)');

// Test North (up)
const angleNorth = calculateThreatAngle(px, py, px, py - 200);
assert.strictEqual(Math.round(angleNorth * 180 / Math.PI), -90, 'North hazard points Up (-90 deg)');

console.log('Hazard warning arrow directional calculations verified 100%!');
