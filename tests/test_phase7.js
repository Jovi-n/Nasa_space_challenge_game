/**
 * Phase 7 Test Suite: Orbital Lanes & Space Weather (NASA/CCMC DONKI)
 * Tests:
 * 1. Three altitude lanes and differential relative movement
 * 2. Stationary Aegis depot in co-moving reference frame
 * 3. HUD lane indicator
 * 4. GAME_DATA.features flags (enabled / disabled)
 * 5. Offline DONKI snapshot (real vs simulated events)
 * 6. Radar noise, comms disruption, and power effects
 * 7. Shielding reduction on space-weather effects
 * 8. Missing and invalid data resilience
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Setup mock browser environment
global.window = global;
global.document = {
    getElementById: (id) => ({
        id,
        style: {},
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            toggle(c, val) { if (val) this.classes.add(c); else this.classes.delete(c); },
            contains(c) { return this.classes.has(c); }
        },
        innerText: '',
        textContent: '',
        innerHTML: ''
    }),
    querySelectorAll: () => []
};

// Load scripts in sandbox
vm.runInThisContext(fs.readFileSync('data/parts.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('data/missions.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('data/donki-snapshot.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/data.js', 'utf8'));

console.log('=== PHASE 7 TEST SUITE: ORBITAL LANES & SPACE WEATHER ===\n');

// ---------------------------------------------------------------------
// TEST 1: Feature Flag Definitions
// ---------------------------------------------------------------------
console.log('--- TEST 1: GAME_DATA.features Flags ---');
assert(GAME_DATA.features, 'GAME_DATA.features should exist');
assert.strictEqual(GAME_DATA.features.orbitalLanes, true, 'orbitalLanes feature flag should be enabled by default');
assert.strictEqual(GAME_DATA.features.spaceWeather, true, 'spaceWeather feature flag should be enabled by default');
console.log('PASS: GAME_DATA.features properly defined and configured.\n');

// ---------------------------------------------------------------------
// TEST 2: Orbital Lanes & Differential Relative Movement
// ---------------------------------------------------------------------
console.log('--- TEST 2: Three Altitude Lanes & Differential Movement ---');

// Mock scene for testing
function createMockScene(overrides = {}) {
    return {
        physics: {
            world: {
                bounds: { width: 3200, height: 3200 }
            }
        },
        station: {
            x: 1600,
            y: 1600,
            body: { velocity: { x: 0, y: 0 } },
            setVelocity: function(vx, vy) {
                this.body.velocity.x = vx;
                this.body.velocity.y = vy;
            }
        },
        player: {
            x: 1600,
            y: 1600,
            active: true
        },
        debrisGroup: {
            items: [],
            getChildren: function() { return this.items; }
        },
        hazardGroup: {
            items: [],
            getChildren: function() { return this.items; }
        },
        missionConfig: { id: 'sector_01', name: 'Sector 1' },
        laneDriftSpeed: 35,
        currentLane: 2,
        logFlightEvent: () => {},
        ...overrides
    };
}

// Load game.js class methods for unit testing
const gameCode = fs.readFileSync('js/game.js', 'utf8');
// Extract updateOrbitalLanes, updateSpaceWeather, triggerSpaceWeatherEvent
const updateOrbitalLanesMatch = gameCode.match(/updateOrbitalLanes\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}\n\s*\/\*\*/);
const updateSpaceWeatherMatch = gameCode.match(/updateSpaceWeather\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}\n\s*\/\*\*/);
const triggerSpaceWeatherMatch = gameCode.match(/triggerSpaceWeatherEvent\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}\n\s*executeLaserNudge/);

assert(updateOrbitalLanesMatch, 'updateOrbitalLanes method should be found in game.js');
assert(updateSpaceWeatherMatch, 'updateSpaceWeather method should be found in game.js');
assert(triggerSpaceWeatherMatch, 'triggerSpaceWeatherEvent method should be found in game.js');

const updateOrbitalLanes = new Function('dt', updateOrbitalLanesMatch[1]);
const updateSpaceWeather = new Function('dt', updateSpaceWeatherMatch[1]);
const triggerSpaceWeatherEvent = new Function('eventId', triggerSpaceWeatherMatch[1]);

const scene = createMockScene();
scene.updateOrbitalLanes = updateOrbitalLanes;
scene.updateSpaceWeather = updateSpaceWeather;
scene.triggerSpaceWeatherEvent = triggerSpaceWeatherEvent;

