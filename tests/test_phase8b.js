/**
 * Phase 8b Test Suite: Orbital Asset Registry, Meaningful Campaign Dilemmas, and Storylet Progression
 * Tests:
 * 1. Asset Registry Schema (12 assets across sectors with complete metadata)
 * 2. Storylet Definitions (8 contract storylets + 4 follow-up storylets)
 * 3. Save v2 Schema & Migration for Storylet state
 * 4. Storylet Eligibility & Non-Repetition Guarantee
 * 5. Immediate Consequences: Credits, Reputation, Campaign Flags, Asset Status
 * 6. Delayed Consequences & Follow-up Storylet Progression
 * 7. End-of-Mission Storylet Triggering
 * 8. Full Persistence across save/load cycles
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Setup mock localStorage & browser environment
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.window = global;
global.localStorage = localStorageMock;

// Mock DOM elements
const elements = {};
global.document = {
    getElementById: (id) => {
        if (!elements[id]) {
            elements[id] = {
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
                innerHTML: '',
                children: [],
                appendChild(c) { this.children.push(c); },
                setAttribute(k, v) { this[k] = v; },
                getAttribute(k) { return this[k]; }
            };
        }
        return elements[id];
    },
    createElement: (tag) => ({
        tag,
        className: '',
        style: {},
        innerHTML: '',
        children: [],
        appendChild(c) { this.children.push(c); },
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k]; }
    }),
    querySelectorAll: () => [],
    addEventListener: () => {}
};

// Load scripts in sandbox
vm.runInThisContext(fs.readFileSync('data/parts.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('data/missions.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('data/donki-snapshot.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('data/storylets.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/campaign.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/data.js', 'utf8'));

console.log('=== PHASE 8b TEST SUITE: ASSET REGISTRY & STORYLETS ===\n');

// ---------------------------------------------------------------------
// TEST 1: Orbital Asset Registry Schema
// ---------------------------------------------------------------------
console.log('--- TEST 1: Asset Registry Schema ---');
assert(ASSET_REGISTRY, 'ASSET_REGISTRY must be defined');
const assetKeys = Object.keys(ASSET_REGISTRY);
assert.strictEqual(assetKeys.length, 12, `Expected 12 assets in registry, found ${assetKeys.length}`);

const expectedAssetIds = [
    'aegis_depot_alpha',
    'iss_heritage_habitat',
    'vanguard_1_probe',
    'starlink_cluster_74',
    'tiangong_cargo_hulk',
    'envisat_derelict',
    'starlink_38_debris_field',
    'fengyun_1c_fragment_alpha',
    'cosmos_2251_hull_core',
    'classified_quantum_satellite',
    'tdrss_relay_omega',
    'kessler_cascade_origin'
];

expectedAssetIds.forEach(id => {
    const asset = ASSET_REGISTRY[id];
    assert(asset, `Asset ${id} must exist`);
    assert(asset.name, `Asset ${id} missing name`);
    assert(asset.sectorId, `Asset ${id} missing sectorId`);
    assert(asset.status, `Asset ${id} missing status`);
    assert(typeof asset.condition === 'number', `Asset ${id} condition must be a number`);
    assert(typeof asset.massKg === 'number', `Asset ${id} massKg must be a number`);
    assert(typeof asset.value === 'number', `Asset ${id} value must be a number`);
    assert(asset.faction, `Asset ${id} missing faction`);
    assert(asset.desc || asset.description, `Asset ${id} missing description`);
});
console.log(`PASS: All 12 assets defined with complete metadata and physical properties.\n`);

// ---------------------------------------------------------------------
// TEST 2: Storylets Definition (8 Contract + 4 Follow-up)
// ---------------------------------------------------------------------
console.log('--- TEST 2: Storylet Definitions ---');
assert(STORYLETS, 'STORYLETS array must be defined');
assert.strictEqual(STORYLETS.length, 12, `Expected 12 storylets, found ${STORYLETS.length}`);

const contractStorylets = STORYLETS.filter(s => s.type === 'contract');
const followUpStorylets = STORYLETS.filter(s => s.type === 'followup');
assert.strictEqual(contractStorylets.length, 8, `Expected 8 contract storylets, found ${contractStorylets.length}`);
assert.strictEqual(followUpStorylets.length, 4, `Expected 4 follow-up storylets, found ${followUpStorylets.length}`);

STORYLETS.forEach(s => {
    assert(s.id, `Storylet missing id`);
    assert(s.title, `Storylet ${s.id} missing title`);
    assert(s.dossier || s.desc || s.description, `Storylet ${s.id} missing narrative dossier/description`);
    assert(Array.isArray(s.choices) && s.choices.length >= 2, `Storylet ${s.id} must have >= 2 choices`);
    s.choices.forEach((c, idx) => {
        assert(c.id, `Storylet ${s.id} choice ${idx} missing id`);
        assert(c.label, `Storylet ${s.id} choice ${idx} missing label`);
        assert(c.stakes || c.desc || c.consequenceText, `Storylet ${s.id} choice ${idx} missing stakes/desc`);
        assert(typeof c.effect === 'function', `Storylet ${s.id} choice ${idx} effect must be a function`);
    });
});
console.log('PASS: All 8 contract storylets and 4 follow-up storylets correctly structured.\n');

// ---------------------------------------------------------------------
// TEST 3: Save v2 Schema & Migration
// ---------------------------------------------------------------------
console.log('--- TEST 3: Save Schema & Migration for Storylets ---');
localStorage.clear();
const defaultSave = OrbitalStorage.getDefaultSave();
assert(defaultSave.assetRegistry, 'defaultSave must include assetRegistry');
assert.strictEqual(Object.keys(defaultSave.assetRegistry).length, 12, 'defaultSave assetRegistry should contain 12 assets');
assert(Array.isArray(defaultSave.resolvedStorylets), 'defaultSave resolvedStorylets must be an array');
assert(Array.isArray(defaultSave.decisionHistory), 'defaultSave decisionHistory must be an array');
assert.strictEqual(defaultSave.activeDilemmaId, null, 'defaultSave activeDilemmaId should be null');

// Test migrating legacy save without storylet fields
const legacySave = {
    credits: 500,
    saveVersion: 1,
    campaignFlags: {}
};
const migrated = OrbitalStorage.migrateToV2(legacySave);
assert(migrated.assetRegistry, 'migrated save must gain assetRegistry');
assert.strictEqual(Object.keys(migrated.assetRegistry).length, 12, 'migrated assetRegistry should contain 12 assets');
assert(Array.isArray(migrated.resolvedStorylets), 'migrated save must gain resolvedStorylets array');
assert(Array.isArray(migrated.decisionHistory), 'migrated save must gain decisionHistory array');
console.log('PASS: Save v2 initialization and migration correctly backfill storylet data.\n');

// ---------------------------------------------------------------------
// TEST 4: Storylet Eligibility & Non-Repetition Guarantee
// ---------------------------------------------------------------------
console.log('--- TEST 4: Eligibility & Non-Repetition ---');
const save = OrbitalStorage.getDefaultSave();
save.missionsCompleted = 2;

// Contract storylet should be eligible
const eligible = StoryletManager.getEligibleStorylet(save);
assert(eligible, 'An eligible storylet should be found');
assert(eligible.id, 'Eligible storylet must have an id');

// Mark all storylets as resolved
save.resolvedStorylets = STORYLETS.map(s => s.id);
const noneEligible = StoryletManager.getEligibleStorylet(save);
assert.strictEqual(noneEligible, null, 'No storylets should be eligible when all are resolved');

// Clear resolved list and test single storylet resolution exclusion
save.resolvedStorylets = ['STORYLET_01'];
const nextEligible = StoryletManager.getEligibleStorylet(save);
assert.notStrictEqual(nextEligible.id, 'STORYLET_01', 'Resolved storylet STORYLET_01 must never be selected again');
console.log('PASS: Storylet eligibility logic honors conditions and guarantees non-repetition.\n');

// ---------------------------------------------------------------------
// TEST 5: Choice Resolution & Immediate Stakes
// ---------------------------------------------------------------------
console.log('--- TEST 5: Choice Resolution & Immediate Stakes ---');
const testSave = OrbitalStorage.getDefaultSave();
testSave.credits = 1000;
testSave.reputation = { agency: 50, commercial: 50, public: 50 };

// Resolve STORYLET_01 Choice A (Sell to Commercial Telecom)
// Effect: +350 Scrap, +1 Chips, +12 Commercial, -6 Agency
const result = StoryletManager.resolveStorylet(testSave, 'STORYLET_01', 'choice_a');

assert(result.success, 'resolveStorylet should succeed');
assert.strictEqual(result.storylet.id, 'STORYLET_01');
assert.strictEqual(testSave.credits, 1350, 'Credits should increase by 350');
assert.strictEqual(testSave.materials.chips, 1, 'Chips should increase by 1');
assert.strictEqual(testSave.reputation.commercial, 62, 'Commercial reputation should increase by 12');
assert.strictEqual(testSave.reputation.agency, 44, 'Agency reputation should decrease by 6');
assert(testSave.campaignFlags.derelict_sold_to_commercial, 'campaignFlag derelict_sold_to_commercial should be set');
assert(testSave.resolvedStorylets.includes('STORYLET_01'), 'STORYLET_01 must be added to resolvedStorylets');
assert.strictEqual(testSave.decisionHistory.length, 1, 'decisionHistory should record 1 decision');
assert.strictEqual(testSave.decisionHistory[0].storyletId, 'STORYLET_01');
assert.strictEqual(testSave.decisionHistory[0].choiceId, 'choice_a');
console.log('PASS: Immediate stakes (credits, materials, reputation, campaign flags) apply correctly.\n');

// ---------------------------------------------------------------------
// TEST 6: Delayed Consequences & Follow-Up Storylet Progression
// ---------------------------------------------------------------------
console.log('--- TEST 6: Delayed Consequences & Follow-up Storylets ---');
const followupSave = OrbitalStorage.getDefaultSave();

// Follow-up STORYLET_09 requires flag derelict_open_source: true
const storylet09 = STORYLETS.find(s => s.id === 'STORYLET_09');
assert.strictEqual(storylet09.conditions(followupSave), false, 'STORYLET_09 should NOT be eligible initially');

// Resolve STORYLET_01 choice B (Release to open civil registry)
StoryletManager.resolveStorylet(followupSave, 'STORYLET_01', 'choice_b');
assert.strictEqual(followupSave.campaignFlags.derelict_open_source, true, 'derelict_open_source flag should be true');

// Now STORYLET_09 should become eligible!
assert.strictEqual(storylet09.conditions(followupSave), true, 'STORYLET_09 should be eligible after flag is set');

// When searching for eligible storylets, follow-up storylets take priority!
const topEligible = StoryletManager.getEligibleStorylet(followupSave);
assert.strictEqual(topEligible.id, 'STORYLET_09', 'Follow-up storylet STORYLET_09 should take priority');

// Resolve STORYLET_09 choice A
const fResult = StoryletManager.resolveStorylet(followupSave, 'STORYLET_09', 'choice_a');
assert(fResult.success);
assert(followupSave.campaignFlags.open_source_radar_active, 'Follow-up flag open_source_radar_active set');
assert(followupSave.resolvedStorylets.includes('STORYLET_09'), 'STORYLET_09 marked resolved');
console.log('PASS: Follow-up storylets trigger via narrative flags and prioritize sequential progression.\n');

// ---------------------------------------------------------------------
// TEST 7: End-of-Mission Storylet Triggering
// ---------------------------------------------------------------------
console.log('--- TEST 7: End-of-Mission Storylet Triggering ---');
const missionSave = OrbitalStorage.getDefaultSave();
assert.strictEqual(missionSave.activeDilemmaId, null);

// Simulate mission outcome trigger
const mockScene = { currentSectorId: 'leo_station' };
StoryletManager.onMissionCompleted(missionSave, mockScene, true);

// If an eligible storylet was found, activeDilemmaId is populated
assert(missionSave.activeDilemmaId !== null, 'onMissionCompleted should assign an activeDilemmaId');
assert(STORYLETS.some(s => s.id === missionSave.activeDilemmaId), 'activeDilemmaId must correspond to a valid storylet');
console.log(`PASS: onMissionCompleted queued dilemma: ${missionSave.activeDilemmaId}.\n`);

// ---------------------------------------------------------------------
// TEST 8: Full Save / Load Persistence Cycle
// ---------------------------------------------------------------------
console.log('--- TEST 8: Persistence across Save / Load ---');
OrbitalStorage.save(testSave);
const loadedSave = OrbitalStorage.load();

assert(loadedSave.assetRegistry, 'Loaded save must contain assetRegistry');
assert.strictEqual(loadedSave.assetRegistry.aegis_depot_alpha.condition, 100, 'Asset condition must persist across reload');
assert(loadedSave.resolvedStorylets.includes('STORYLET_01'), 'resolvedStorylets must persist across reload');
assert.strictEqual(loadedSave.decisionHistory.length, 1, 'decisionHistory must persist across reload');
assert.strictEqual(loadedSave.credits, 1350, 'Credits modifications must persist across reload');
console.log('PASS: Asset registry, resolved storylets, and decision history persist across reload.\n');

console.log('=====================================================');
console.log('ALL PHASE 8b TESTS PASSED SUCCESSFULLY!');
console.log('=====================================================\n');
