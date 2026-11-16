/**
 * Orbital Cleanup: Mission Zero
 * Comprehensive Phase 9 Pre-Submission Audit Script
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const uiJs = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');
const gameJs = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
const campaignJs = fs.readFileSync(path.join(ROOT, 'js/campaign.js'), 'utf8');
const dataJs = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
const audioJs = fs.readFileSync(path.join(ROOT, 'js/audio.js'), 'utf8');
const missionsJs = fs.readFileSync(path.join(ROOT, 'data/missions.js'), 'utf8');
const storyletsJs = fs.readFileSync(path.join(ROOT, 'data/storylets.js'), 'utf8');
const partsJs = fs.readFileSync(path.join(ROOT, 'data/parts.js'), 'utf8');
const graphicsJs = fs.readFileSync(path.join(ROOT, 'js/graphics.js'), 'utf8');
const donkiJs = fs.readFileSync(path.join(ROOT, 'data/donki-snapshot.js'), 'utf8');

let errors = [];
let passedChecks = 0;

function assert(condition, message) {
    if (!condition) {
        errors.push(message);
        console.error(`[FAIL] ${message}`);
    } else {
        passedChecks++;
        console.log(`[PASS] ${message}`);
    }
}

console.log('=== STEP 1: UI AUDIT & BUTTON EVENT COVERAGE ===');
const buttonIds = [...html.matchAll(/id=["'](btn-[^"']+)["']/g)].map(m => m[1]);
console.log(`Discovered ${buttonIds.length} unique button IDs in index.html.`);

buttonIds.forEach(id => {
    // Check if referenced in js/ui.js or has inline onclick in index.html or is handled by delegation
    const isHandledInUI = uiJs.includes(id) || html.includes(`id="${id}" onclick=`) || html.includes(`id="${id}" class="btn-secondary btn-close-modal"`);
    assert(isHandledInUI, `Button #${id} is referenced and handled`);
});

console.log('\n=== STEP 2: MODAL CLOSE & CANCEL BUTTON AUDIT ===');
const modalCloseClasses = [...html.matchAll(/class=["'][^"']*(modal-close|btn-close-modal|modal-cancel)[^"']*["']/g)];
assert(modalCloseClasses.length > 0, `Found ${modalCloseClasses.length} modal dismiss targets.`);
assert(uiJs.includes('.btn-close-modal') || uiJs.includes('btn-close-modal'), 'js/ui.js handles modal close clicks');

console.log('\n=== STEP 3: ASSET & TEXTURE INTEGRITY ===');
assert(gameJs.includes('earth_bg'), 'Texture earth_bg referenced');
assert(gameJs.includes('space_station'), 'Texture space_station referenced');
assert(partsJs.includes('ship_scout') && graphicsJs.includes('ship_scout'), 'Texture ship_scout defined in parts and graphics');
assert(partsJs.includes('ship_collector') && graphicsJs.includes('ship_collector'), 'Texture ship_collector defined in parts and graphics');
assert(partsJs.includes('ship_lifter') && graphicsJs.includes('ship_lifter'), 'Texture ship_lifter defined in parts and graphics');
assert(gameJs.includes('debris_fragment'), 'Texture debris_fragment referenced');

console.log('\n=== STEP 4: PHYSICS LIMITS, POOLING & OBJECT CLEANUP ===');
assert(gameJs.includes('processPendingPhysicsActions'), 'Safe deferred physics queue exists');
assert(gameJs.includes('pendingCollections'), 'Safe pending collections queue exists');
assert(gameJs.includes('pendingHazardDestructions'), 'Safe hazard destruction queue exists');
assert(gameJs.includes('processStationRecycling'), 'Salvage collection and recycling properly unloads debris');
assert(gameJs.includes('this.physics.world.bounds') || gameJs.includes('setCollideWorldBounds'), 'Physics world boundaries explicitly constrained');

console.log('\n=== STEP 5: SAVE SCHEMA & PERSISTENCE SAFETY ===');
// Test localStorage mock
const storageMock = {};
const mockWindow = {
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: {
        getItem: (k) => storageMock[k] || null,
        setItem: (k, v) => { storageMock[k] = String(v); },
        removeItem: (k) => { delete storageMock[k]; },
        clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
    }
};
mockWindow.window = mockWindow;

const sandbox = {
    window: mockWindow,
    localStorage: mockWindow.localStorage,
    console: console,
    Math: Math,
    Object: Object,
    Array: Array,
    JSON: JSON
};
vm.createContext(sandbox);

vm.runInContext(partsJs, sandbox);
vm.runInContext(missionsJs, sandbox);
vm.runInContext(donkiJs, sandbox);
vm.runInContext(storyletsJs, sandbox);
vm.runInContext(campaignJs, sandbox);
vm.runInContext(dataJs, sandbox);

assert(typeof sandbox.window.OrbitalStorage !== 'undefined', 'OrbitalStorage loaded successfully');
assert(typeof sandbox.window.GAME_DATA !== 'undefined', 'GAME_DATA loaded successfully');

// Test Fresh Save
const freshSave = sandbox.window.OrbitalStorage.load();
assert(freshSave.saveVersion === 2, 'Fresh save version is 2');
assert(typeof freshSave.campaignSeed === 'string' || typeof freshSave.campaignSeed === 'number', 'Fresh save has valid campaign seed');
assert(typeof freshSave.worldEpochDay === 'number', 'Fresh save has worldEpochDay');
assert(typeof freshSave.techTree === 'object', 'Fresh save has techTree');

// Test Legacy v1 Migration
const legacyV1 = {
    scrap: 2500,
    unlockedSector: 3,
    upgrades: { thruster: 2, hull: 1, battery: 2, cargo: 1, radar: 1 },
    selectedShip: 'collector',
    selectedEquipment: 'net',
    selectedPayload: 'extended_fuel',
    stats: { totalDebrisRecycled: 42, totalMissionsCompleted: 5 }
};
const migrated = sandbox.window.OrbitalStorage.migrateToV2(legacyV1);
assert(migrated.saveVersion === 2, 'Migrated save upgraded to version 2');
assert(migrated.scrap === 2500, 'Scrap preserved');
assert(migrated.unlockedSector === 3, 'Sector progress preserved');
assert(migrated.techTree.capture === 1, 'Tech tree properly backfilled');
assert(migrated.assetRegistry && Object.keys(migrated.assetRegistry).length > 0, 'Asset registry properly backfilled');

console.log('\n=== STEP 6: AUDIO SYNTHESIZER INTEGRITY ===');
assert(audioJs.includes('setThruster'), 'Audio: setThruster synthesized');
assert(audioJs.includes('playCollect'), 'Audio: playCollect synthesized');
assert(audioJs.includes('playDockingRecycle'), 'Audio: playDockingRecycle synthesized');
assert(audioJs.includes('playConjunctionAlarm'), 'Audio: playConjunctionAlarm synthesized');
assert(audioJs.includes('playWarning'), 'Audio: playWarning synthesized');
assert(audioJs.includes('toggleSFX') && audioJs.includes('toggleMusic'), 'Audio: mute & audio toggles functional');

console.log('\n=== STEP 7: ALL SECTORS, HAZARDS & MISSIONS COVERAGE ===');
const sectors = sandbox.window.MISSIONS_DATA || sandbox.window.GAME_DATA.LEVELS;
assert(Array.isArray(sectors) && sectors.length === 8, `All 8 orbital sectors defined (found ${sectors.length})`);
sectors.forEach((sec, idx) => {
    assert(sec.id && sec.name && (sec.altitudeKm || sec.targetAltitudeKm), `Sector ${idx + 1} (${sec.name}) has valid id, name, altitude`);
});

console.log('\n=== STEP 8: CAMPAIGN MANAGERS & ENDINGS AUDIT ===');
assert(typeof sandbox.window.CampaignManager !== 'undefined', 'CampaignManager loaded');
assert(typeof sandbox.window.StoryletManager !== 'undefined', 'StoryletManager loaded');
assert(typeof sandbox.window.CAMPAIGN_ENDINGS !== 'undefined', 'CAMPAIGN_ENDINGS loaded');
assert(Object.keys(sandbox.window.CAMPAIGN_ENDINGS).length === 4, 'All 4 campaign endings defined');
assert(Object.keys(sandbox.window.TECH_PATHS).length === 6, 'All 6 tech paths defined');

console.log(`\n=====================================================`);
console.log(`AUDIT FINISHED: ${passedChecks} checks passed, ${errors.length} errors.`);
if (errors.length > 0) {
    console.error('Errors found:');
    errors.forEach(e => console.error(' - ' + e));
    process.exit(1);
} else {
    console.log('ALL PHASE 9 AUDIT CHECKS PASSED PERFECTLY (100% OK)!');
}