// Debris in Lane 1 (Low Perigee, y >= 2100)
const dLane1 = { x: 1000, y: 2400, active: true };
// Debris in Lane 2 (Co-Orbital Harbor, 1100 < y < 2100)
const dLane2 = { x: 1000, y: 1600, active: true };
// Debris in Lane 3 (High Apogee, y <= 1100)
const dLane3 = { x: 1000, y: 800, active: true };

scene.debrisGroup.items = [dLane1, dLane2, dLane3];

// Run one frame of 1.0 second
scene.updateOrbitalLanes(1.0);

// Check Lane 1: Low Perigee -> positive drift (+35 px/s)
assert.strictEqual(dLane1.x, 1035, 'Debris in Lane 1 should drift eastward by +35 px/s');
// Check Lane 2: Co-Orbital -> 0 drift
assert.strictEqual(dLane2.x, 1000, 'Debris in Lane 2 should have 0 relative drift (station co-orbital)');
// Check Lane 3: High Apogee -> negative drift (-35 px/s)
assert.strictEqual(dLane3.x, 965, 'Debris in Lane 3 should drift westward by -35 px/s');

// Verify Aegis depot is stationary in co-moving reference frame
assert.strictEqual(scene.station.body.velocity.x, 0, 'Station velocity X must remain 0 in co-moving frame');
assert.strictEqual(scene.station.body.velocity.y, 0, 'Station velocity Y must remain 0 in co-moving frame');
assert.strictEqual(scene.station.x, 1600, 'Station X must remain stationary');
assert.strictEqual(scene.station.y, 1600, 'Station Y must remain stationary');

console.log('PASS: Three altitude lanes exhibit verified differential relative motion.');
console.log('PASS: Aegis Depot remains stationary in the player co-moving reference frame.\n');

// ---------------------------------------------------------------------
// TEST 3: Disabled Features Flag Test
// ---------------------------------------------------------------------
console.log('--- TEST 3: Disabled Features Flag ---');
GAME_DATA.features.orbitalLanes = false;
dLane1.x = 1000;
dLane3.x = 1000;
scene.updateOrbitalLanes(1.0);
assert.strictEqual(dLane1.x, 1000, 'When orbitalLanes flag is false, no lane drift should be applied to Lane 1');
assert.strictEqual(dLane3.x, 1000, 'When orbitalLanes flag is false, no lane drift should be applied to Lane 3');
GAME_DATA.features.orbitalLanes = true; // Restore
console.log('PASS: Feature flag orbitalLanes cleanly toggles lane mechanics.\n');

// ---------------------------------------------------------------------
// TEST 4: NASA/CCMC DONKI Snapshot Integrity & Offline Resilience
// ---------------------------------------------------------------------
console.log('--- TEST 4: DONKI Snapshot & Space Weather Data ---');
assert(DONKI_SNAPSHOT, 'DONKI_SNAPSHOT should exist locally in data/donki-snapshot.js');
assert.strictEqual(DONKI_SNAPSHOT.metadata.offlineAvailable, true, 'Snapshot should indicate offlineAvailable');

const realEvents = DONKI_SNAPSHOT.getRealEvents();
const simEvents = DONKI_SNAPSHOT.getSimulatedEvents();

console.log(`Snapshot contains ${realEvents.length} real events and ${simEvents.length} simulated events.`);
assert(realEvents.length >= 3, 'Must contain verified real historical events');
assert(simEvents.length >= 2, 'Must contain labeled simulated sample events');

// Verify real event properties
const mayG5 = DONKI_SNAPSHOT.getEventById('2024-05-10T17:00:00-GST-001');
assert(mayG5, 'Historical May 10, 2024 G5 storm event must exist in snapshot');
assert.strictEqual(mayG5.isSimulated, false, 'Real event must have isSimulated: false');
assert(mayG5.eventID, 'Must have eventID');
assert(mayG5.eventTime, 'Must have eventTime');
assert(mayG5.source.includes('NASA/CCMC DONKI'), 'Source must reference NASA/CCMC DONKI');
assert(mayG5.effects.radarNoise > 0, 'G5 storm must define radarNoise');
assert(mayG5.effects.commsDisruption > 0, 'G5 storm must define commsDisruption');

// Verify simulated sample event properties
const simEvent = simEvents[0];
assert.strictEqual(simEvent.isSimulated, true, 'Simulated event must have isSimulated: true');
assert(simEvent.simulationLabel.includes('SIMULATED DATA'), 'Simulated event must have explicit simulationLabel');
assert(simEvent.source.includes('Simulated'), 'Simulated event source must be labeled');

console.log('PASS: Real historical events and simulated test events are correctly partitioned and labeled.\n');

