/**
 * Automated Verification Suite for Space Weather & Storm Hazard Mechanics
 */

const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: SPACE WEATHER & STORM HAZARD MECHANICS ===\n');

// 1. Mock minimal environment
global.window = global;
global.GAME_DATA = {
    features: {
        spaceWeather: true,
        orbitalLanes: true
    }
};
global.Phaser = {
    Math: {
        Between: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
        Clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
        Distance: {
            Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
        },
        Angle: {
            Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
            Wrap: (a) => a
        },
        Linear: (a, b, t) => a + (b - a) * t
    }
};

// 2. Load game.js class methods
const gameCode = fs.readFileSync('js/game.js', 'utf8');

const updateSpaceWeatherMatch = gameCode.match(/updateSpaceWeather\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}\n\s*\/\*\*/);
const triggerStormSurgeMatch = gameCode.match(/triggerStormPlasmaSurge\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}\n\s*handleDebrisDebrisCollision/);

assert(updateSpaceWeatherMatch, 'updateSpaceWeather should be found');
assert(triggerStormSurgeMatch, 'triggerStormPlasmaSurge should be found');

const updateSpaceWeather = new Function('dt', updateSpaceWeatherMatch[1]);
const triggerStormPlasmaSurge = new Function(triggerStormSurgeMatch[1]);

// ---------------------------------------------------------------------
// TEST 1: Kinetic Solar Wind Drag Force
// ---------------------------------------------------------------------
console.log('--- TEST 1: Solar Wind & Drag Hazard Force ---');
const testDebris = { active: true, body: { velocity: { x: 0, y: 0 } }, isPendingCollection: false };
const scene1 = {
    activeSpaceWeather: {
        effects: { durationSec: 20 }
    },
    isStormSeason: true,
    spaceWeatherShieldDamping: 1.0,
    stormWindAngle: 0, // Blowing directly along X axis
    player: {
        active: true,
        body: { velocity: { x: 0, y: 0 } }
    },
    debrisGroup: {
        getChildren: () => [testDebris]
    },
    logFlightEvent: () => {}
};
scene1.updateSpaceWeather = updateSpaceWeather;

scene1.updateSpaceWeather(1.0);

assert(scene1.player.body.velocity.x > 0, 'Solar wind must exert positive kinetic drag force on player craft along wind angle');
assert(testDebris.body.velocity.x > 0, 'Solar wind must push drifting space debris along wind vector');
console.log(`PASS: Solar wind accelerated player by ${scene1.player.body.velocity.x.toFixed(1)} px/s and debris by ${testDebris.body.velocity.x.toFixed(1)} px/s.\n`);

// ---------------------------------------------------------------------
// TEST 2: Coronal Plasma EMP Surge Hazard (Caught in Open Space)
// ---------------------------------------------------------------------
console.log('--- TEST 2: Coronal Plasma EMP Surge (Open Space Hazard) ---');
const openSpaceScene = {
    player: { x: 800, y: 800, active: true },
    station: { x: 1600, y: 1600 }, // Far away from station (distance ~1131px > 230px depot radius)
    stationDockingRadius: 180,
    spaceWeatherShieldDamping: 1.0,
    hull: 100,
    battery: 100,
    cameras: { main: { shake: () => {} } },
    particleEmitterSpark: { explode: () => {} },
    particleEmitterShockwave: { explode: () => {} },
    showFloatingText: () => {},
    logFlightEvent: () => {}
};
openSpaceScene.triggerStormPlasmaSurge = triggerStormPlasmaSurge;

openSpaceScene.triggerStormPlasmaSurge();

assert(openSpaceScene.hull < 100, 'Player caught in open space must take electrostatic damage from coronal plasma surge');
assert(openSpaceScene.battery < 100, 'Coronal surge must discharge craft battery');
assert(openSpaceScene.stormAvionicsJitterTimer > 0, 'Coronal surge must trigger avionics single-event upset instability timer');
console.log(`PASS: Unshielded open space hit: Hull dropped to ${openSpaceScene.hull} HP, Battery dropped to ${openSpaceScene.battery}, Avionics jittered.\n`);