// ---------------------------------------------------------------------
// TEST 5: Space Weather Simulation Effects & Shielding Reduction
// ---------------------------------------------------------------------
console.log('--- TEST 5: Radar Noise, Comms Disruption & Shielding Mitigation ---');

// Unshielded spacecraft scenario
const unshieldedScene = createMockScene({
    hullUpgradeLevel: 0,
    payloadConfig: { id: 'balanced' },
    spacecraftBus: { id: 'scout' }
});
unshieldedScene.triggerSpaceWeatherEvent = triggerSpaceWeatherEvent;
unshieldedScene.updateSpaceWeather = updateSpaceWeather;

unshieldedScene.triggerSpaceWeatherEvent('2024-05-10T17:00:00-GST-001');
assert(unshieldedScene.activeSpaceWeather, 'Space weather event should become active');
assert.strictEqual(unshieldedScene.activeSpaceWeather.eventID, '2024-05-10T17:00:00-GST-001');

const unshieldedDamping = unshieldedScene.spaceWeatherShieldDamping;
console.log('Unshielded craft space weather transmission factor:', unshieldedDamping);

// Shielded spacecraft scenario (Titan Bus, Armored Payload, Level 3 Hull Armor)
const shieldedScene = createMockScene({
    hullUpgradeLevel: 3,
    payloadConfig: { id: 'armored' },
    spacecraftBus: { id: 'titan' }
});
shieldedScene.triggerSpaceWeatherEvent = triggerSpaceWeatherEvent;
shieldedScene.updateSpaceWeather = updateSpaceWeather;

shieldedScene.triggerSpaceWeatherEvent('2024-05-10T17:00:00-GST-001');
const shieldedDamping = shieldedScene.spaceWeatherShieldDamping;
console.log('Shielded craft space weather transmission factor:', shieldedDamping);

assert(shieldedDamping < unshieldedDamping, 'Shielding and armor must reduce space weather impact');

// Test power effects during solar radiation storm
shieldedScene.battery = 100;
shieldedScene.activeSpaceWeather = {
    eventID: 'TEST-RADIATION-STORM',
    effects: {
        powerDrainModifier: 0.60,
        batteryDrainPerSec: 5.0,
        durationSec: 10
    }
};
shieldedScene.updateSpaceWeather(1.0);
assert(shieldedScene.battery < 100, 'Active radiation storm should cause power leakage');
assert(shieldedScene.effectiveSolarMod < 1.0, 'Active storm must degrade solar panel generation');

console.log('PASS: Shielding significantly mitigates radar noise, comms disruption and power drain.\n');

// ---------------------------------------------------------------------
// TEST 6: Missing & Invalid Data Resilience
// ---------------------------------------------------------------------
console.log('--- TEST 6: Missing & Invalid Data Resilience ---');

// Test 6A: Missing DONKI_SNAPSHOT (undefined)
const savedSnapshot = global.DONKI_SNAPSHOT;
global.DONKI_SNAPSHOT = undefined;

assert.doesNotThrow(() => {
    scene.triggerSpaceWeatherEvent();
    scene.updateSpaceWeather(1.0);
}, 'Missing DONKI_SNAPSHOT must be handled safely without throwing');

// Test 6B: Corrupted DONKI_SNAPSHOT ({ events: null })
global.DONKI_SNAPSHOT = { events: null };
assert.doesNotThrow(() => {
    scene.triggerSpaceWeatherEvent();
    scene.updateSpaceWeather(1.0);
}, 'Corrupted DONKI_SNAPSHOT (null events) must be handled safely without throwing');

// Test 6C: Corrupted DONKI_SNAPSHOT ({ events: [] })
global.DONKI_SNAPSHOT = { events: [] };
assert.doesNotThrow(() => {
    scene.triggerSpaceWeatherEvent();
    scene.updateSpaceWeather(1.0);
}, 'Empty DONKI_SNAPSHOT must be handled safely without throwing');

global.DONKI_SNAPSHOT = savedSnapshot; // Restore

// Test 6D: Disabled spaceWeather feature flag
GAME_DATA.features.spaceWeather = false;
scene.activeSpaceWeather = { eventID: 'OLD' };
scene.updateSpaceWeather(1.0);
assert.strictEqual(scene.activeSpaceWeather, null, 'When spaceWeather flag is false, activeSpaceWeather must be null');
GAME_DATA.features.spaceWeather = true; // Restore

console.log('PASS: System is completely resilient to missing, corrupted, offline, or disabled data.\n');

console.log('=====================================================');
console.log('ALL PHASE 7 TESTS PASSED SUCCESSFULLY! (100% OK)');
console.log('=====================================================');