// ---------------------------------------------------------------------
// TEST 3: Aegis Depot Faraday Haven (Safe Shelter from Storm)
// ---------------------------------------------------------------------
console.log('--- TEST 3: Aegis Depot Faraday Haven Shelter ---');
const shelteredScene = {
    player: { x: 1620, y: 1610, active: true }, // Docked / right next to depot (distance ~22px)
    station: { x: 1600, y: 1600 },
    stationDockingRadius: 180,
    spaceWeatherShieldDamping: 1.0,
    hull: 100,
    battery: 100,
    cameras: { main: { shake: () => {} } },
    showFloatingText: (x, y, text) => { shelteredScene._lastText = text; },
    logFlightEvent: () => {}
};
shelteredScene.triggerStormPlasmaSurge = triggerStormPlasmaSurge;

shelteredScene.triggerStormPlasmaSurge();

assert.strictEqual(shelteredScene.hull, 100, 'Player within depot perimeter must take ZERO damage (Faraday shield haven)');
assert.strictEqual(shelteredScene.battery, 100, 'Battery must not be discharged inside depot Faraday haven');
assert(shelteredScene._lastText.includes('FARADAY SHIELD'), 'Should announce Faraday shield grounding');
console.log('PASS: Aegis Depot perimeter safely shielded craft from EMP plasma wave with zero damage.\n');

// ---------------------------------------------------------------------
// TEST 4: Whipple Shielding Mitigation on Surge Damage
// ---------------------------------------------------------------------
console.log('--- TEST 4: Whipple Shielding Mitigation on Surge ---');
const armoredScene = {
    player: { x: 800, y: 800, active: true },
    station: { x: 1600, y: 1600 },
    stationDockingRadius: 180,
    spaceWeatherShieldDamping: 0.35, // High shielding
    hull: 100,
    battery: 100,
    cameras: { main: { shake: () => {} } },
    particleEmitterSpark: { explode: () => {} },
    particleEmitterShockwave: { explode: () => {} },
    showFloatingText: () => {},
    logFlightEvent: () => {}
};
armoredScene.triggerStormPlasmaSurge = triggerStormPlasmaSurge;

armoredScene.triggerStormPlasmaSurge();

const unshieldedDamage = 100 - openSpaceScene.hull;
const armoredDamage = 100 - armoredScene.hull;
console.log(`Unshielded damage: ${unshieldedDamage} HP vs Armored damage: ${armoredDamage} HP`);
assert(armoredDamage < unshieldedDamage, 'Whipple armor & Titan bus shielding must significantly reduce plasma surge damage');
console.log('PASS: Spacecraft shielding effectively damped storm hazard severity.\n');

// ---------------------------------------------------------------------
// TEST 5: Continuous Storm Season Re-triggering
// ---------------------------------------------------------------------
console.log('--- TEST 5: Storm Season Continuous Hazard Persistence ---');
let triggeredNewEvent = false;
const stormSeasonScene = {
    activeSpaceWeather: {
        eventID: 'OLD-STORM',
        effects: { durationSec: 0.5 }
    },
    isStormSeason: true,
    spaceWeatherTimer: 0.1,
    spaceWeatherShieldDamping: 1.0,
    triggerSpaceWeatherEvent: () => { triggeredNewEvent = true; },
    logFlightEvent: () => {}
};
stormSeasonScene.updateSpaceWeather = updateSpaceWeather;

// Step 1.0 second (timer expires)
stormSeasonScene.updateSpaceWeather(1.0);
assert(triggeredNewEvent, 'Storm season modifier must immediately queue the next storm disturbance to maintain continuous hazard');
console.log('PASS: Storm season maintains continuous hazard presence throughout the mission.\n');

console.log('=====================================================');
console.log('ALL STORM HAZARD TESTS PASSED SUCCESSFULLY! (100% OK)');
console.log('=====================================================\n');
